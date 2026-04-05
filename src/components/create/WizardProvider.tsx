"use client";

import { create } from "zustand";

interface WizardState {
  step: number;
  childName: string;
  childAge: number;
  childGender: "boy" | "girl" | "neutral" | "";
  photoFile: File | null;
  photoPreviewUrl: string | null;
  selectedThemeId: string | null;
  contextualAnswers: Record<string, string>;
  email: string;
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
  setSelectedTheme: (themeId: string) => void;
  setContextualAnswer: (questionId: string, answer: string) => void;
  setEmail: (email: string) => void;
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
  selectedThemeId: null,
  contextualAnswers: {},
  email: "",
  bookId: null,
  isGenerating: false,
  generationStep: "",
};

export const useWizardStore = create<WizardState>((set) => ({
  ...initialState,

  setStep: (step) => set({ step }),
  nextStep: () => set((state) => ({ step: state.step + 1 })),
  prevStep: () => set((state) => ({ step: Math.max(1, state.step - 1) })),
  setChildName: (childName) => set({ childName }),
  setChildAge: (childAge) => set({ childAge }),
  setChildGender: (childGender) => set({ childGender }),
  setPhoto: (photoFile, photoPreviewUrl) => set({ photoFile, photoPreviewUrl }),
  setSelectedTheme: (selectedThemeId) =>
    set({ selectedThemeId, contextualAnswers: {} }),
  setContextualAnswer: (questionId, answer) =>
    set((state) => ({
      contextualAnswers: { ...state.contextualAnswers, [questionId]: answer },
    })),
  setEmail: (email) => set({ email }),
  setBookId: (bookId) => set({ bookId }),
  setGenerating: (isGenerating, generationStep) =>
    set({ isGenerating, generationStep: generationStep ?? "" }),
  reset: () => set(initialState),
}));
