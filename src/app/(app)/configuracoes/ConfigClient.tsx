"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Loader2, Users, FolderKanban, Save, Mail, PenLine, Lock, Pencil, X, Check } from "lucide-react";
import { useProjectsQuery, useCreateProject, useUpdateProject, useDeleteProject } from "@/hooks/useProjects";
import { useSettingsQuery, useUpdateSettings, useChangePassword } from "@/hooks/useSettings";
import { PROJECT_STATUS_LABEL, PROJECT_STATUS_COLOR, type Project, type ProjectStatus } from "@/types/project";

const PROJECT_STATUSES: ProjectStatus[] = ["planejamento", "em_andamento", "concluido", "pausado"];

function ProjectRow({ project }: { project: Project }) {
  const update = useUpdateProject();
  const del = useDeleteProject();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(project.name);
  const [objetivo, setObjetivo] = useState(project.objetivo ?? "");
  const [status, setStatus] = useState<ProjectStatus>(project.status ?? "em_andamento");

  const sc = PROJECT_STATUS_COLOR[status];

  async function handleSave() {
    await update.mutateAsync({
      id: project.id,
      updates: { name: name.trim(), objetivo: objetivo.trim(), status },
    });
    setEditing(false);
  }

  if (editing) {
    return (
      <li className="px-4 py-3 space-y-2.5 bg-surface-50/60">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 border border-surface-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          placeholder="Nome do projeto"
        />
        <div className="flex flex-wrap gap-1.5">
          {PROJECT_STATUSES.map((s) => {
            const c = PROJECT_STATUS_COLOR[s];
            return (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-all ${
                  status === s ? `${c.bg} ${c.text} border-current` : "bg-white text-surface-500 border-surface-200 hover:border-surface-300"
                }`}
              >
                {PROJECT_STATUS_LABEL[s]}
              </button>
            );
          })}
        </div>
        <textarea
          value={objetivo}
          onChange={(e) => setObjetivo(e.target.value)}
          rows={2}
          placeholder="Objetivo do projeto…"
          className="w-full px-3 py-2 border border-surface-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 resize-none"
        />
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => { setEditing(false); setName(project.name); setObjetivo(project.objetivo ?? ""); setStatus(project.status ?? "em_andamento"); }}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs text-surface-600 border border-surface-200 rounded-lg hover:bg-surface-50"
          >
            <X size={13} /> Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || update.isPending}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 disabled:opacity-60"
          >
            {update.isPending ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Salvar
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className="flex items-start justify-between gap-3 px-4 py-3 hover:bg-surface-50/60">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm text-surface-800">{project.name}</span>
          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${sc.bg} ${sc.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
            {PROJECT_STATUS_LABEL[status]}
          </span>
        </div>
        {project.objetivo && (
          <p className="text-xs text-surface-500 mt-0.5 line-clamp-2">{project.objetivo}</p>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => setEditing(true)}
          className="p-1.5 rounded-lg text-surface-300 hover:text-brand-600 hover:bg-brand-50 transition-colors"
          title="Editar projeto"
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={() => del.mutate(project.id)}
          disabled={del.isPending}
          className="p-1.5 rounded-lg text-surface-300 hover:text-red-500 hover:bg-red-50 transition-colors"
          title="Remover projeto"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </li>
  );
}

interface Props {
  userEmail: string;
  userName: string;
}

export default function ConfigClient({ userEmail, userName }: Props) {
  const { data: projects = [], isLoading: loadingProjects } = useProjectsQuery();
  const { data: settings, isLoading: loadingSettings } = useSettingsQuery();
  const createProject = useCreateProject();
  const updateSettings = useUpdateSettings();
  const changePassword = useChangePassword();

  const [newProject, setNewProject] = useState("");
  const [newProjectStatus, setNewProjectStatus] = useState<ProjectStatus>("em_andamento");
  const [newProjectObjetivo, setNewProjectObjetivo] = useState("");
  const [managerEmail, setManagerEmail] = useState("");
  const [managerName, setManagerName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saved, setSaved] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);

  useEffect(() => {
    if (settings) {
      setManagerEmail(settings.managerEmail ?? "");
      setManagerName(settings.managerName ?? "");
    }
  }, [settings]);

  async function handleAddProject(e: React.FormEvent) {
    e.preventDefault();
    const name = newProject.trim();
    if (!name) return;
    await createProject.mutateAsync({ name, objetivo: newProjectObjetivo.trim(), status: newProjectStatus });
    setNewProject("");
    setNewProjectObjetivo("");
    setNewProjectStatus("em_andamento");
  }

  async function handleSaveManager(e: React.FormEvent) {
    e.preventDefault();
    await updateSettings.mutateAsync({
      managerEmail: managerEmail.trim().toLowerCase(),
      managerName: managerName.trim() || undefined,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    await changePassword.mutateAsync({
      newPassword,
      confirmPassword,
    });
    setNewPassword("");
    setConfirmPassword("");
    setPasswordSaved(true);
    setTimeout(() => setPasswordSaved(false), 2500);
  }

  return (
    <div className="p-4 md:p-6 max-w-[900px] mx-auto space-y-8">
      <div>
        <h1 className="text-xl font-bold text-surface-900">Configurações</h1>
        <p className="text-sm text-surface-400 mt-0.5">
          Gerencie sua conta, projetos e defina seu gestor para os reports operacionais.
        </p>
      </div>

      {/* Senha */}
      {settings?.hasPassword && (
        <section className="bg-white rounded-xl border border-surface-200 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Lock size={16} className="text-brand-500" />
            <h2 className="text-sm font-bold text-surface-700">Alterar senha</h2>
          </div>
          <form onSubmit={handleChangePassword} className="space-y-3 max-w-md">
            <div>
              <label className="text-xs font-medium text-surface-600 block mb-1.5">Nova senha</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
                className="w-full px-3 py-2 border border-surface-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-surface-600 block mb-1.5">Confirmar nova senha</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
                className="w-full px-3 py-2 border border-surface-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={changePassword.isPending}
                className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm font-medium disabled:opacity-60"
              >
                {changePassword.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Salvar nova senha
              </button>
              {passwordSaved && <span className="text-xs text-brand-600 font-medium">Senha alterada!</span>}
              {changePassword.isError && (
                <span className="text-xs text-red-500">{(changePassword.error as Error).message}</span>
              )}
            </div>
          </form>
        </section>
      )}

      {/* Gestor */}
      <section className="bg-white rounded-xl border border-surface-200 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Users size={16} className="text-brand-500" />
          <h2 className="text-sm font-bold text-surface-700">Seu gestor</h2>
        </div>
        <p className="text-xs text-surface-500 leading-relaxed">
          Informe o e-mail corporativo do seu gestor. Não é necessário que ele já tenha conta —
          quando entrar na plataforma, verá suas tarefas e relatórios automaticamente.
        </p>

        {loadingSettings ? (
          <div className="flex items-center gap-2 text-sm text-surface-400">
            <Loader2 size={14} className="animate-spin" /> Carregando…
          </div>
        ) : (
          <form onSubmit={handleSaveManager} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-surface-600 block mb-1.5">E-mail do gestor</label>
                <div className="relative">
                  <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                  <input
                    type="email"
                    value={managerEmail}
                    onChange={(e) => setManagerEmail(e.target.value)}
                    placeholder="gestor@gruporoncador.com.br"
                    className="w-full pl-8 pr-3 py-2 border border-surface-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-surface-600 block mb-1.5">Nome do gestor (opcional)</label>
                <input
                  type="text"
                  value={managerName}
                  onChange={(e) => setManagerName(e.target.value)}
                  placeholder="Nome completo"
                  className="w-full px-3 py-2 border border-surface-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={updateSettings.isPending}
                className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm font-medium disabled:opacity-60"
              >
                {updateSettings.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Salvar gestor
              </button>
              {saved && <span className="text-xs text-brand-600 font-medium">Salvo com sucesso!</span>}
              {updateSettings.isError && (
                <span className="text-xs text-red-500">{(updateSettings.error as Error).message}</span>
              )}
            </div>
          </form>
        )}

        {settings?.isManager && settings.subordinates.length > 0 && (
          <div className="mt-4 pt-4 border-t border-surface-100">
            <p className="text-xs font-semibold text-surface-600 mb-2">Colaboradores vinculados a você</p>
            <div className="flex flex-wrap gap-2">
              {settings.subordinates.map((s) => (
                <span key={s.email} className="text-xs bg-brand-50 text-brand-700 border border-brand-200 px-2.5 py-1 rounded-full">
                  {s.name} · {s.email}
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Assinatura de e-mail */}
      <section className="bg-white rounded-xl border border-surface-200 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <PenLine size={16} className="text-brand-500" />
          <h2 className="text-sm font-bold text-surface-700">Assinatura de e-mail</h2>
        </div>
        <p className="text-xs text-surface-500 leading-relaxed">
          O e-mail abre em modo HTML no Outlook, permitindo inserir sua assinatura com imagem
          via <strong>Inserir → Assinatura</strong> após &quot;Atenciosamente,&quot;.
        </p>
        <ol className="text-xs text-surface-600 leading-relaxed list-decimal list-inside space-y-1.5 bg-surface-50 rounded-lg p-4 border border-surface-100">
          <li>Gere o report operacional e abra o <strong>.eml</strong> com duplo clique (Outlook Classic)</li>
          <li>Confirme que abriu para <strong>edição</strong> — deve aparecer o botão <strong>Enviar</strong></li>
          <li>Após &quot;Atenciosamente,&quot;, use <strong>Inserir → Assinatura</strong></li>
          <li>Revise e clique em <strong>Enviar</strong></li>
        </ol>
        <p className="text-[11px] text-surface-400">
          Se abrir só para leitura (Responder/Encaminhar), clique com o botão direito no .eml →
          Abrir com → Outlook (classic).
        </p>
      </section>

      {/* Projetos */}
      <section className="bg-white rounded-xl border border-surface-200 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <FolderKanban size={16} className="text-brand-500" />
          <h2 className="text-sm font-bold text-surface-700">Projetos</h2>
        </div>
        <p className="text-xs text-surface-500 leading-relaxed">
          Projetos disponíveis no select ao criar tarefas, na página de Projetos e nos relatórios por projeto.
        </p>

        <form onSubmit={handleAddProject} className="space-y-2.5 bg-surface-50/60 border border-surface-100 rounded-xl p-3">
          <div className="flex gap-2">
            <input
              value={newProject}
              onChange={(e) => setNewProject(e.target.value)}
              placeholder="Nome do novo projeto…"
              className="flex-1 px-3 py-2 border border-surface-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
            <button
              type="submit"
              disabled={!newProject.trim() || createProject.isPending}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-surface-800 hover:bg-surface-900 text-white rounded-lg text-sm font-medium disabled:opacity-60"
            >
              {createProject.isPending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Adicionar
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {PROJECT_STATUSES.map((s) => {
              const c = PROJECT_STATUS_COLOR[s];
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setNewProjectStatus(s)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-all ${
                    newProjectStatus === s ? `${c.bg} ${c.text} border-current` : "bg-white text-surface-500 border-surface-200 hover:border-surface-300"
                  }`}
                >
                  {PROJECT_STATUS_LABEL[s]}
                </button>
              );
            })}
          </div>
          <textarea
            value={newProjectObjetivo}
            onChange={(e) => setNewProjectObjetivo(e.target.value)}
            rows={2}
            placeholder="Objetivo do projeto (opcional)…"
            className="w-full px-3 py-2 border border-surface-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 resize-none"
          />
        </form>

        {loadingProjects ? (
          <div className="flex items-center gap-2 text-sm text-surface-400">
            <Loader2 size={14} className="animate-spin" /> Carregando projetos…
          </div>
        ) : (
          <ul className="divide-y divide-surface-100 border border-surface-100 rounded-xl overflow-hidden">
            {projects.map((p) => (
              <ProjectRow key={p.id} project={p} />
            ))}
            {projects.length === 0 && (
              <li className="px-4 py-6 text-center text-sm text-surface-400">Nenhum projeto cadastrado</li>
            )}
          </ul>
        )}
      </section>

      <p className="text-[11px] text-surface-300 text-center">
        Logado como {userName} ({userEmail})
      </p>
    </div>
  );
}
