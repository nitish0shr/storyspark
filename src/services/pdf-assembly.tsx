import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  Font,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { BookPage } from "@/types/book";
import { getThemeById } from "@/data/themes";
import { getLanguageByCode } from "@/data/languages";
import {
  createFinalBookSignedUrl,
  FINAL_BOOK_BUCKET,
} from "@/lib/storage-urls";

Font.register({
  family: "NotoSans",
  fonts: [
    {
      src: "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/notosans/NotoSans%5Bwdth%2Cwght%5D.ttf",
      fontWeight: 400,
    },
    {
      src: "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/notosans/NotoSans-Bold.ttf",
      fontWeight: 700,
    },
  ],
});

Font.register({
  family: "NotoSansDevanagari",
  src: "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/notosansdevanagari/NotoSansDevanagari%5Bwdth%2Cwght%5D.ttf",
});

Font.register({
  family: "NotoSansSC",
  src: "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/notosanssc/NotoSansSC%5Bwght%5D.ttf",
});

function getFontFamily(language: string): string {
  const lang = getLanguageByCode(language);
  if (!lang) return "NotoSans";
  switch (lang.script) {
    case "devanagari":
      return "NotoSansDevanagari";
    case "cjk":
      return "NotoSansSC";
    default:
      return "NotoSans";
  }
}

// ────────────────────────���─────────────────────────────────────
// Styles
// ──────────────────────────────────────────────────────────────

const THEME_COLORS: Record<
  string,
  { primary: string; secondary: string; text: string }
> = {
  "space-adventure": {
    primary: "#312e81",
    secondary: "#6d28d9",
    text: "#e0e7ff",
  },
  "dinosaur-discovery": {
    primary: "#14532d",
    secondary: "#16a34a",
    text: "#dcfce7",
  },
  "under-the-sea": {
    primary: "#164e63",
    secondary: "#0891b2",
    text: "#cffafe",
  },
  "royal-quest": {
    primary: "#78350f",
    secondary: "#d97706",
    text: "#fef3c7",
  },
  "superhero-origin": {
    primary: "#7f1d1d",
    secondary: "#dc2626",
    text: "#fee2e2",
  },
  "kindness-courage": {
    primary: "#831843",
    secondary: "#db2777",
    text: "#fce7f3",
  },
  "pirate-treasure": {
    primary: "#78350f",
    secondary: "#ca8a04",
    text: "#fefce8",
  },
  "fairy-garden": {
    primary: "#4c1d95",
    secondary: "#a855f7",
    text: "#f5f3ff",
  },
  "safari-adventure": {
    primary: "#7c2d12",
    secondary: "#ea580c",
    text: "#fff7ed",
  },
  "time-travel": {
    primary: "#134e4a",
    secondary: "#0d9488",
    text: "#f0fdfa",
  },
  "christmas-magic": {
    primary: "#7f1d1d",
    secondary: "#15803d",
    text: "#fef2f2",
  },
  "halloween-adventure": {
    primary: "#7c2d12",
    secondary: "#9333ea",
    text: "#fff7ed",
  },
};

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#FFFFFF",
    width: "100%",
    height: "100%",
  },
  coverPage: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
    padding: 40,
  },
  coverTitle: {
    fontSize: 36,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 1.3,
  },
  coverSubtitle: {
    fontSize: 18,
    textAlign: "center",
    opacity: 0.9,
  },
  interiorPage: {
    flexDirection: "column",
    width: "100%",
    height: "100%",
  },
  illustrationContainer: {
    width: "100%",
    height: "60%",
    backgroundColor: "#f3f4f6",
  },
  illustration: {
    width: "100%",
    height: "100%",
    objectFit: "cover" as const,
  },
  textContainer: {
    width: "100%",
    height: "40%",
    padding: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  pageText: {
    fontSize: 16,
    lineHeight: 1.6,
    textAlign: "center",
    color: "#1f2937",
    maxWidth: 440,
  },
  pageNumber: {
    position: "absolute" as const,
    bottom: 15,
    right: 20,
    fontSize: 10,
    color: "#9ca3af",
  },
  dedicationPage: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
    padding: 60,
  },
  dedicationOrnament: {
    fontSize: 32,
    textAlign: "center",
    marginBottom: 20,
    opacity: 0.3,
  },
  dedicationText: {
    fontSize: 18,
    textAlign: "center",
    fontStyle: "italic",
    lineHeight: 1.8,
    maxWidth: 360,
  },
  dedicationOrnamentBottom: {
    fontSize: 32,
    textAlign: "center",
    marginTop: 20,
    opacity: 0.3,
  },
  backPage: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
    padding: 40,
    backgroundColor: "#fafafa",
  },
  backDedication: {
    fontSize: 20,
    textAlign: "center",
    color: "#374151",
    marginBottom: 30,
    fontStyle: "italic",
  },
  backBrand: {
    fontSize: 14,
    textAlign: "center",
    color: "#9ca3af",
    marginTop: 10,
  },
  backLogo: {
    fontSize: 22,
    textAlign: "center",
    color: "#6b7280",
    fontWeight: "bold",
    marginBottom: 4,
  },
});

