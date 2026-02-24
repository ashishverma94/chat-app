import { create } from "zustand";

interface IGlobalStore {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export const useGlobalStore = create<IGlobalStore>((set) => ({
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));