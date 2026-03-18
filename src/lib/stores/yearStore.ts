import { create } from "zustand";
import { getCurrentFiscalYear } from "@/lib/utils";

interface YearStore {
  year: number;
  setYear: (year: number) => void;
}

export const useYearStore = create<YearStore>((set) => ({
  year: getCurrentFiscalYear(),
  setYear: (year) => set({ year }),
}));
