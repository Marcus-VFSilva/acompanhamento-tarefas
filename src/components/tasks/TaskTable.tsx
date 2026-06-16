"use client";

import { Edit3, Trash2, AlertTriangle } from "lucide-react";
import type { Task } from "@/types";
import { StatusBadge, PriorityBadge } from "./StatusBadge";
import { useDeleteTask } from "@/hooks/useTasks";

interface Props {
  tasks: Task[];
  onEdit: (task: Task) => void;
  canDeleteFn: (task: Task) => boolean;
}

function Cell({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return (
    <td className={`px-3 py-2.5 text-xs text-surface-700 align-top border-b border-surface-100 ${className}`}>
      {children}
    </td>
  );
}

function Truncated({ text, maxLen = 60, className = "" }: { text?: string; maxLen?: number; className?: string }) {
  if (!text) return <span className="text-surface-300">—</span>;
  return (
    <span title={text} className={`${className}`}>
      {text.length > maxLen ? text.slice(0, maxLen) + "…" : text}
    </span>
  );
}

function HourCell({ value }: { value?: number }) {
  if (value == null) return <span className="text-surface-300">—</span>;
  return <span>{value}h</span>;
}

export default function TaskTable({ tasks, onEdit, canDeleteFn }: Props) {
  const deleteTask = useDeleteTask();

  function handleDelete(task: Task) {
    if (confirm(`Excluir "${task.title}"?`)) deleteTask.mutate(task.id);
  }

  const COLS = [
    { label: "Título", width: "min-w-[220px]" },
    { label: "Responsável", width: "min-w-[120px]" },
    { label: "Projeto", width: "min-w-[130px]" },
    { label: "Status", width: "min-w-[120px]" },
    { label: "Prioridade", width: "min-w-[90px]" },
    { label: "Situação atual", width: "min-w-[200px]" },
    { label: "Impeditivo", width: "min-w-[180px]" },
    { label: "Prazo", width: "min-w-[90px]" },
    { label: "Entrega", width: "min-w-[90px]" },
    { label: "Conclusão", width: "min-w-[90px]" },
    { label: "T.Est", width: "min-w-[60px]" },
    { label: "T.Prev", width: "min-w-[65px]" },
    { label: "Progresso", width: "min-w-[100px]" },
    { label: "", width: "min-w-[60px]" },
  ];

  if (tasks.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-xl border border-surface-200">
        <p className="text-sm text-surface-400">Nenhuma tarefa encontrada</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-surface-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-surface-50">
              {COLS.map((col) => (
                <th
                  key={col.label}
                  className={`${col.width} px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-surface-400 border-b border-surface-200 whitespace-nowrap`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task.id} className="hover:bg-surface-50/60 transition-colors group">
                {/* Título */}
                <Cell className="font-medium text-surface-900">
                  <Truncated text={task.title} maxLen={45} />
                </Cell>

                {/* Responsável */}
                <Cell>
                  <span className="truncate block">{task.assignedToName.split(" ")[0]}</span>
                </Cell>

                {/* Projeto */}
                <Cell>
                  {task.projeto
                    ? <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-surface-100 text-surface-600 text-[11px] font-medium">{task.projeto}</span>
                    : <span className="text-surface-300">—</span>
                  }
                </Cell>

                {/* Status */}
                <Cell><StatusBadge status={task.status} /></Cell>

                {/* Prioridade */}
                <Cell><PriorityBadge priority={task.priority} /></Cell>

                {/* Situação atual */}
                <Cell className="text-surface-600">
                  <Truncated text={task.situacaoAtual} maxLen={55} />
                </Cell>

                {/* Impeditivo */}
                <Cell>
                  {task.impeditivo ? (
                    <span className="flex items-start gap-1 text-amber-600">
                      <AlertTriangle size={11} className="shrink-0 mt-0.5" />
                      <Truncated text={task.impeditivo} maxLen={45} className="text-amber-700" />
                    </span>
                  ) : (
                    <span className="text-surface-300">—</span>
                  )}
                </Cell>

                {/* Prazo */}
                <Cell className="tabular-nums">{task.dueDate || <span className="text-surface-300">—</span>}</Cell>

                {/* Entrega */}
                <Cell className="tabular-nums">{task.dataEntrega || <span className="text-surface-300">—</span>}</Cell>

                {/* Conclusão */}
                <Cell className="tabular-nums">{task.dataConclusao || <span className="text-surface-300">—</span>}</Cell>

                {/* T.Est */}
                <Cell><HourCell value={task.tempoEstimado} /></Cell>

                {/* T.Prev */}
                <Cell>
                  {task.tempoPrevisto != null && task.tempoEstimado != null ? (
                    <span className={task.tempoPrevisto > task.tempoEstimado ? "text-amber-600 font-medium" : "text-brand-600 font-medium"}>
                      {task.tempoPrevisto}h
                    </span>
                  ) : (
                    <HourCell value={task.tempoPrevisto} />
                  )}
                </Cell>

                {/* Progresso */}
                <Cell>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-surface-100 rounded-full overflow-hidden min-w-[50px]">
                      <div
                        className="h-1.5 bg-brand-500 rounded-full transition-all"
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-surface-500 tabular-nums shrink-0">{task.progress}%</span>
                  </div>
                </Cell>

                {/* Ações */}
                <Cell>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onEdit(task)} className="p-1.5 rounded hover:bg-surface-100 text-surface-400 hover:text-surface-600 transition-colors" title="Editar">
                      <Edit3 size={13} />
                    </button>
                    {canDeleteFn(task) && (
                      <button onClick={() => handleDelete(task)} className="p-1.5 rounded hover:bg-red-50 text-surface-400 hover:text-red-500 transition-colors" title="Excluir">
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </Cell>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
