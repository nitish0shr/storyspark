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
  photoUrl: string | null;
  hasSecondChild: boolean;
  secondChildName: string;
  secondChildAge: number;
  secondChildGender: "boy" | "girl" | "neutral" | "";
  secondChildPhotoFile: File | null;
  secondChildPhotoPreviewUrl: string | null;
  secondChildPhotoUrl: string | null;
  selectedThemeId: string | null;
  contextualAnswers: Record<string, string>;
  dedication: string;
  language: string;
  email: string;
  childProfileId: string | null;
  secondChildProfileId: string | null;
  bookId: string | null;
  isGenerating: boolean;
  generationStep: string;
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  setChildName: (name: string) => void;
  setChildAge: (age: number) => void;
  setChildGender: (gender: "boy" | "girl" | "neutral") => void;
  setPhoto: (file: File, previewUrl: string) => void;
  setPhotoUrl: (url: string) => void;
  setHasSecondChild: (has: boolean) => void;
  setSecondChildName: (name: string) => void;
  setSecondChildAge: (age: number) => void;
  setSecondChildGender: (gender: "boy" | "girl" | "neutral") => void;
  setSecondChildPhoto: (file: File, previewUrl: string) => void;
  setSecondChildPhotoUrl: (url: string) => void;
  setSelectedTheme: (themeId: string) => void;
  setContextualAnswer: (questionId: string, answer: string) => void;
  setDedication: (dedication: string) => void;
  setLanguage: (language: string) => void;
  setEmail: (email: string) => void;
  setChildProfileId: (id: string) => void;
  setSecondChildProfileId: (id: string) => void;
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
  hasSecondChild: false,
  secondChildName: "",
  secondChildAge: -1,
  secondChildGender: "" as const,
  secondChildPhotoFile: null,
  secondChildPhotoPreviewUrl: null,
  secondChildPhotoUrl: null,
  selectedThemeId: null,
  contextualAnswers: {},
  dedication: "",
  language: "en",
  email: "",
  childProfileId: null,
  secondChildProfileId: null,
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
      setHasSecondChild: (hasSecondChild) =>
        set(hasSecondChild ? { hasSecondChild } : {
          hasSecondChild: false,
          secondChildName: "",
          secondChildAge: -1,
          secondChildGender: "" as const,
          secondChildPhotoFile: null,
          secondChildPhotoPreviewUrl: null,
          secondChildPhotoUrl: null,
        }),
      setSecondChildName: (secondChildName) => set({ secondChildName }),
      setSecondChildAge: (secondChildAge) => set({ secondChildAge }),
      setSecondChildGender: (secondChildGender) => set({ secondChildGender }),
      setSecondChildPhoto: (secondChildPhotoFile, secondChildPhotoPreviewUrl) =>
        set({ secondChildPhotoFile, secondChildPhotoPreviewUrl }),
      setSecondChildPhotoUrl: (secondChildPhotoUrl) => set({ secondChildPhotoUrl }),
      setSelectedTheme: (selectedThemeId) =>
        set({ selectedThemeId, contextualAnswers: {} }),
      setContextualAnswer: (questionId, answer) =>
        set((state) => ({
          contextualAnswers: {
            ...state.contextualAnswers,
            [questionId]: answer,
          },
        })),
      setDedication: (dedication) => set({ dedication }),
      setLanguage: (language) => set({ language }),
      setEmail: (email) => set({ email }),
      setChildProfileId: (childProfileId) => set({ childProfileId }),
      setSecondChildProfileId: (secondChildProfileId) => set({ secondChildProfileId }),
      setBookId: (bookId) => set({ bookId }),
      setGenerating: (isGenerating, generationStep) =>
        set({ isGenerating, generationStep: generationStep ?? "" }),
      reset: () => set(initialState),
    }),
    {
      name: "storyspark-wizard",
      partialize: (state) => ({
        // Persist user inputs only — skip transient/non-serializable fields
        step: state.step,
        childName: state.childName,
        childAge: state.childAge,
        childGender: state.childGender,
        photoUrl: state.photoUrl,
        hasSecondChild: state.hasSecondChild,
        secondChildName: state.secondChildName,
        secondChildAge: state.secondChildAge,
        secondChildGender: state.secondChildGender,
        secondChildPhotoUrl: state.secondChildPhotoUrl,
        selectedThemeId: state.selectedThemeId,
        contextualAnswers: state.contextualAnswers,
        dedication: state.dedication,
        language: state.language,
        email: state.email,
        childProfileId: state.childProfileId,
        secondChildProfileId: state.secondChildProfileId,
        bookId: state.bookId,
        // Exclude: photoFile (File object), photoPreviewUrl (blob URL),
        // isGenerating, generationStep (transient UI state)
      }),
    }
  )
);
