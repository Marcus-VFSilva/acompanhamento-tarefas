"use client";

import { useSettingsQuery } from "@/hooks/useSettings";
import type { Task } from "@/types";

export function useUserRole(isAdmin: boolean) {
  const { data: settings } = useSettingsQuery();

  const isTeamLeader = !isAdmin && (settings?.isManager ?? false);
  const subordinates = settings?.subordinates ?? [];

  function canEditTask(task: Task, userEmail: string) {
    if (isTeamLeader) return false;
    return isAdmin || task.assignedTo.toLowerCase() === userEmail.toLowerCase();
  }

  return {
    isAdmin,
    isTeamLeader,
    isMember: !isAdmin && !isTeamLeader,
    canViewTeam: isAdmin || isTeamLeader,
    subordinates,
    canEditTask,
    teamLabel: isTeamLeader
      ? `Equipe · ${subordinates.length} colaborador${subordinates.length !== 1 ? "es" : ""}`
      : isAdmin
      ? "Visão geral"
      : null,
  };
}
