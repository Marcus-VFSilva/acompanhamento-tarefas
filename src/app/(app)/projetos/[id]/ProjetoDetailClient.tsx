"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useProjectsQuery } from "@/hooks/useProjects";
import { useTasksQuery } from "@/hooks/useTasks";
import { tasksForProject } from "@/lib/projectMetrics";
import ProjectDetailView from "@/components/projects/ProjectDetailView";

interface Props { projectId: string; isAdmin: boolean }

export default function ProjetoDetailClient({ projectId }: Props) {
  const { data: projects = [], isLoading: loadingProjects } = useProjectsQuery();
  const { data: allTasks = [], isLoading: loadingTasks } = useTasksQuery();

  const project = projects.find((p) => p.id === projectId);
  const projectTasks = useMemo(
    () => (project ? tasksForProject(allTasks, project.name) : []),
    [allTasks, project],
  );

  if (loadingProjects || loadingTasks) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin text-brand-500" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6 max-w-[1300px] mx-auto">
        <Link href="/projetos" className="inline-flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 mb-4">
          <ArrowLeft size={15} /> Voltar aos projetos
        </Link>
        <div className="text-center py-16 bg-white rounded-xl border border-surface-200">
          <p className="text-sm font-medium text-surface-500">Projeto não encontrado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-[1300px] mx-auto space-y-6">
      <Link href="/projetos" className="inline-flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700">
        <ArrowLeft size={15} /> Voltar aos projetos
      </Link>
      <ProjectDetailView project={project} projectTasks={projectTasks} />
    </div>
  );
}
