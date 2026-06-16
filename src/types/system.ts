export type SystemStatus =
  | "estavel"
  | "melhorias"
  | "desenvolvimento"
  | "implantacao"
  | "mapeamento"
  | "futuro";

export type SystemOwner = "proprio" | "parceria" | "mercado";

export type SystemZone =
  | "nucleo"
  | "suprimentos"
  | "integracao"
  | "campo"
  | "infra"
  | "fiscal"
  | "analytics"
  | "atendimento"
  | "futuro";

export interface SystemFlow {
  to: string;
  label: string;
  dir: "in" | "out" | "both";
}

export interface System {
  id: string;
  name: string;
  zone: SystemZone;
  core?: boolean;
  status: SystemStatus;
  owner: SystemOwner;
  vendor?: string;
  units: string[];
  desc: string;
  modules: string[];
  flows: SystemFlow[];
}

export interface SystemObservation {
  systemId: string;
  uptime?: number;
  observacao?: string;
  ultimaVerificacao?: string;
  updatedAt: string;
  updatedBy?: string;
}

export interface SystemWithObs extends System {
  obs?: SystemObservation;
}

export const STATUS_SISTEMA: Record<SystemStatus, { label: string; color: string; bg: string; text: string }> = {
  estavel:        { label: "Estável",                         color: "#2F6FED", bg: "bg-blue-100",   text: "text-blue-700"   },
  melhorias:      { label: "Em func. (c/ melhorias)",         color: "#E0563B", bg: "bg-orange-100", text: "text-orange-700" },
  desenvolvimento:{ label: "Em desenvolvimento",              color: "#8B5CF6", bg: "bg-purple-100", text: "text-purple-700" },
  implantacao:    { label: "Em implantação",                  color: "#1F9E78", bg: "bg-emerald-100",text: "text-emerald-700"},
  mapeamento:     { label: "Em mapeamento",                   color: "#64748B", bg: "bg-slate-100",  text: "text-slate-600"  },
  futuro:         { label: "Caixinha do futuro",              color: "#E0A93B", bg: "bg-amber-100",  text: "text-amber-700"  },
};

export const OWNER_LABELS: Record<SystemOwner, string> = {
  proprio:  "Próprio",
  parceria: "Parceria",
  mercado:  "De mercado",
};

export const ZONE_LABELS: Record<SystemZone, string> = {
  nucleo:      "Núcleo ERP",
  suprimentos: "Suprimentos & Compras",
  integracao:  "Integração & Dados",
  campo:       "Operação de Campo",
  infra:       "Ponto & Infraestrutura",
  fiscal:      "Fiscal & Financeiro",
  analytics:   "BI, Analytics & IA",
  atendimento: "Atendimento & Web",
  futuro:      "Implantação · Mapeamento · Futuro",
};

export const ZONE_ORDER: SystemZone[] = [
  "nucleo", "suprimentos", "integracao", "campo",
  "infra", "fiscal", "analytics", "atendimento", "futuro",
];
