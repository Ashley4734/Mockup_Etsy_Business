import { create } from 'zustand';

const useMockupStore = create((set) => ({
  selectedMockups: [],

  toggleMockup: (mockup) => set((state) => {
    const isSelected = state.selectedMockups.some(m => m.id === mockup.id);
    if (isSelected) {
      return {
        selectedMockups: state.selectedMockups.filter(m => m.id !== mockup.id)
      };
    } else {
      return {
        selectedMockups: [...state.selectedMockups, mockup]
      };
    }
  }),

  clearSelection: () => set({ selectedMockups: [] }),

  isSelected: (mockupId) => (state) => {
    return state.selectedMockups.some(m => m.id === mockupId);
  }
}));

export default useMockupStore;
