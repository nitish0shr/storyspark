import { NextRequest, NextResponse } from "next/server";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { isOpenAIConfigured } from "@/lib/openai";
import { generateNarration } from "@/services/tts-narration";

export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: "Database not configured." },
        { status: 503 }
      );
    }

    if (!isOpenAIConfigured()) {
      return NextResponse.json(
        { error: "OpenAI not configured." },
        { status: 503 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { bookId } = body;

    if (!bookId || typeof bookId !== "string") {
      return NextResponse.json(
        { error: "bookId is required" },
        { status: 400 }
      );
    }

    const { data: book, error: bookError } = await supabaseAdmin
      .from("books")
      .select("id, user_id, status, is_purchased")
      .eq("id", bookId)
      .single();

    if (bookError || !book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    if (book.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!book.is_purchased) {
      return NextResponse.json(
        { error: "Audio narration is only available for purchased books" },
        { status: 403 }
      );
    }

    const eligibleStatuses = ["generating", "complete", "completed"];
    if (!eligibleStatuses.includes(book.status)) {
      return NextResponse.json(
        { error: "Book is not ready for audio generation" },
        { status: 409 }
      );
    }

    const { data: pages, error: pagesError } = await supabaseAdmin
      .from("book_pages")
      .select("page_number, text, audio_url")
      .eq("book_id", bookId)
      .order("page_number");

    if (pagesError || !pages || pages.length === 0) {
      return NextResponse.json(
        { error: "No pages found for this book" },
        { status: 409 }
      );
    }

    const pagesNeedingAudio = pages.filter(
      (p) => !p.audio_url && p.text && p.text.trim().length > 0
    );

    if (pagesNeedingAudio.length === 0) {
      const audioUrls = pages
        .filter((p) => p.audio_url)
        .map((p) => ({
          pageNumber: p.page_number,
          audioUrl: p.audio_url,
        }));
      return NextResponse.json({ audioUrls, alreadyGenerated: true });
    }

    const audioUrls = await generateNarration(
      bookId,
      pagesNeedingAudio.map((p) => ({
        pageNumber: p.page_number,
        text: p.text,
      }))
    );

    return NextResponse.json({ audioUrls }, { status: 200 });
  } catch (error) {
    console.error("Generate audio error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
