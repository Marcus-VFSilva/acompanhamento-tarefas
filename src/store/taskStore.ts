"use client";

import { create } from "zustand";
import type { TaskStatus, TaskPriority } from "@/types";

export interface TaskFilters {
  status: TaskStatus | "todas";
  priority: TaskPriority | "todas";
  assignedTo: string;
  search: string;
}

interface TaskUIStore {
  filters: TaskFilters;
  setFilters: (filters: Partial<TaskFilters>) => void;
  resetFilters: () => void;
}

export const DEFAULT_FILTERS: TaskFilters = {
  status: "todas",
  priority: "todas",
  assignedTo: "",
  search: "",
};

export const useTaskStore = create<TaskUIStore>()((set) => ({
  filters: DEFAULT_FILTERS,
  setFilters: (filters) => set((s) => ({ filters: { ...s.filters, ...filters } })),
  resetFilters: () => set({ filters: DEFAULT_FILTERS }),
}));
