
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CaseStore } from '../types';

export const useCaseStore = create<CaseStore>()(
  persist(
    (set) => ({
      cases: [],
      selectedCase: null,
      isFetching: false,
      isImporting: false,
      isOverrideActive: false,
      error: null,
      activeAction: null,
      report: null,
      isRevisingPrompt: false,
      isModelSelectorOpen: false,
      isPromptHistoryOpen: false,
      isApiKeyModalOpen: false,
      aiModel: 'gemini-2.5-flash',

      setCases: (cases) => set({ cases }),
      setSelectedCase: (caseData) => set({ selectedCase: caseData }),
      setIsFetching: (isFetching) => set({ isFetching }),
      setIsImporting: (isImporting) => set({ isImporting }),
      
      toggleOverride: () => set((state) => ({ isOverrideActive: !state.isOverrideActive })),
      
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
      
      setActiveAction: (action) => set({ activeAction: action }),
      setReport: (report) => set({ report }),
      
      setIsRevisingPrompt: (isRevising) => set({ isRevisingPrompt: isRevising }),
      setIsModelSelectorOpen: (isOpen) => set({ isModelSelectorOpen: isOpen }),
      setIsPromptHistoryOpen: (isOpen) => set({ isPromptHistoryOpen: isOpen }),
      setIsApiKeyModalOpen: (isOpen) => set({ isApiKeyModalOpen: isOpen }),
      setAiModel: (model) => set({ aiModel: model }),
    }),
    {
      // Chiave storica, mantenuta per non perdere le impostazioni salvate
      // (modello AI scelto, override del monitoraggio) al rebrand.
      name: 'police-chronicle-storage',
      storage: createJSONStorage(() => localStorage),
      // Persist user preferences: theme, override, and selected AI model
      partialize: (state) => ({ 
        isOverrideActive: state.isOverrideActive,
        aiModel: state.aiModel 
      }),
    }
  )
);