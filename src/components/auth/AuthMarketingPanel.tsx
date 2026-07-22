import { ShieldCheck, ListChecks, CalendarDays, BarChart3, FileSpreadsheet } from "lucide-react";

const FEATURES = [
  {
    icon: ListChecks,
    title: "Gestão de Tarefas",
    desc: "Crie, priorize e acompanhe tarefas com status, prazos, progresso e subtarefas.",
  },
  {
    icon: CalendarDays,
    title: "Calendário & Agenda",
    desc: "Reuniões, anotações e lembretes organizados por semana e mês.",
  },
  {
    icon: BarChart3,
    title: "Dashboards & Relatórios",
    desc: "Métricas consolidadas em painel diário e relatório semanal com gráficos.",
  },
  {
    icon: FileSpreadsheet,
    title: "Exportação Excel",
    desc: "Relatórios completos para compartilhar com a gestão ou arquivar histórico.",
  },
];

export default function AuthMarketingPanel() {
  return (
    <div className="hidden lg:flex lg:w-[55%] xl:w-[58%] relative overflow-hidden bg-[#011f1c] flex-col">
      <div className="absolute -top-40 -left-40 w-[560px] h-[560px] rounded-full bg-brand-500/25 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[420px] h-[420px] rounded-full bg-teal-500/10 blur-[110px] pointer-events-none" />
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: "radial-gradient(circle, #fff 1px, transparent 0)",
          backgroundSize: "26px 26px",
        }}
      />

      <div className="relative z-10 flex flex-col h-full px-12 py-11">
        <div className="flex items-center gap-3 mb-auto">
          <img src="/favicon.png" alt="Grupo Roncador" className="w-9 h-9 object-contain rounded-xl" />
          <div>
            <p className="text-white font-bold text-[15px] leading-tight tracking-tight">Grupo Roncador</p>
            <p className="text-white/35 text-[10px] uppercase tracking-widest font-medium">Sistema Interno</p>
          </div>
        </div>

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
            Acompanhe tarefas, organize sua agenda e acesse métricas em tempo real — tudo em uma plataforma integrada.
          </p>
        </div>

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

        <div className="flex items-center gap-2">
          <ShieldCheck size={13} className="text-brand-400/70" />
          <span className="text-white/25 text-[11px]">Acesso restrito · apenas colaboradores autorizados</span>
        </div>
      </div>
    </div>
  );
}

export function AuthMobileBrand() {
  return (
    <div className="flex lg:hidden items-center gap-3 mb-10">
      <img src="/favicon.png" alt="Grupo Roncador" className="w-9 h-9 object-contain rounded-xl" />
      <div>
        <p className="font-bold text-surface-900 text-[15px] leading-tight">Grupo Roncador</p>
        <p className="text-surface-400 text-[10px] uppercase tracking-widest">Sistema Interno</p>
      </div>
    </div>
  );
}
