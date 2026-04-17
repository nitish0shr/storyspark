"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WizardState {
  step: number;
  childName: string;
  childAge: number;
  childGender: "boy" | "girl" | "neutral" | "";
  photoFile: File | null;
  photoPreviewUrl: string | null;
  photoUrl: string | null; // server URL after upload
  selectedThemeId: string | null;
  contextualAnswers: Record<string, string>;
  email: string;
  childProfileId: string | null;
  bookId: string | null;
  isGenerating: boolean;
  generationStep: string;
  // actions
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  setChildName: (name: string) => void;
  setChildAge: (age: number) => void;
  setChildGender: (gender: "boy" | "girl" | "neutral") => void;
  setPhoto: (file: File, previewUrl: string) => void;
  setPhotoUrl: (url: string) => void;
  setSelectedTheme: (themeId: string) => void;
  setContextualAnswer: (questionId: string, answer: string) => void;
  setEmail: (email: string) => void;
  setChildProfileId: (id: string) => void;
  setBookId: (id: string) => void;
  setGenerating: (generating: boolean, step?: string) => void;
  reset: () => void;
}

const initialState = {
  step: 1,
  childName: "",
  childAge: -1,
  childGender: "" as const,
  photoFile: null,
  photoPreviewUrl: null,
  photoUrl: null,
  selectedThemeId: null,
  contextualAnswers: {},
  email: "",
  childProfileId: null,
  bookId: null,
  isGenerating: false,
  generationStep: "",
};

export const useWizardStore = create<WizardState>()(
  persist(
    (set) => ({
      ...initialState,

      setStep: (step) => set({ step }),
      nextStep: () => set((state) => ({ step: state.step + 1 })),
      prevStep: () => set((state) => ({ step: Math.max(1, state.step - 1) })),
      setChildName: (childName) => set({ childName }),
      setChildAge: (childAge) => set({ childAge }),
      setChildGender: (childGender) => set({ childGender }),
      setPhoto: (photoFile, photoPreviewUrl) =>
        set({ photoFile, photoPreviewUrl }),
      setPhotoUrl: (photoUrl) => set({ photoUrl }),
      setSelectedTheme: (selectedThemeId) =>
        set({ selectedThemeId, contextualAnswers: {} }),
      setContextualAnswer: (questionId, answer) =>
        set((state) => ({
          contextualAnswers: {
            ...state.contextualAnswers,
            [questionId]: answer,
          },
        })),
      setEmail: (email) => set({ email }),
      setChildProfileId: (childProfileId) => set({ childProfileId }),
      setBookId: (bookId) => set({ bookId }),
      setGenerating: (isGenerating, generationStep) =>
        set({ isGenerating, generationStep: generationStep ?? "" }),
      reset: () => set(initialState),
    }),
    {
      name: "starmee-wizard",
      partialize: (state) => ({
        // Persist user inputs only — skip transient/non-serializable fields
        step: state.step,
        childName: state.childName,
        childAge: state.childAge,
        childGender: state.childGender,
        photoUrl: state.photoUrl,
        selectedThemeId: state.selectedThemeId,
        contextualAnswers: state.contextualAnswers,
        email: state.email,
        childProfileId: state.childProfileId,
        bookId: state.bookId,
        // Exclude: photoFile (File object), photoPreviewUrl (blob URL),
        // isGenerating, generationStep (transient UI state)
      }),
    }
  )
);
