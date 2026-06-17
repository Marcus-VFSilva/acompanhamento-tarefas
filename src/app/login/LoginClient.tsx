"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Loader2, ShieldCheck, Mail,
  ListChecks, Server, BarChart3, FileSpreadsheet, BookOpen,
} from "lucide-react";

interface Props {
  isDev: boolean;
  authError?: string | null;
}

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  Configuration: "Configuração de autenticação incompleta. Verifique AUTH_SECRET e variáveis Microsoft na Vercel.",
  AccessDenied: "Acesso negado. Sua conta não tem permissão para entrar.",
  Verification: "Link de verificação inválido ou expirado.",
  OAuthSignin: "Erro ao iniciar login Microsoft. Verifique as credenciais no Azure e na Vercel.",
  OAuthCallback: "Erro no retorno do Microsoft. Confira o Redirect URI no Azure App Registration.",
  OAuthCreateAccount: "Não foi possível criar a conta.",
  Callback: "Erro no callback de autenticação.",
  Default: "Erro ao autenticar. Tente novamente ou use o login dev.",
};

const FEATURES = [
  {
    icon: ListChecks,
    title: "Gestão de Tarefas",
    desc: "Crie, priorize e acompanhe tarefas com status, prazos, progresso e subtarefas. Edição inline sem perder o fio.",
  },
  {
    icon: Server,
    title: "Mapa de Sistemas",
    desc: "Todos os sistemas do grupo em um mapa interativo com conexões animadas, uptime e observações de monitoramento.",
  },
  {
    icon: BarChart3,
    title: "Dashboards & Relatórios",
    desc: "Métricas consolidadas de tarefas e sistemas em um painel diário com gráficos, agenda e lembretes recorrentes.",
  },
  {
    icon: FileSpreadsheet,
    title: "Exportação Excel",
    desc: "Gere relatórios completos com todos os campos para compartilhar com a gestão ou arquivar histórico.",
  },
];

const SYSTEM_SNAPSHOT = [
  { label: "Sistemas estáveis",      value: "8 sistemas",  dot: "bg-blue-400"    },
  { label: "Em desenvolvimento",     value: "5 sistemas",  dot: "bg-purple-400"  },
  { label: "Em implantação",         value: "3 sistemas",  dot: "bg-emerald-400" },
];

