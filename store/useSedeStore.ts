import { create } from 'zustand';

interface SedeStore {
  activeSedeId: string;
  assignedSedes: any[];
  setActiveSedeId: (id: string) => void;
  setAssignedSedes: (sedes: any[]) => void;
}

export const useSedeStore = create<SedeStore>((set) => ({
  activeSedeId: 'all',
  assignedSedes: [],
  setActiveSedeId: (id) => set({ activeSedeId: id }),
  setAssignedSedes: (sedes) => set({ assignedSedes: sedes }),
}));