// ───────────────────────────────────���──────────────────────────
// PDF Document Component (using createElement to avoid SWC issues)
// ──────────────────────────────────────────────────────────────

const h = React.createElement;

interface BookPdfProps {
  childName: string;
  secondChildName?: string | null;
  themeId: string;
  themeName: string;
  storyPages: BookPage[];
  illustrationUrls: (string | null)[];
  dedication?: string | null;
  language?: string;
}

function BookPdfDocument({
  childName,
  secondChildName,
  themeId,
  themeName,
  storyPages,
  illustrationUrls,
  dedication,
  language = "en",
}: BookPdfProps) {
  const colors = THEME_COLORS[themeId] || THEME_COLORS["kindness-courage"];
  const fontFamily = getFontFamily(language);

  const pageStyle = [styles.page, { fontFamily }];

  const displayNames = secondChildName
    ? `${childName} & ${secondChildName}`
    : childName;

  return h(
    Document,
    { title: `${displayNames}'s ${themeName} - Starmee`, author: "Starmee" },
    h(
      Page,
      { size: "A4", style: pageStyle },
      h(
        View,
        { style: [styles.coverPage, { backgroundColor: colors.primary }] },
        h(
          Text,
          { style: [styles.coverTitle, { color: colors.text }] },
          `${displayNames}'s\n${themeName}`
        ),
        h(
          Text,
          { style: [styles.coverSubtitle, { color: colors.text }] },
          secondChildName
            ? `A personalised story created just for ${childName} and ${secondChildName}`
            : `A personalised story created just for ${childName}`
        )
      )
    ),

    // Dedication Page (if provided)
    ...(() => {
      const trimmedDedication = dedication?.trim();
      if (!trimmedDedication) return [];
      return [
        h(
          Page,
          { key: "dedication", size: "A4", style: pageStyle },
          h(
            View,
            { style: [styles.dedicationPage, { backgroundColor: colors.primary }] },
            h(Text, { style: [styles.dedicationOrnament, { color: colors.text }] }, "\u2766"),
            h(
              Text,
              { style: [styles.dedicationText, { color: colors.text }] },
              `\u201C${trimmedDedication}\u201D`
            ),
            h(Text, { style: [styles.dedicationOrnamentBottom, { color: colors.text }] }, "\u2766")
          )
        ),
      ];
    })(),

    // Interior Pages
    ...storyPages.map((page, idx) => {
      const imageUrl = illustrationUrls[idx];

      return h(
        Page,
        { key: page.pageNumber, size: "A4", style: pageStyle },
        h(
          View,
          { style: styles.interiorPage },
          // Illustration area (top 60%)
          h(
            View,
            { style: styles.illustrationContainer },
            imageUrl
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ? h(Image, { src: imageUrl, style: styles.illustration } as any)
              : h(View, {
                  style: [
                    styles.illustration,
                    { backgroundColor: colors.secondary, opacity: 0.15 },
                  ],
                })
          ),
          // Text area (bottom 40%)
          h(
            View,
            { style: styles.textContainer },
            h(Text, { style: styles.pageText }, page.text)
          )
        ),
        h(Text, { style: styles.pageNumber }, String(page.pageNumber))
      );
    }),

    // Back Cover
    h(
      Page,
      { size: "A4", style: pageStyle },
      h(
        View,
        { style: styles.backPage },
        h(
          Text,
          { style: styles.backDedication },
          secondChildName
            ? `Created with love for ${childName} and ${secondChildName}`
            : `Created with love for ${childName}`
        ),
        h(Text, { style: styles.backLogo }, "Starmee"),
        h(
          Text,
          { style: styles.backBrand },
          "Personalised stories that spark imagination"
        ),
        h(
          Text,
          { style: [styles.backBrand, { marginTop: 20, fontSize: 11 }] },
          "starmeestories.com"
        )
      )
    )
  );
}

