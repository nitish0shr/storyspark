export interface BookPage {
  pageNumber: number;
  text: string;
}

export type BookStatus =
  | "draft"
  | "preview_generating"
  | "preview_ready"
  | "generating"
  | "complete"
  | "failed";

export interface Book {
  id: string;
  userId: string;
  childProfileId: string;
  themeId: string;
  status: BookStatus;
  contextualAnswers: Record<string, string> | null;
  storyText: BookPage[] | null;
  illustrationUrls: string[] | null;
  previewPages: BookPage[] | null;
  pdfUrl: string | null;
  pdfPrintUrl: string | null;
  pageCount: number;
  createdAt: string;
  updatedAt: string;
}
