"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, CheckCircle2, BarChart3, Users, ShieldCheck, Mail } from "lucide-react";

interface Props {
  isDev: boolean;
}

const FEATURES = [
  {
    icon: BarChart3,
    title: "Dashboard centralizado",
    desc: "Acompanhe o progresso de toda a equipe em tempo real, com gráficos e métricas.",
  },
  {
    icon: Users,
    title: "Visão por colaborador",
    desc: "Filtre tarefas por pessoa e entenda onde cada um está no fluxo de trabalho.",
  },
  {
    icon: CheckCircle2,
    title: "Subtarefas e progresso",
    desc: "Desmembre atividades complexas e acompanhe o percentual de conclusão.",
  },
];

export default function LoginClient({ isDev }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | false>(false);
  const [devEmail, setDevEmail] = useState("");
  const [devError, setDevError] = useState("");

  async function handleMicrosoft() {
    setLoading("ms");
    await signIn("microsoft-entra-id", { callbackUrl: "/" });
  }

  async function handleDevLogin(e: React.FormEvent) {
    e.preventDefault();
    const email = devEmail.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      setDevError("Informe um e-mail válido.");
      return;
    }
    setDevError("");
    setLoading("dev");

    const result = await signIn("dev", { email, redirect: false });
    if (!result?.ok) {
      setDevError("Erro ao autenticar. Tente novamente.");
      setLoading(false);
      return;
    }

    await fetch("/api/tasks/seed", { method: "POST" });
    router.push("/");
  }

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel ───────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[55%] xl:w-[60%] relative overflow-hidden bg-[#011f1c] flex-col">
        {/* Gradient blobs */}
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-brand-500/30 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-teal-400/10 blur-[100px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/3 w-[300px] h-[300px] rounded-full bg-brand-400/15 blur-[80px] pointer-events-none" />

        {/* Dot grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "radial-gradient(circle, #fff 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* Diagonal lines accent */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: "repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)",
            backgroundSize: "20px 20px",
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full px-12 py-12">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-auto">
            <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
            </div>
            <span className="text-white/80 font-semibold text-sm tracking-wide">Acompanhamento de Tarefas</span>
          </div>

          {/* Hero text */}
          <div className="mb-14">
            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-5">
              Visibilidade total
              <br />
              <span className="text-brand-300">do seu time</span>
            </h1>
            <p className="text-white/50 text-base leading-relaxed max-w-sm">
              Substitua planilhas dispersas por um painel único. Acompanhe tarefas, prazos e progresso de toda a equipe em um só lugar.
            </p>
          </div>

          {/* Feature list */}
          <div className="space-y-5 mb-16">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-lg bg-white/8 border border-white/8 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon size={16} className="text-brand-300" />
                </div>
                <div>
                  <p className="text-white/85 font-medium text-sm">{title}</p>
                  <p className="text-white/35 text-xs mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom badge */}
          <div className="flex items-center gap-2">
            <ShieldCheck size={13} className="text-brand-400" />
            <span className="text-white/30 text-xs">Acesso restrito a colaboradores autorizados</span>
          </div>
        </div>

        {/* Decorative corner card */}
        <div className="absolute bottom-12 right-10 w-64 opacity-90 pointer-events-none select-none">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-white/50 text-[11px] font-medium">Atualizado agora</span>
            </div>
            <div className="space-y-2">
              {[
                { label: "Concluídas hoje", value: "3 tarefas", color: "bg-brand-500" },
                { label: "Em andamento", value: "5 tarefas", color: "bg-blue-500" },
                { label: "Pendentes", value: "2 tarefas", color: "bg-surface-400" },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${color}`} />
                    <span className="text-white/40 text-[11px]">{label}</span>
                  </div>
                  <span className="text-white/70 text-[11px] font-semibold">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Right panel ──────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center bg-white px-6 py-12">
        {/* Mobile logo */}
        <div className="flex lg:hidden items-center gap-2.5 mb-10">
          <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          </div>
          <span className="font-bold text-surface-800 text-base">Acomp. Tarefas</span>
        </div>

        <div className="w-full max-w-[380px]">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-surface-900 mb-2">Bem-vindo de volta</h2>
            <p className="text-surface-400 text-sm leading-relaxed">
              Entre com sua conta corporativa Microsoft para acessar o sistema.
            </p>
          </div>

          <div className="space-y-4">
            {/* Microsoft button */}
            <button
              onClick={handleMicrosoft}
              disabled={loading !== false}
              className="w-full flex items-center justify-center gap-3 px-5 py-4 bg-[#2F2F2F] text-white rounded-2xl font-semibold hover:bg-[#1a1a1a] active:scale-[0.98] transition-all text-sm shadow-lg shadow-black/10 disabled:opacity-60"
            >
              {loading === "ms" ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <MicrosoftLogo size={18} />
              )}
              Continuar com Microsoft 365
            </button>

            {/* Security info */}
            <div className="bg-surface-50 rounded-xl p-4 border border-surface-100">
              <div className="flex gap-2.5">
                <ShieldCheck size={15} className="text-brand-500 shrink-0 mt-0.5" />
                <p className="text-xs text-surface-500 leading-relaxed">
                  Autenticação via SSO corporativo. Somente colaboradores com conta ativa na organização podem acessar.
                </p>
              </div>
            </div>

            {/* Dev email input */}
            {isDev && (
              <>
                <div className="flex items-center gap-3 my-2">
                  <div className="flex-1 h-px bg-surface-100" />
                  <span className="text-[11px] text-surface-300 font-medium">dev</span>
                  <div className="flex-1 h-px bg-surface-100" />
                </div>

                <form onSubmit={handleDevLogin} className="space-y-2">
                  <div className="relative">
                    <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
                    <input
                      type="email"
                      value={devEmail}
                      onChange={(e) => { setDevEmail(e.target.value); setDevError(""); }}
                      placeholder="seu.email@empresa.com"
                      disabled={loading !== false}
                      className="w-full pl-9 pr-3 py-3 border border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 disabled:opacity-50 transition-colors"
                    />
                  </div>
                  {devError && <p className="text-xs text-red-500 px-1">{devError}</p>}
                  <button
                    type="submit"
                    disabled={loading !== false || !devEmail.trim()}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-surface-200 rounded-xl text-sm font-medium text-surface-700 hover:bg-surface-50 hover:border-brand-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading === "dev" ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : null}
                    Entrar com e-mail (dev)
                  </button>
                </form>

                <div className="flex items-center gap-2 justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <p className="text-[11px] text-surface-400">Modo desenvolvimento</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MicrosoftLogo({ size = 16 }: { size?: number }) {
  const s = size / 2 - 0.5;
  return (
    <svg width={size} height={size} viewBox="0 0 21 21" fill="none">
      <rect x="1" y="1" width={s * 2 - 1} height={s * 2 - 1} fill="#F25022" />
      <rect x={s + 1} y="1" width={s * 2 - 1} height={s * 2 - 1} fill="#7FBA00" />
      <rect x="1" y={s + 1} width={s * 2 - 1} height={s * 2 - 1} fill="#00A4EF" />
      <rect x={s + 1} y={s + 1} width={s * 2 - 1} height={s * 2 - 1} fill="#FFB900" />
    </svg>
  );
}
