"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  FolderKanban, Loader2, ChevronRight, AlertCircle, LayoutDashboard,
  ListTodo, CheckCircle2, Search,
} from "lucide-react";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend, CartesianGrid,
} from "recharts";
import { useProjectsQuery } from "@/hooks/useProjects";
import { useTasksQuery } from "@/hooks/useTasks";
import {
  PROJECT_STATUS_LABEL, PROJECT_STATUS_COLOR, type ProjectStatus,
} from "@/types/project";
import { buildProjectKpis, tasksForProject } from "@/lib/projectMetrics";
import ProjectDetailView from "@/components/projects/ProjectDetailView";

interface Props { isAdmin: boolean }

type Tab = "dashboard" | "detalhes";

const STATUS_ORDER: ProjectStatus[] = ["em_andamento", "planejamento", "pausado", "concluido"];

function KpiCard({ label, value, icon: Icon, accent }: {
  label: string; value: string | number; icon: React.ElementType; accent: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-surface-200 p-4 flex items-start gap-3">
      <div className={`p-2.5 rounded-lg ${accent} shrink-0`}>
        <Icon size={16} className="text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-xl font-bold text-surface-900 leading-tight">{value}</p>
        <p className="text-xs text-surface-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

export default function ProjetosClient({ isAdmin: _isAdmin }: Props) {
  const { data: projects = [], isLoading } = useProjectsQuery();
  const { data: tasks = [] } = useTasksQuery();

  const [tab, setTab] = useState<Tab>("dashboard");
  const [selectedId, setSelectedId] = useState<string>("");

  const cards = useMemo(() => {
    return projects.map((p) => ({
      project: p,
      kpis: buildProjectKpis(tasksForProject(tasks, p.name)),
    }));
  }, [projects, tasks]);

  const totals = useMemo(() => {
    const totalTasks = cards.reduce((s, c) => s + c.kpis.total, 0);
    const concluido = cards.reduce((s, c) => s + c.kpis.concluido, 0);
    const comImpeditivo = cards.reduce((s, c) => s + c.kpis.comImpeditivo, 0);
    return { totalProjetos: projects.length, totalTasks, concluido, comImpeditivo };
  }, [cards, projects.length]);

  const progressData = useMemo(
    () =>
      cards
        .map((c) => ({ name: c.project.name, taxa: c.kpis.taxaConclusao, total: c.kpis.total }))
        .sort((a, b) => b.taxa - a.taxa),
    [cards],
  );

  const statusData = useMemo(() => {
    const counts = new Map<ProjectStatus, number>();
    for (const p of projects) {
      const s = (p.status ?? "em_andamento") as ProjectStatus;
      counts.set(s, (counts.get(s) ?? 0) + 1);
    }
    return STATUS_ORDER.filter((s) => counts.get(s)).map((s) => ({
      name: PROJECT_STATUS_LABEL[s],
      value: counts.get(s) ?? 0,
      color: PROJECT_STATUS_COLOR[s].hex,
    }));
  }, [projects]);

  const selectedProject = projects.find((p) => p.id === selectedId);
  const selectedTasks = useMemo(
    () => (selectedProject ? tasksForProject(tasks, selectedProject.name) : []),
    [tasks, selectedProject],
  );

  function openDetail(id: string) {
    setSelectedId(id);
    setTab("detalhes");
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-[1300px] mx-auto space-y-6">
      {/* Header + tabs */}
      <div>
        <h1 className="text-xl font-bold text-surface-900">Projetos</h1>
        <p className="text-sm text-surface-400 mt-0.5">
          Acompanhe a evolução de cada projeto · {projects.length} {projects.length === 1 ? "projeto" : "projetos"}
        </p>
        <div className="mt-2.5 flex items-center bg-surface-100 rounded-lg p-0.5 gap-0.5 w-fit">
          <button
            type="button"
            onClick={() => setTab("dashboard")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all
              ${tab === "dashboard" ? "bg-white shadow-sm text-surface-900" : "text-surface-400 hover:text-surface-700"}`}
          >
            <LayoutDashboard size={12} /> Dashboard
          </button>
          <button
            type="button"
            onClick={() => setTab("detalhes")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all
              ${tab === "detalhes" ? "bg-white shadow-sm text-surface-900" : "text-surface-400 hover:text-surface-700"}`}
          >
            <FolderKanban size={12} /> Detalhes
          </button>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-surface-200">
          <FolderKanban size={32} className="mx-auto text-surface-300 mb-3" />
          <p className="text-sm font-medium text-surface-500">Nenhum projeto cadastrado</p>
          <p className="text-xs text-surface-400 mt-1">
            Adicione projetos em <Link href="/configuracoes" className="text-brand-500 font-medium">Configurações</Link>
          </p>
        </div>
      ) : tab === "dashboard" ? (
        <>
          {/* KPIs gerais */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard label="Projetos" value={totals.totalProjetos} icon={FolderKanban} accent="bg-surface-500" />
            <KpiCard label="Tarefas" value={totals.totalTasks} icon={ListTodo} accent="bg-blue-500" />
            <KpiCard label="Concluídas" value={totals.concluido} icon={CheckCircle2} accent="bg-brand-500" />
            <KpiCard label="Com impeditivo" value={totals.comImpeditivo} icon={AlertCircle} accent="bg-amber-500" />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-surface-200 p-5 lg:col-span-2">
              <h2 className="text-sm font-bold text-surface-700">Progresso por projeto</h2>
              <ResponsiveContainer width="100%" height={Math.max(220, progressData.length * 38)} className="mt-3">
                <BarChart data={progressData} layout="vertical" barSize={14} margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={130} />
                  <Tooltip formatter={(v) => [`${v}%`, "Conclusão"]} />
                  <Bar dataKey="taxa" name="Conclusão" fill="#044a42" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl border border-surface-200 p-5">
              <h2 className="text-sm font-bold text-surface-700">Projetos por status</h2>
              <ResponsiveContainer width="100%" height={240} className="mt-3">
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {statusData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip formatter={(v) => [`${v}`, ""]} />
                  <Legend iconType="circle" iconSize={8} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cards.map(({ project, kpis }) => {
              const status = (project.status ?? "em_andamento") as ProjectStatus;
              const scc = PROJECT_STATUS_COLOR[status];
              return (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => openDetail(project.id)}
                  className="group text-left bg-white rounded-xl border border-surface-200 p-5 hover:border-brand-400/50 hover:shadow-sm transition-all flex flex-col"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-bold text-surface-900 leading-snug">{project.name}</h3>
                    <ChevronRight size={16} className="text-surface-300 group-hover:text-brand-500 shrink-0 transition-colors" />
                  </div>

                  <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full mt-2 w-fit ${scc.bg} ${scc.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${scc.dot}`} />
                    {PROJECT_STATUS_LABEL[status]}
                  </span>

                  {project.objetivo && (
                    <p className="text-xs text-surface-500 mt-3 line-clamp-2 leading-relaxed">{project.objetivo}</p>
                  )}

                  <div className="mt-auto pt-4">
                    <div className="flex items-center justify-between text-[11px] text-surface-400 mb-1.5">
                      <span>{kpis.concluido}/{kpis.total} concluídas</span>
                      <span className="font-semibold text-brand-600 tabular-nums">{kpis.taxaConclusao}%</span>
                    </div>
                    <div className="h-1.5 bg-surface-100 rounded-full overflow-hidden">
                      <div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${kpis.taxaConclusao}%` }} />
                    </div>
                    <div className="flex items-center gap-3 mt-3 text-[11px] text-surface-500">
                      <span>{kpis.total} {kpis.total === 1 ? "tarefa" : "tarefas"}</span>
                      {kpis.comImpeditivo > 0 && (
                        <span className="inline-flex items-center gap-1 text-amber-600 font-medium">
                          <AlertCircle size={11} /> {kpis.comImpeditivo} impeditivo(s)
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <>
          {/* Seletor de projeto */}
          <div className="bg-white rounded-xl border border-surface-200 p-4">
            <label className="text-[10px] font-bold uppercase tracking-wider text-surface-400 mb-1.5 block">
              Selecione um projeto
            </label>
            <div className="relative max-w-md">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-surface-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              >
                <option value="">— escolha um projeto —</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          {selectedProject ? (
            <ProjectDetailView project={selectedProject} projectTasks={selectedTasks} />
          ) : (
            <div className="text-center py-16 bg-white rounded-xl border border-surface-200">
              <FolderKanban size={32} className="mx-auto text-surface-300 mb-3" />
              <p className="text-sm font-medium text-surface-500">Selecione um projeto acima</p>
              <p className="text-xs text-surface-400 mt-1">Você verá KPIs, curva em S, calendário e tarefas do projeto.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
