export type ProjectStatus = "planejamento" | "em_andamento" | "concluido" | "pausado";

export interface Project {
  id: string;
  name: string;
  active: boolean;
  objetivo?: string;
  status?: ProjectStatus;
  createdByUserId?: string;
  createdAt: string;
  updatedAt: string;
}

export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  planejamento: "Planejamento",
  em_andamento: "Em andamento",
  concluido: "Concluído",
  pausado: "Pausado",
};

export const PROJECT_STATUS_COLOR: Record<ProjectStatus, { bg: string; text: string; dot: string; hex: string }> = {
  planejamento: { bg: "bg-surface-100", text: "text-surface-600", dot: "bg-surface-400", hex: "#94a3b8" },
  em_andamento: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500", hex: "#3b82f6" },
  concluido: { bg: "bg-brand-50", text: "text-brand-700", dot: "bg-brand-500", hex: "#044a42" },
  pausado: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500", hex: "#f59e0b" },
};

export interface UserSettings {
  userId: string;
  email: string;
  name: string;
  managerEmail?: string;
  managerName?: string;
  emailSignature?: string;
  emailSignatureImage?: string;
  emailSignatureImageMime?: string;
}

export interface UserSettingsResponse extends UserSettings {
  isManager: boolean;
  hasPassword: boolean;
  subordinates: { id: string; email: string; name: string }[];
}
