import { openai } from "@/lib/openai";
import { supabaseAdmin } from "@/lib/supabase/admin";

const TTS_MODEL = "tts-1";
const TTS_VOICE = "shimmer";
const MAX_CONCURRENT = 2;

class Semaphore {
  private queue: (() => void)[] = [];
  private running = 0;

  constructor(private max: number) {}

  async acquire(): Promise<void> {
    if (this.running < this.max) {
      this.running++;
      return;
    }
    return new Promise<void>((resolve) => {
      this.queue.push(() => {
        this.running++;
        resolve();
      });
    });
  }

  release(): void {
    this.running--;
    const next = this.queue.shift();
    if (next) next();
  }
}

async function generatePageAudio(
  text: string,
  bookId: string,
  pageNumber: number
): Promise<string> {
  const response = await openai.audio.speech.create({
    model: TTS_MODEL,
    voice: TTS_VOICE,
    input: text,
    response_format: "mp3",
    speed: 0.95,
  });

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const filePath = `books/${bookId}/audio/page-${pageNumber}.mp3`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from("books")
    .upload(filePath, buffer, {
      contentType: "audio/mpeg",
      upsert: true,
    });

  if (uploadError) {
    throw new Error(
      `Failed to upload audio for page ${pageNumber}: ${uploadError.message}`
    );
  }

  const {
    data: { publicUrl },
  } = supabaseAdmin.storage.from("books").getPublicUrl(filePath);

  return publicUrl;
}

export async function generateNarration(
  bookId: string,
  pages: { pageNumber: number; text: string }[]
): Promise<{ pageNumber: number; audioUrl: string }[]> {
  const semaphore = new Semaphore(MAX_CONCURRENT);
  const results: { pageNumber: number; audioUrl: string }[] = [];

  const tasks = pages.map(async (page) => {
    await semaphore.acquire();
    try {
      console.log(
        `Generating audio for book ${bookId}, page ${page.pageNumber}...`
      );
      const audioUrl = await generatePageAudio(
        page.text,
        bookId,
        page.pageNumber
      );

      const { data: updated, error: updateError } = await supabaseAdmin
        .from("book_pages")
        .update({ audio_url: audioUrl })
        .eq("book_id", bookId)
        .eq("page_number", page.pageNumber)
        .select("id");

      if (updateError) {
        console.error(
          `Failed to persist audio_url for book ${bookId}, page ${page.pageNumber}:`,
          updateError
        );
        throw new Error(
          `Failed to save audio URL for page ${page.pageNumber}: ${updateError.message}`
        );
      }

      if (!updated || updated.length === 0) {
        throw new Error(
          `No book_pages row found for book ${bookId}, page ${page.pageNumber}`
        );
      }

      results.push({ pageNumber: page.pageNumber, audioUrl });
      console.log(
        `Audio generated for book ${bookId}, page ${page.pageNumber}`
      );
    } finally {
      semaphore.release();
    }
  });

  await Promise.all(tasks);

  return results.sort((a, b) => a.pageNumber - b.pageNumber);
}