export default function LoginClient({ isDev, authError }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | false>(false);
  const [devEmail, setDevEmail] = useState("");
  const [devError, setDevError] = useState("");
  const authErrorMessage = authError
    ? AUTH_ERROR_MESSAGES[authError] ?? AUTH_ERROR_MESSAGES.Default
    : null;

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

    router.push("/");
  }

  return (
    <div className="min-h-screen flex">

      {/* ── Left panel ─────────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[55%] xl:w-[58%] relative overflow-hidden bg-[#011f1c] flex-col">

        {/* Ambient blobs */}
        <div className="absolute -top-40 -left-40 w-[560px] h-[560px] rounded-full bg-brand-500/25 blur-[130px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[420px] h-[420px] rounded-full bg-teal-500/10 blur-[110px] pointer-events-none" />
        <div className="absolute top-[45%] left-[38%] w-[280px] h-[280px] rounded-full bg-brand-400/12 blur-[90px] pointer-events-none" />

        {/* Dot grid */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: "radial-gradient(circle, #fff 1px, transparent 0)",
            backgroundSize: "26px 26px",
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full px-12 py-11">

          {/* Brand header */}
          <div className="flex items-center gap-3 mb-auto">
            <img
              src="/favicon.png"
              alt="Grupo Roncador"
              className="w-9 h-9 object-contain rounded-xl"
            />
            <div>
              <p className="text-white font-bold text-[15px] leading-tight tracking-tight">Grupo Roncador</p>
              <p className="text-white/35 text-[10px] uppercase tracking-widest font-medium">Sistema Interno</p>
            </div>
          </div>

          {/* Hero */}
          <div className="mb-12">
            <div className="inline-flex items-center gap-2 bg-white/8 border border-white/10 rounded-full px-3 py-1 mb-6">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-300 animate-pulse" />
              <span className="text-white/50 text-[11px] font-medium tracking-wide uppercase">Ferramenta interna</span>
            </div>

            <h1 className="text-[42px] xl:text-5xl font-bold text-white leading-[1.12] mb-5 tracking-tight">
              Central de
              <br />
              <span className="text-brand-300">Gestão Operacional</span>
            </h1>
            <p className="text-white/45 text-[15px] leading-relaxed max-w-[360px]">
              Acompanhe tarefas, monitore sistemas e acesse métricas em tempo real — tudo em uma plataforma integrada.
            </p>
          </div>

          {/* Feature list */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-5 mb-12">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/7 border border-white/8 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon size={15} className="text-brand-300" />
                </div>
                <div>
                  <p className="text-white/80 font-semibold text-[13px] leading-tight mb-0.5">{title}</p>
                  <p className="text-white/30 text-[11px] leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="flex items-center gap-2">
            <ShieldCheck size={13} className="text-brand-400/70" />
            <span className="text-white/25 text-[11px]">Acesso restrito · apenas colaboradores autorizados</span>
          </div>
        </div>

        {/* Decorative floating card */}
        <div className="absolute bottom-10 right-8 w-60 pointer-events-none select-none">
          <div className="bg-white/6 border border-white/10 rounded-2xl p-4 backdrop-blur-sm shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Server size={12} className="text-brand-300" />
                <span className="text-white/50 text-[11px] font-semibold uppercase tracking-wider">Sistemas</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
                <span className="text-white/30 text-[10px]">ao vivo</span>
              </div>
            </div>
            <div className="space-y-2.5">
              {SYSTEM_SNAPSHOT.map(({ label, value, dot }) => (
                <div key={label} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${dot} shrink-0`} />
                    <span className="text-white/35 text-[11px]">{label}</span>
                  </div>
                  <span className="text-white/65 text-[11px] font-semibold tabular-nums">{value}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-white/8">
              <div className="flex items-center justify-between">
                <span className="text-white/25 text-[10px]">Total mapeado</span>
                <span className="text-brand-300 text-[11px] font-bold">27 sistemas</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right panel ──────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center bg-white px-6 py-14">

        {/* Mobile brand */}
        <div className="flex lg:hidden items-center gap-3 mb-10">
          <img src="/favicon.png" alt="Grupo Roncador" className="w-9 h-9 object-contain rounded-xl" />
          <div>
            <p className="font-bold text-surface-900 text-[15px] leading-tight">Grupo Roncador</p>
            <p className="text-surface-400 text-[10px] uppercase tracking-widest">Sistema Interno</p>
          </div>
        </div>

        <div className="w-full max-w-[360px]">

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-[26px] font-bold text-surface-900 leading-tight mb-2">
              Bem-vindo de volta
            </h2>
            <p className="text-surface-400 text-[14px] leading-relaxed">
              Acesse com sua conta corporativa Microsoft para entrar na plataforma.
            </p>
          </div>

          <div className="space-y-3">

            {authErrorMessage && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[12px] text-red-700 leading-relaxed">
                {authErrorMessage}
              </div>
            )}

            {/* Microsoft SSO button */}
            <button
              onClick={handleMicrosoft}
              disabled={loading !== false}
              className="w-full flex items-center justify-center gap-3 px-5 py-4 bg-[#2F2F2F] hover:bg-[#1e1e1e] text-white rounded-2xl font-semibold text-[14px] transition-all active:scale-[0.98] shadow-lg shadow-black/10 disabled:opacity-60"
            >
              {loading === "ms" ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <MicrosoftLogo size={17} />
              )}
              Continuar com Microsoft 365
            </button>

            {/* Trust badge */}
            <div className="flex items-start gap-2.5 bg-surface-50 border border-surface-100 rounded-xl p-3.5">
              <ShieldCheck size={14} className="text-brand-500 shrink-0 mt-0.5" />
              <p className="text-[12px] text-surface-500 leading-relaxed">
                Autenticação via SSO corporativo. Apenas colaboradores com conta ativa na organização têm acesso.
              </p>
            </div>

            {/* Dev mode */}
            {isDev && (
              <>
                <div className="flex items-center gap-3 pt-1">
                  <div className="flex-1 h-px bg-surface-100" />
                  <span className="text-[10px] text-surface-300 font-medium uppercase tracking-wider">dev</span>
                  <div className="flex-1 h-px bg-surface-100" />
                </div>

                <form onSubmit={handleDevLogin} className="space-y-2">
                  <div className="relative">
                    <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
                    <input
                      type="email"
                      value={devEmail}
                      onChange={(e) => { setDevEmail(e.target.value); setDevError(""); }}
                      placeholder="seu.email@roncador.com.br"
                      disabled={loading !== false}
                      className="w-full pl-8 pr-3 py-2.5 border border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 disabled:opacity-50 transition-colors"
                    />
                  </div>
                  {devError && <p className="text-xs text-red-500 px-1">{devError}</p>}
                  <button
                    type="submit"
                    disabled={loading !== false || !devEmail.trim()}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-surface-200 rounded-xl text-sm font-medium text-surface-600 hover:bg-surface-50 hover:border-surface-300 transition-all disabled:opacity-50"
                  >
                    {loading === "dev" && <Loader2 size={13} className="animate-spin" />}
                    Entrar com e-mail (dev)
                  </button>
                </form>

                <p className="text-center text-[10px] text-surface-300 flex items-center justify-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                  Ambiente de desenvolvimento
                </p>
              </>
            )}
          </div>

          {/* Bottom label */}
          <p className="text-center text-[11px] text-surface-300 mt-8">
            © {new Date().getFullYear()} Grupo Roncador · Uso interno
          </p>
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
