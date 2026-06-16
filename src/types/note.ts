export type NoteType = "reuniao" | "anotacao" | "lembrete";

export interface Note {
  id: string;
  titulo: string;
  conteudo: string;
  tipo: NoteType;
  tarefaId?: string;
  tarefaTitulo?: string;
  data: string;
  recorrencia?: "semanal" | null;
  diasSemana?: number[];  // 0=Dom 1=Seg 2=Ter 3=Qua 4=Qui 5=Sex 6=Sáb
  createdAt: string;
  updatedAt: string;
}

export const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"] as const;

export const NOTE_TYPE_LABEL: Record<NoteType, string> = {
  reuniao: "Reunião",
  anotacao: "Anotação",
  lembrete: "Lembrete",
};

export const NOTE_TYPE_COLOR: Record<NoteType, { bg: string; text: string; icon: string }> = {
  reuniao:  { bg: "bg-blue-50",   text: "text-blue-700",   icon: "📅" },
  anotacao: { bg: "bg-amber-50",  text: "text-amber-700",  icon: "📝" },
  lembrete: { bg: "bg-purple-50", text: "text-purple-700", icon: "🔔" },
};
