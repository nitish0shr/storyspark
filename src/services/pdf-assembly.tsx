import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { BookPage } from "@/types/book";
import { getThemeById } from "@/data/themes";

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
  themeId: string;
  themeName: string;
  storyPages: BookPage[];
  illustrationUrls: (string | null)[];
}

function BookPdfDocument({
  childName,
  themeId,
  themeName,
  storyPages,
  illustrationUrls,
}: BookPdfProps) {
  const colors = THEME_COLORS[themeId] || THEME_COLORS["kindness-courage"];

  return h(
    Document,
    { title: `${childName}'s ${themeName} - StorySpark`, author: "StorySpark" },
    // Cover Page
    h(
      Page,
      { size: "A4", style: styles.page },
      h(
        View,
        { style: [styles.coverPage, { backgroundColor: colors.primary }] },
        h(
          Text,
          { style: [styles.coverTitle, { color: colors.text }] },
          `${childName}'s\n${themeName}`
        ),
        h(
          Text,
          { style: [styles.coverSubtitle, { color: colors.text }] },
          `A personalized story created just for ${childName}`
        )
      )
    ),

    // Interior Pages
    ...storyPages.map((page, idx) => {
      const imageUrl = illustrationUrls[idx];

      return h(
        Page,
        { key: page.pageNumber, size: "A4", style: styles.page },
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
      { size: "A4", style: styles.page },
      h(
        View,
        { style: styles.backPage },
        h(
          Text,
          { style: styles.backDedication },
          `Created with love for ${childName}`
        ),
        h(Text, { style: styles.backLogo }, "StorySpark"),
        h(
          Text,
          { style: styles.backBrand },
          "Personalized stories that spark imagination"
        ),
        h(
          Text,
          { style: [styles.backBrand, { marginTop: 20, fontSize: 11 }] },
          "storyspark.com"
        )
      )
    )
  );
}

// ──────────────────────────────────────────────────────────────
// Public API
// ────────────────────────────────────────────────────────────���─

export async function assemblePdf(
  bookId: string
): Promise<{ pdfUrl: string; pdfPrintUrl: string }> {
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

  const storyPages: BookPage[] = book.story_text || [];
  const illustrationUrls: (string | null)[] = book.illustration_urls || [];
  const theme = getThemeById(book.theme_id);
  const themeName = theme?.name || "Adventure";

  if (storyPages.length === 0) {
    throw new Error("Cannot assemble PDF: book has no story text");
  }

  const pdfElement = h(BookPdfDocument, {
    childName: child.name,
    themeId: book.theme_id,
    themeName,
    storyPages,
    illustrationUrls,
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfBuffer = await renderToBuffer(pdfElement as any);

  // Upload to Supabase Storage
  const storagePath = `books/${bookId}/storyspark-book.pdf`;
  const printPath = `books/${bookId}/storyspark-book-print.pdf`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from("books")
    .upload(storagePath, pdfBuffer, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`Failed to upload PDF: ${uploadError.message}`);
  }

  const { error: printUploadError } = await supabaseAdmin.storage
    .from("books")
    .upload(printPath, pdfBuffer, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (printUploadError) {
    throw new Error(`Failed to upload print PDF: ${printUploadError.message}`);
  }

  const { data: pdfUrlData } = supabaseAdmin.storage
    .from("books")
    .getPublicUrl(storagePath);

  const { data: printUrlData } = supabaseAdmin.storage
    .from("books")
    .getPublicUrl(printPath);

  return {
    pdfUrl: pdfUrlData.publicUrl,
    pdfPrintUrl: printUrlData.publicUrl,
  };
}
