import { jsPDF } from "jspdf";
import type { OperationalReportContext, OperationalReportMetrics } from "@/lib/operationalReportMetrics";
import { formatReportDate, formatShortDate, getTaskDeliveryDate } from "@/lib/operationalReportMetrics";

const BRAND: [number, number, number] = [4, 74, 66];
const TEXT: [number, number, number] = [51, 65, 85];
const MUTED: [number, number, number] = [100, 116, 139];
const BORDER: [number, number, number] = [226, 232, 240];

function drawSectionTitle(pdf: jsPDF, title: string, y: number) {
  pdf.setFillColor(...BRAND);
  pdf.roundedRect(14, y, 182, 8, 1.5, 1.5, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.text(title, 18, y + 5.5);
  return y + 12;
}

const STATUS_RGB: Record<string, [number, number, number]> = {
  "Concluído": [4, 74, 66],
  "Em andamento": [59, 130, 246],
  "Pendente": [148, 163, 184],
  "Cancelado": [239, 68, 68],
};
const PRIORITY_RGB: Record<string, [number, number, number]> = {
  Alta: [239, 68, 68],
  Média: [245, 158, 11],
  Baixa: [148, 163, 184],
};

/** Barras horizontais rotuladas (label · barra · valor). */
function drawHBars(
  pdf: jsPDF,
  data: { label: string; value: number; pct: number }[],
  startY: number,
  colorMap: Record<string, [number, number, number]>,
): number {
  const startX = 14;
  const labelW = 42;
  const valueW = 26;
  const trackX = startX + labelW;
  const trackW = 182 - labelW - valueW;
  const barH = 6;
  const gap = 4;
  let y = startY;

  data.forEach((d) => {
    const color = colorMap[d.label] ?? BRAND;

    pdf.setTextColor(...TEXT);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8.5);
    pdf.text(d.label, startX, y + barH - 1.2);

    pdf.setFillColor(241, 245, 249);
    pdf.roundedRect(trackX, y, trackW, barH, 1, 1, "F");

    const w = Math.max(1, (trackW * d.pct) / 100);
    pdf.setFillColor(...color);
    pdf.roundedRect(trackX, y, w, barH, 1, 1, "F");

    pdf.setTextColor(...MUTED);
    pdf.setFontSize(8);
    pdf.text(`${d.value} (${d.pct}%)`, trackX + trackW + 2, y + barH - 1.2);

    y += barH + gap;
  });

  return y + 4;
}

/** Barras verticais agrupadas (concluídas vs planejadas por semana). */
function drawGroupedVBars(
  pdf: jsPDF,
  data: { label: string; concluidas: number; planejadas: number }[],
  startY: number,
): number {
  const startX = 14;
  const chartW = 182;
  const chartH = 40;
  const baseline = startY + chartH;
  const maxVal = Math.max(1, ...data.map((d) => Math.max(d.concluidas, d.planejadas)));
  const slot = chartW / data.length;
  const barW = Math.min(7, slot / 3);

  // eixo
  pdf.setDrawColor(...BORDER);
  pdf.line(startX, baseline, startX + chartW, baseline);

  data.forEach((d, i) => {
    const cx = startX + slot * i + slot / 2;
    const hPlan = (d.planejadas / maxVal) * chartH;
    const hDone = (d.concluidas / maxVal) * chartH;

    pdf.setFillColor(148, 163, 184);
    pdf.rect(cx - barW - 0.5, baseline - hPlan, barW, hPlan, "F");
    pdf.setFillColor(...BRAND);
    pdf.rect(cx + 0.5, baseline - hDone, barW, hDone, "F");

    pdf.setTextColor(...MUTED);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(6.5);
    pdf.text(d.label, cx, baseline + 4, { align: "center" });
  });

  // legenda
  let ly = baseline + 8;
  pdf.setFillColor(...BRAND);
  pdf.rect(startX, ly - 3, 3, 3, "F");
  pdf.setTextColor(...TEXT);
  pdf.setFontSize(7.5);
  pdf.text("Concluídas", startX + 5, ly - 0.5);
  pdf.setFillColor(148, 163, 184);
  pdf.rect(startX + 35, ly - 3, 3, 3, "F");
  pdf.text("Planejadas", startX + 40, ly - 0.5);

  return ly + 6;
}

