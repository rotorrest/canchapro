import { create } from "zustand";

interface SedeStore {
  selectedSede: string | null;
  setSelectedSede: (id: string | null) => void;
  reset: () => void;
}

export const useSedeStore = create<SedeStore>()((set) => ({
  selectedSede: null,
  setSelectedSede: (id) => set({ selectedSede: id }),
  reset: () => set({ selectedSede: null }),
}));
