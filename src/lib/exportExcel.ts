import type { Task } from "@/types";
import { STATUS_LABELS, PRIORITY_LABELS } from "@/types";

export async function exportToExcel(tasks: Task[], filename = "relatorio-tarefas") {
  const XLSX = await import("xlsx");

  // ── Sheet 1: Tarefas detalhadas ──
  const taskRows = tasks.map((t) => ({
    Título: t.title,
    Responsável: t.assignedToName,
    Projeto: t.projeto ?? "",
    Categoria: t.category ?? "",
    Status: STATUS_LABELS[t.status],
    Prioridade: PRIORITY_LABELS[t.priority],
    "Situação Atual": t.situacaoAtual ?? "",
    Impeditivo: t.impeditivo ?? "",
    "Prazo (Deadline)": t.dueDate ?? "",
    "Data de Entrega": t.dataEntrega ?? "",
    "Data de Conclusão": t.dataConclusao ?? "",
    "Progresso (%)": t.progress,
    "Subtarefas Total": t.subtasks.length,
    "Subtarefas Concluídas": t.subtasks.filter((s) => s.status === "concluido").length,
    "Criado Em": t.createdAt,
    "Atualizado Em": t.updatedAt,
  }));

  // ── Sheet 2: Resumo por colaborador ──
  const byUser = new Map<string, { name: string; total: number; concluido: number; em_andamento: number; pendente: number }>();
  tasks.forEach((t) => {
    if (!byUser.has(t.assignedUserId)) {
      byUser.set(t.assignedUserId, { name: t.assignedToName, total: 0, concluido: 0, em_andamento: 0, pendente: 0 });
    }
    const u = byUser.get(t.assignedUserId)!;
    u.total++;
    if (t.status === "concluido") u.concluido++;
    else if (t.status === "em_andamento") u.em_andamento++;
    else if (t.status === "pendente") u.pendente++;
  });

  const userRows = Array.from(byUser.values()).map((u) => ({
    Colaborador: u.name,
    "Total de Tarefas": u.total,
    Concluídas: u.concluido,
    "Em Andamento": u.em_andamento,
    Pendentes: u.pendente,
    "Taxa de Conclusão (%)": u.total > 0 ? Math.round((u.concluido / u.total) * 100) : 0,
  }));

  // ── Sheet 3: Resumo por projeto ──
  const byProject = new Map<string, { total: number; concluido: number; em_andamento: number; pendente: number }>();
  tasks.forEach((t) => {
    const key = t.projeto || "Sem projeto";
    if (!byProject.has(key)) {
      byProject.set(key, { total: 0, concluido: 0, em_andamento: 0, pendente: 0 });
    }
    const p = byProject.get(key)!;
    p.total++;
    if (t.status === "concluido") p.concluido++;
    else if (t.status === "em_andamento") p.em_andamento++;
    else if (t.status === "pendente") p.pendente++;
  });

  const projectRows = Array.from(byProject.entries()).map(([proj, p]) => ({
    Projeto: proj,
    "Total de Tarefas": p.total,
    Concluídas: p.concluido,
    "Em Andamento": p.em_andamento,
    Pendentes: p.pendente,
    "Taxa de Conclusão (%)": p.total > 0 ? Math.round((p.concluido / p.total) * 100) : 0,
  }));

  // ── Build workbook ──
  const wb = XLSX.utils.book_new();

  const ws1 = XLSX.utils.json_to_sheet(taskRows);
  ws1["!cols"] = [{ wch: 40 }, { wch: 18 }, { wch: 18 }, { wch: 15 }, { wch: 14 }, { wch: 12 }, { wch: 50 }, { wch: 45 }, { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 13 }, { wch: 16 }, { wch: 20 }, { wch: 12 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, ws1, "Tarefas");

  const ws2 = XLSX.utils.json_to_sheet(userRows);
  ws2["!cols"] = [{ wch: 22 }, { wch: 16 }, { wch: 12 }, { wch: 15 }, { wch: 12 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, ws2, "Por Colaborador");

  const ws3 = XLSX.utils.json_to_sheet(projectRows);
  ws3["!cols"] = [{ wch: 22 }, { wch: 16 }, { wch: 12 }, { wch: 15 }, { wch: 12 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, ws3, "Por Projeto");

  const date = new Date().toISOString().split("T")[0];
  XLSX.writeFile(wb, `${filename}-${date}.xlsx`);
}