function drawKpiGrid(pdf: jsPDF, metrics: OperationalReportMetrics, startY: number) {
  const kpis = [
    { label: "Total", value: String(metrics.total) },
    { label: "Concluídas", value: `${metrics.concluido} (${metrics.taxaConclusao}%)` },
    { label: "Em andamento", value: String(metrics.emAndamento) },
    { label: "Pendentes", value: String(metrics.pendente) },
    { label: "Canceladas", value: String(metrics.cancelado) },
    { label: "Impeditivos", value: String(metrics.comImpeditivo) },
  ];

  const cols = 4;
  const cellW = 44;
  const cellH = 16;
  let x = 14;
  let y = startY;

  kpis.forEach((kpi, i) => {
    if (i > 0 && i % cols === 0) {
      x = 14;
      y += cellH + 2;
    }

    pdf.setDrawColor(...BORDER);
    pdf.setFillColor(248, 250, 252);
    pdf.roundedRect(x, y, cellW, cellH, 2, 2, "FD");

    pdf.setTextColor(...MUTED);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7.5);
    pdf.text(kpi.label, x + 3, y + 5);

    pdf.setTextColor(...BRAND);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.text(kpi.value, x + 3, y + 12);

    x += cellW + 2;
  });

  return y + cellH + 8;
}

function drawTable(
  pdf: jsPDF,
  headers: string[],
  rows: string[][],
  startY: number,
  colWidths: number[],
): number {
  let y = startY;
  const rowH = 7;
  const startX = 14;

  pdf.setFillColor(...BRAND);
  pdf.rect(startX, y, colWidths.reduce((a, b) => a + b, 0), rowH, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);

  let x = startX + 2;
  headers.forEach((h, i) => {
    pdf.text(h, x, y + 5);
    x += colWidths[i];
  });
  y += rowH;

  rows.forEach((row, idx) => {
    if (y > 275) {
      pdf.addPage();
      y = 20;
    }

    const fill: [number, number, number] = idx % 2 === 0 ? [255, 255, 255] : [248, 250, 252];
    pdf.setFillColor(...fill);
    pdf.setDrawColor(...BORDER);
    pdf.rect(startX, y, colWidths.reduce((a, b) => a + b, 0), rowH, "FD");

    pdf.setTextColor(...TEXT);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7.5);

    x = startX + 2;
    row.forEach((cell, i) => {
      const truncated = cell.length > Math.floor(colWidths[i] / 1.8)
        ? cell.slice(0, Math.floor(colWidths[i] / 1.8)) + "…"
        : cell;
      pdf.text(truncated, x, y + 5);
      x += colWidths[i];
    });
    y += rowH;
  });

  return y + 6;
}

