"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AppearanceProfile } from "@/types/child";

interface WizardState {
  step: number;
  childName: string;
  childAge: number;
  childGender: "boy" | "girl" | "neutral" | "";
  photoFile: File | null;
  photoPreviewUrl: string | null;
  photoUrl: string | null;
  appearanceDescription: string | null;
  appearanceProfile: AppearanceProfile | null;
  hasSecondChild: boolean;
  secondChildName: string;
  secondChildAge: number;
  secondChildGender: "boy" | "girl" | "neutral" | "";
  secondChildPhotoFile: File | null;
  secondChildPhotoPreviewUrl: string | null;
  secondChildPhotoUrl: string | null;
  secondAppearanceDescription: string | null;
  secondAppearanceProfile: AppearanceProfile | null;
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
  setAppearanceDescription: (desc: string | null) => void;
  setAppearanceProfile: (profile: AppearanceProfile | null) => void;
  setHasSecondChild: (has: boolean) => void;
  setSecondChildName: (name: string) => void;
  setSecondChildAge: (age: number) => void;
  setSecondChildGender: (gender: "boy" | "girl" | "neutral") => void;
  setSecondChildPhoto: (file: File, previewUrl: string) => void;
  setSecondChildPhotoUrl: (url: string) => void;
  clearSecondChildPhoto: () => void;
  setSecondAppearanceDescription: (desc: string | null) => void;
  setSecondAppearanceProfile: (profile: AppearanceProfile | null) => void;
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
  appearanceDescription: null,
  appearanceProfile: null,
  hasSecondChild: false,
  secondChildName: "",
  secondChildAge: -1,
  secondChildGender: "" as const,
  secondChildPhotoFile: null,
  secondChildPhotoPreviewUrl: null,
  secondChildPhotoUrl: null,
  secondAppearanceDescription: null,
  secondAppearanceProfile: null,
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
      setAppearanceDescription: (appearanceDescription) => set({ appearanceDescription }),
      setAppearanceProfile: (appearanceProfile) => set({ appearanceProfile }),
      setHasSecondChild: (hasSecondChild) =>
        set(hasSecondChild ? { hasSecondChild } : {
          hasSecondChild: false,
          secondChildName: "",
          secondChildAge: -1,
          secondChildGender: "" as const,
          secondChildPhotoFile: null,
          secondChildPhotoPreviewUrl: null,
          secondChildPhotoUrl: null,
          secondAppearanceDescription: null,
          secondAppearanceProfile: null,
        }),
      setSecondChildName: (secondChildName) => set({ secondChildName }),
      setSecondChildAge: (secondChildAge) => set({ secondChildAge }),
      setSecondChildGender: (secondChildGender) => set({ secondChildGender }),
      setSecondChildPhoto: (secondChildPhotoFile, secondChildPhotoPreviewUrl) =>
        set({ secondChildPhotoFile, secondChildPhotoPreviewUrl }),
      setSecondChildPhotoUrl: (secondChildPhotoUrl) => set({ secondChildPhotoUrl }),
      clearSecondChildPhoto: () =>
        set({
          secondChildPhotoFile: null,
          secondChildPhotoPreviewUrl: null,
          secondChildPhotoUrl: null,
          secondAppearanceDescription: null,
          secondAppearanceProfile: null,
        }),
      setSecondAppearanceDescription: (secondAppearanceDescription) =>
        set({ secondAppearanceDescription }),
      setSecondAppearanceProfile: (secondAppearanceProfile) =>
        set({ secondAppearanceProfile }),
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
        step: state.step,
        childName: state.childName,
        childAge: state.childAge,
        childGender: state.childGender,
        photoUrl: state.photoUrl,
        appearanceDescription: state.appearanceDescription,
        appearanceProfile: state.appearanceProfile,
        hasSecondChild: state.hasSecondChild,
        secondChildName: state.secondChildName,
        secondChildAge: state.secondChildAge,
        secondChildGender: state.secondChildGender,
        secondChildPhotoUrl: state.secondChildPhotoUrl,
        secondAppearanceDescription: state.secondAppearanceDescription,
        secondAppearanceProfile: state.secondAppearanceProfile,
        selectedThemeId: state.selectedThemeId,
        contextualAnswers: state.contextualAnswers,
        dedication: state.dedication,
        language: state.language,
        email: state.email,
        childProfileId: state.childProfileId,
        secondChildProfileId: state.secondChildProfileId,
        bookId: state.bookId,
        // Excluded: photoFile/secondChildPhotoFile (File objects not serializable),
        // photoPreviewUrl/secondChildPhotoPreviewUrl (blob URLs), isGenerating, generationStep
      }),
    }
  )
);
