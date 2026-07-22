export interface WeeklyReport {
  id: string;
  userId: string;
  /** Segunda-feira da semana de referência, no formato "YYYY-MM-DD". */
  weekStart: string;
  avancos: string;
  impeditivos: string;
  sugestoes: string;
  planejamento: string;
  createdAt: string;
  updatedAt: string;
}

export type WeeklyReportInput = Pick<
  WeeklyReport,
  "weekStart" | "avancos" | "impeditivos" | "sugestoes" | "planejamento"
>;