export function exportOperationalPdf(
  metrics: OperationalReportMetrics,
  context: OperationalReportContext,
): Blob {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  pdf.setFillColor(...BRAND);
  pdf.rect(0, 0, 210, 28, "F");

  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.text("Report Operacional", 14, 14);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.text(`${context.reporterName} · ${formatReportDate()}`, 14, 21);

  let y = 36;

  y = drawSectionTitle(pdf, "Indicadores consolidados", y);
  y = drawKpiGrid(pdf, metrics, y);

  if (metrics.statusBreakdown.length > 0) {
    if (y > 235) { pdf.addPage(); y = 20; }
    y = drawSectionTitle(pdf, "Distribuição por status", y);
    y = drawHBars(pdf, metrics.statusBreakdown, y, STATUS_RGB);
  }

  if (metrics.priorityBreakdown.length > 0) {
    if (y > 235) { pdf.addPage(); y = 20; }
    y = drawSectionTitle(pdf, "Distribuição por prioridade", y);
    y = drawHBars(pdf, metrics.priorityBreakdown, y, PRIORITY_RGB);
  }

  if (metrics.weeklyEvolution.length > 0) {
    if (y > 210) { pdf.addPage(); y = 20; }
    y = drawSectionTitle(pdf, "Evolução semanal (concluídas x planejadas)", y);
    y = drawGroupedVBars(pdf, metrics.weeklyEvolution, y);
  }

  if (metrics.categoryBreakdown.length > 0) {
    if (y > 230) { pdf.addPage(); y = 20; }
    y = drawSectionTitle(pdf, "Tarefas por categoria", y);
    y = drawTable(
      pdf,
      ["Categoria", "Quantidade"],
      metrics.categoryBreakdown.map((c) => [c.label, String(c.value)]),
      y,
      [120, 30],
    );
  }

  if (metrics.projectSummary.length > 0) {
    if (y > 230) { pdf.addPage(); y = 20; }
    y = drawSectionTitle(pdf, "Tarefas por projeto", y);
    y = drawTable(
      pdf,
      ["Projeto", "Pend.", "Andam.", "Concl."],
      metrics.projectSummary.map((p) => [
        p.name,
        String(p.pendente),
        String(p.em_andamento),
        String(p.concluido),
      ]),
      y,
      [80, 25, 25, 25],
    );
  }

  if (metrics.collaboratorSummary.length > 0) {
    if (y > 230) { pdf.addPage(); y = 20; }
    y = drawSectionTitle(pdf, "Tarefas por colaborador", y);
    y = drawTable(
      pdf,
      ["Colaborador", "Total", "Concl.", "Andam.", "Pend."],
      metrics.collaboratorSummary.map((c) => [
        c.name,
        String(c.total),
        String(c.concluido),
        String(c.em_andamento),
        String(c.pendente),
      ]),
      y,
      [60, 20, 20, 25, 20],
    );
  }

  if (metrics.impeditivos.length > 0) {
    if (y > 220) { pdf.addPage(); y = 20; }
    y = drawSectionTitle(pdf, "Tarefas com impeditivo", y);
    y = drawTable(
      pdf,
      ["Título", "Responsável", "Impeditivo"],
      metrics.impeditivos.slice(0, 12).map((t) => [
        t.title,
        t.assignedToName,
        t.impeditivo ?? "",
      ]),
      y,
      [55, 35, 70],
    );
  }

  if (metrics.activeTasks.length > 0) {
    if (y > 220) { pdf.addPage(); y = 20; }
    y = drawSectionTitle(pdf, "Tarefas ativas (pendentes e em andamento)", y);
    y = drawTable(
      pdf,
      ["Título", "Status", "Projeto", "Progresso"],
      metrics.activeTasks.slice(0, 15).map((t) => [
        t.title,
        t.status === "em_andamento" ? "Em andamento" : "Pendente",
        t.projeto ?? "—",
        `${t.progress}%`,
      ]),
      y,
      [70, 30, 40, 25],
    );
  }

  if (metrics.deliveredThisWeek.length > 0) {
    if (y > 220) { pdf.addPage(); y = 20; }
    y = drawSectionTitle(pdf, "Tarefas entregues essa semana", y);
    y = drawTable(
      pdf,
      ["Título", "Projeto", "Entrega"],
      metrics.deliveredThisWeek.slice(0, 15).map((t) => [
        t.title,
        t.projeto ?? "—",
        formatShortDate(getTaskDeliveryDate(t)),
      ]),
      y,
      [85, 50, 25],
    );
  }

  pdf.setTextColor(...MUTED);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7);
  pdf.text(
    `Gerado automaticamente por Acompanhamento de Tarefas · ${context.reporterEmail}`,
    14,
    290,
  );

  return pdf.output("blob");
}
