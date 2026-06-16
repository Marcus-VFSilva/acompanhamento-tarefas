"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { SystemWithObs, SystemObservation } from "@/types/system";

export function useSistemasQuery() {
  return useQuery<SystemWithObs[]>({
    queryKey: ["sistemas"],
    queryFn: async () => {
      const res = await fetch("/api/sistemas");
      if (!res.ok) throw new Error("Erro ao buscar sistemas");
      return res.json();
    },
    staleTime: 1000 * 60,
  });
}

export function useUpdateSistemaObs() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      obs,
    }: {
      id: string;
      obs: Partial<Omit<SystemObservation, "systemId" | "updatedAt" | "updatedBy">>;
    }) => {
      const res = await fetch(`/api/sistemas/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(obs),
      });
      if (!res.ok) throw new Error("Erro ao salvar observação");
      return res.json() as Promise<SystemObservation>;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sistemas"] }),
  });
}