// ──────────────────────────────────────────────────────────────
// Public API
// ────────────────────────────────────────────────────────────���─

export async function assemblePdf(
  bookId: string,
  options: { versionId?: string | null } = {},
): Promise<{
  pdfUrl: string;
  pdfPrintUrl: string;
  storagePath: string;
  printStoragePath: string;
}> {
  const { data: book, error: bookError } = await supabaseAdmin
    .from("books")
    .select("*")
    .eq("id", bookId)
    .single();

  if (bookError || !book) {
    throw new Error(`Failed to fetch book ${bookId}: ${bookError?.message}`);
  }

  const { data: child, error: childError } = await supabaseAdmin
    .from("child_profiles")
    .select("name")
    .eq("id", book.child_profile_id)
    .single();

  if (childError || !child) {
    throw new Error(
      `Failed to fetch child for book ${bookId}: ${childError?.message}`
    );
  }

  let secondChildName: string | null = null;
  if (book.second_child_profile_id) {
    const { data: sc } = await supabaseAdmin
      .from("child_profiles")
      .select("name")
      .eq("id", book.second_child_profile_id)
      .single();
    if (sc) {
      secondChildName = sc.name;
    }
  }

  let storyPages: BookPage[] = book.story_text || [];
  let illustrationUrls: (string | null)[] = book.illustration_urls || [];
  if (options.versionId) {
    const { data: version, error: versionError } = await supabaseAdmin
      .from("book_versions")
      .select("id, book_id, page_count, is_complete")
      .eq("id", options.versionId)
      .eq("book_id", bookId)
      .maybeSingle();
    if (versionError || !version || !version.is_complete) {
      throw new Error(
        `Cannot assemble PDF: immutable version ${options.versionId} is missing or incomplete`,
      );
    }
    const { data: versionPages, error: pageError } = await supabaseAdmin
      .from("book_version_pages")
      .select("page_number, text_content, illustration_url")
      .eq("version_id", options.versionId)
      .order("page_number", { ascending: true });
    if (
      pageError ||
      !versionPages ||
      versionPages.length !== version.page_count ||
      versionPages.some(
        (page, index) =>
          page.page_number !== index + 1 ||
          !page.text_content?.trim() ||
          !page.illustration_url?.trim(),
      )
    ) {
      throw new Error(
        `Cannot assemble PDF: immutable version ${options.versionId} does not have a complete ordered page set`,
      );
    }
    storyPages = versionPages.map((page) => ({
      pageNumber: page.page_number,
      text: page.text_content,
    }));
    illustrationUrls = versionPages.map((page) => page.illustration_url);
  }
  const theme = getThemeById(book.theme_id);
  const themeName = theme?.name || "Adventure";

  if (storyPages.length === 0) {
    throw new Error("Cannot assemble PDF: book has no story text");
  }

  const pdfElement = h(BookPdfDocument, {
    childName: child.name,
    secondChildName,
    themeId: book.theme_id,
    themeName,
    storyPages,
    illustrationUrls,
    dedication: book.dedication || null,
    language: book.language || "en",
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfBuffer = await renderToBuffer(pdfElement as any);

  // Upload to Supabase Storage
  const versionSegment = options.versionId ?? "legacy";
  const storagePath = `books/${bookId}/versions/${versionSegment}/storyspark-book.pdf`;
  const printPath = `books/${bookId}/versions/${versionSegment}/storyspark-book-print.pdf`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from(FINAL_BOOK_BUCKET)
    .upload(storagePath, pdfBuffer, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`Failed to upload PDF: ${uploadError.message}`);
  }

  const { error: printUploadError } = await supabaseAdmin.storage
    .from(FINAL_BOOK_BUCKET)
    .upload(printPath, pdfBuffer, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (printUploadError) {
    throw new Error(`Failed to upload print PDF: ${printUploadError.message}`);
  }

  const [pdfUrl, pdfPrintUrl] = await Promise.all([
    createFinalBookSignedUrl(storagePath),
    createFinalBookSignedUrl(printPath),
  ]);
  if (!pdfUrl || !pdfPrintUrl) {
    throw new Error("Failed to mint private signed URLs for assembled PDFs");
  }

  return {
    pdfUrl,
    pdfPrintUrl,
    storagePath,
    printStoragePath: printPath,
  };
}
