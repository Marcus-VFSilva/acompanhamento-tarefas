"use client";

import { useState } from "react";
import { X, Save, Loader2 } from "lucide-react";
import { useCreateNota, useUpdateNota } from "@/hooks/useNotas";
import type { Note, NoteType } from "@/types/note";
import { NOTE_TYPE_LABEL, NOTE_TYPE_COLOR, DIAS_SEMANA } from "@/types/note";

interface NotaDrawerProps {
  nota: Note | null;
  tasks: { id: string; title: string }[];
  /** Data inicial ao criar uma nova nota (YYYY-MM-DD). */
  defaultDate?: string;
  onClose: () => void;
}

export default function NotaDrawer({ nota, tasks, defaultDate, onClose }: NotaDrawerProps) {
  const create = useCreateNota();
  const update = useUpdateNota();
  const isEditing = !!nota;

  const [titulo, setTitulo] = useState(nota?.titulo ?? "");
  const [conteudo, setConteudo] = useState(nota?.conteudo ?? "");
  const [tipo, setTipo] = useState<NoteType>(nota?.tipo ?? "anotacao");
  const [tarefaId, setTarefaId] = useState(nota?.tarefaId ?? "");
  const [data, setData] = useState(nota?.data ?? defaultDate ?? new Date().toISOString().split("T")[0]);
  const [recorrencia, setRecorrencia] = useState<"semanal" | null>(nota?.recorrencia ?? null);
  const [diasSemana, setDiasSemana] = useState<number[]>(nota?.diasSemana ?? []);

  const isBusy = create.isPending || update.isPending;

  function toggleDia(i: number) {
    setDiasSemana((prev) =>
      prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i].sort()
    );
  }

  async function handleSave() {
    if (!titulo.trim()) return;
    const linkedTask = tasks.find((t) => t.id === tarefaId);
    const payload = {
      titulo,
      conteudo,
      tipo,
      tarefaId: tarefaId || undefined,
      tarefaTitulo: linkedTask?.title || undefined,
      data,
      recorrencia: tipo === "lembrete" ? recorrencia : null,
      diasSemana: tipo === "lembrete" && recorrencia === "semanal" ? diasSemana : [],
    };
    if (isEditing) {
      await update.mutateAsync({ id: nota!.id, updates: payload });
    } else {
      await create.mutateAsync(payload as any);
    }
    onClose();
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 z-50 w-[400px] max-w-[95vw] bg-white shadow-xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-200">
          <h2 className="text-sm font-bold text-surface-900">{isEditing ? "Editar" : "Nova anotação"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-400"><X size={16} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Tipo */}
          <div className="flex gap-2">
            {(["reuniao", "anotacao", "lembrete"] as NoteType[]).map((t) => {
              const c = NOTE_TYPE_COLOR[t];
              return (
                <button
                  key={t}
                  onClick={() => setTipo(t)}
                  className={`flex-1 py-2 rounded-lg text-[12px] font-medium transition-all border ${
                    tipo === t ? `${c.bg} ${c.text} border-current` : "bg-surface-50 text-surface-500 border-surface-200"
                  }`}
                >
                  {c.icon} {NOTE_TYPE_LABEL[t]}
                </button>
              );
            })}
          </div>

          {/* Título */}
          <div>
            <label className="block text-[12px] font-medium text-surface-700 mb-1">Título *</label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder={
                tipo === "lembrete" ? "ex: Envio de relatório gerencial" :
                tipo === "reuniao"  ? "ex: Reunião com Jackson — Zendesk" :
                "ex: Decisões sobre o projeto X"
              }
              className="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
            />
          </div>

          {/* Data */}
          <div>
            <label className="block text-[12px] font-medium text-surface-700 mb-1">
              {tipo === "lembrete" && recorrencia === "semanal" ? "Data de início" : "Data"}
            </label>
            <input
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
            />
          </div>

          {/* Recorrência — só para lembrete */}
          {tipo === "lembrete" && (
            <div>
              <label className="block text-[12px] font-medium text-surface-700 mb-2">Recorrência</label>
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => { setRecorrencia(null); setDiasSemana([]); }}
                  className={`px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-all ${
                    !recorrencia
                      ? "bg-surface-900 text-white border-surface-900"
                      : "bg-surface-50 text-surface-500 border-surface-200 hover:border-surface-400"
                  }`}
                >
                  Não repete
                </button>
                <button
                  onClick={() => setRecorrencia("semanal")}
                  className={`px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-all ${
                    recorrencia === "semanal"
                      ? "bg-purple-500 text-white border-purple-500"
                      : "bg-surface-50 text-surface-500 border-surface-200 hover:border-purple-300"
                  }`}
                >
                  🔁 Semanal
                </button>
              </div>

              {recorrencia === "semanal" && (
                <div>
                  <p className="text-[11px] text-surface-400 mb-2">Dias da semana</p>
                  <div className="flex gap-1.5">
                    {DIAS_SEMANA.map((d, i) => (
                      <button
                        key={i}
                        onClick={() => toggleDia(i)}
                        className={`w-9 h-9 rounded-full text-[11px] font-bold border transition-all ${
                          diasSemana.includes(i)
                            ? "bg-purple-500 text-white border-purple-500 shadow-sm"
                            : "bg-surface-50 text-surface-400 border-surface-200 hover:border-purple-300 hover:text-purple-500"
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                  {diasSemana.length > 0 && (
                    <p className="text-[11px] text-purple-600 mt-1.5 font-medium">
                      Toda {diasSemana.map((d) => DIAS_SEMANA[d]).join(", ")}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Conteúdo */}
          <div>
            <label className="block text-[12px] font-medium text-surface-700 mb-1">
              {tipo === "lembrete" ? "Detalhe (opcional)" : "Conteúdo"}
            </label>
            <textarea
              value={conteudo}
              onChange={(e) => setConteudo(e.target.value)}
              rows={4}
              placeholder={
                tipo === "lembrete" ? "Contexto, destinatários, link..." :
                tipo === "reuniao"  ? "Decisões, próximas ações, participantes..." :
                "Detalhes, referências..."
              }
              className="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 resize-none"
            />
          </div>

          {/* Vincular tarefa */}
          {tasks.length > 0 && (
            <div>
              <label className="block text-[12px] font-medium text-surface-700 mb-1">Vincular a uma tarefa (opcional)</label>
              <select
                value={tarefaId}
                onChange={(e) => setTarefaId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 bg-white"
              >
                <option value="">— Sem vínculo —</option>
                {tasks.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
              </select>
            </div>
          )}
        </div>

        <div className="border-t border-surface-200 px-5 py-3 flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 text-sm font-medium text-surface-600 border border-surface-200 rounded-lg hover:bg-surface-50">Cancelar</button>
          <button
            onClick={handleSave}
            disabled={isBusy || !titulo.trim()}
            className="flex-1 py-2 text-sm font-semibold text-white bg-brand-500 rounded-lg hover:bg-brand-600 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isBusy ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Salvar
          </button>
        </div>
      </div>
    </>
  );
}
