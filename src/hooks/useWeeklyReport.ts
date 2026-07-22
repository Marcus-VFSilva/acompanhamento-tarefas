"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { WeeklyReport, WeeklyReportInput } from "@/types/weeklyReport";

export function useWeeklyReportQuery(weekStart: string) {
  return useQuery<WeeklyReport | null>({
    queryKey: ["weekly-report", weekStart],
    queryFn: async () => {
      const res = await fetch(`/api/relatorio-semanal?weekStart=${encodeURIComponent(weekStart)}`);
      if (!res.ok) throw new Error("Erro ao buscar relatório semanal");
      return res.json();
    },
    enabled: !!weekStart,
    staleTime: 1000 * 30,
  });
}

export function useSaveWeeklyReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: WeeklyReportInput) => {
      const res = await fetch("/api/relatorio-semanal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error("Erro ao salvar relatório semanal");
      return res.json() as Promise<WeeklyReport>;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["weekly-report", data.weekStart], data);
    },
  });
}
