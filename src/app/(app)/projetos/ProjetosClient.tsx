"use client";

import { useMemo } from "react";
import Link from "next/link";
import { FolderKanban, Loader2, ChevronRight, AlertCircle } from "lucide-react";
import { useProjectsQuery } from "@/hooks/useProjects";
import { useTasksQuery } from "@/hooks/useTasks";
import { PROJECT_STATUS_LABEL, PROJECT_STATUS_COLOR, type ProjectStatus } from "@/types/project";
import { buildProjectKpis, tasksForProject } from "@/lib/projectMetrics";

interface Props { isAdmin: boolean }

export default function ProjetosClient({ isAdmin: _isAdmin }: Props) {
  const { data: projects = [], isLoading } = useProjectsQuery();
  const { data: tasks = [] } = useTasksQuery();

  const cards = useMemo(() => {
    return projects.map((p) => {
      const projectTasks = tasksForProject(tasks, p.name);
      const kpis = buildProjectKpis(projectTasks);
      return { project: p, kpis };
    });
  }, [projects, tasks]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-[1300px] mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-surface-900">Projetos</h1>
        <p className="text-sm text-surface-400 mt-0.5">
          Acompanhe a evolução de cada projeto · {projects.length} {projects.length === 1 ? "projeto" : "projetos"}
        </p>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-surface-200">
          <FolderKanban size={32} className="mx-auto text-surface-300 mb-3" />
          <p className="text-sm font-medium text-surface-500">Nenhum projeto cadastrado</p>
          <p className="text-xs text-surface-400 mt-1">
            Adicione projetos em <Link href="/configuracoes" className="text-brand-500 font-medium">Configurações</Link>
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map(({ project, kpis }) => {
            const status = (project.status ?? "em_andamento") as ProjectStatus;
            const sc = PROJECT_STATUS_COLOR[status];
            return (
              <Link
                key={project.id}
                href={`/projetos/${project.id}`}
                className="group bg-white rounded-xl border border-surface-200 p-5 hover:border-brand-400/50 hover:shadow-sm transition-all flex flex-col"
              >
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-sm font-bold text-surface-900 leading-snug">{project.name}</h2>
                  <ChevronRight size={16} className="text-surface-300 group-hover:text-brand-500 shrink-0 transition-colors" />
                </div>

                <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full mt-2 w-fit ${sc.bg} ${sc.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
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
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
