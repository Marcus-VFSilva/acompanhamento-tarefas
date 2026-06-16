"use client";

import { useState, useMemo } from "react";
import {
  Server, CheckCircle2, AlertTriangle, Wrench, Hourglass,
  Map, Lightbulb, X, Save, Activity, Search, ChevronDown,
  Loader2, Clock, MessageSquare, Wifi, LayoutGrid, Network,
} from "lucide-react";
import { useSistemasQuery, useUpdateSistemaObs } from "@/hooks/useSistemas";
import {
  STATUS_SISTEMA, OWNER_LABELS, ZONE_LABELS, ZONE_ORDER,
  type SystemWithObs, type SystemStatus, type SystemZone,
} from "@/types/system";
import MapaView from "./MapaView";

// ── Uptime bar ────────────────────────────────────────────────────────
function UptimeBar({ value }: { value: number }) {
  const color =
    value >= 99 ? "bg-emerald-500" :
    value >= 95 ? "bg-blue-500" :
    value >= 85 ? "bg-amber-400" : "bg-red-500";
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex-1 h-1.5 bg-surface-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
      <span className="text-[11px] font-mono text-surface-500 w-10 text-right">{value}%</span>
    </div>
  );
}

// ── Status badge ──────────────────────────────────────────────────────
function StatusBadge({ status }: { status: SystemStatus }) {
  const s = STATUS_SISTEMA[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${s.bg} ${s.text}`}>
      {status === "estavel" && <CheckCircle2 size={9} />}
      {status === "melhorias" && <AlertTriangle size={9} />}
      {status === "desenvolvimento" && <Wrench size={9} />}
      {status === "implantacao" && <Hourglass size={9} />}
      {status === "mapeamento" && <Map size={9} />}
      {status === "futuro" && <Lightbulb size={9} />}
      {s.label}
    </span>
  );
}

// ── Sistema card ──────────────────────────────────────────────────────
function SistemaCard({ sistema, onClick }: { sistema: SystemWithObs; onClick: () => void }) {
  const { obs } = sistema;
  const hasObs = obs?.observacao && obs.observacao.trim();
  const hasUptime = obs?.uptime !== undefined && obs.uptime !== null;

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-xl border border-surface-200 p-4 hover:border-brand-500/40 hover:shadow-sm transition-all group"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-[13px] font-semibold text-surface-900 leading-snug group-hover:text-brand-700 transition-colors">
          {sistema.name}
        </h3>
        <StatusBadge status={sistema.status} />
      </div>

      <p className="text-[11.5px] text-surface-500 leading-relaxed line-clamp-2 mb-3">
        {sistema.desc}
      </p>

      {hasUptime && <UptimeBar value={obs!.uptime!} />}

      <div className="flex items-center gap-2 mt-2.5 flex-wrap">
        {sistema.vendor && (
          <span className="text-[10px] font-mono text-surface-400 bg-surface-50 border border-surface-100 px-1.5 py-0.5 rounded">
            {sistema.vendor}
          </span>
        )}
        <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium
          ${sistema.owner === "proprio" ? "text-brand-700 bg-brand-50 border-brand-200" :
            sistema.owner === "parceria" ? "text-purple-700 bg-purple-50 border-purple-200" :
            "text-surface-500 bg-surface-50 border-surface-200"}`}>
          {OWNER_LABELS[sistema.owner]}
        </span>
        {obs?.ultimaVerificacao && (
          <span className="text-[10px] text-surface-400 flex items-center gap-1 ml-auto">
            <Clock size={9} />
            {obs.ultimaVerificacao}
          </span>
        )}
      </div>

      {hasObs && (
        <div className="mt-2.5 pt-2.5 border-t border-surface-100 flex items-start gap-1.5">
          <MessageSquare size={10} className="text-surface-400 mt-0.5 shrink-0" />
          <p className="text-[10.5px] text-surface-500 line-clamp-1 italic">{obs!.observacao}</p>
        </div>
      )}
    </button>
  );
}

// ── Drawer de edição ──────────────────────────────────────────────────
function EditDrawer({
  sistema,
  onClose,
}: {
  sistema: SystemWithObs;
  onClose: () => void;
}) {
  const update = useUpdateSistemaObs();
  const [uptime, setUptime] = useState(sistema.obs?.uptime?.toString() ?? "");
  const [observacao, setObservacao] = useState(sistema.obs?.observacao ?? "");
  const [ultimaVerificacao, setUltimaVerificacao] = useState(
    sistema.obs?.ultimaVerificacao ?? new Date().toISOString().split("T")[0]
  );

  async function handleSave() {
    await update.mutateAsync({
      id: sistema.id,
      obs: {
        uptime: uptime !== "" ? Number(uptime) : undefined,
        observacao: observacao || undefined,
        ultimaVerificacao: ultimaVerificacao || undefined,
      },
    });
    onClose();
  }

  const st = STATUS_SISTEMA[sistema.status];

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]"
        onClick={onClose}
      />
      <div className="fixed right-0 top-0 bottom-0 z-50 w-[420px] max-w-[95vw] bg-white shadow-xl flex flex-col">
        {/* Header */}
        <div className="border-b border-surface-200 px-5 py-4 flex-shrink-0">
          <div className="h-1 w-full rounded-full mb-4" style={{ background: st.color }} />
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-surface-900">{sistema.name}</h2>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <StatusBadge status={sistema.status} />
                <span className="text-[11px] text-surface-400">{ZONE_LABELS[sistema.zone]}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-400 hover:text-surface-700 transition-colors shrink-0"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Descrição */}
          <div>
            <h4 className="text-[10px] uppercase tracking-widest font-semibold text-surface-400 mb-2">Descrição</h4>
            <p className="text-[13px] text-surface-600 leading-relaxed">{sistema.desc}</p>
          </div>

          {/* Módulos */}
          {sistema.modules.length > 0 && (
            <div>
              <h4 className="text-[10px] uppercase tracking-widest font-semibold text-surface-400 mb-2">Módulos</h4>
              <div className="flex flex-wrap gap-1.5">
                {sistema.modules.map((m) => (
                  <span key={m} className="text-[11px] bg-surface-50 border border-surface-200 text-surface-600 px-2 py-0.5 rounded-md font-mono">
                    {m}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Integrações */}
          {sistema.flows.length > 0 && (
            <div>
              <h4 className="text-[10px] uppercase tracking-widest font-semibold text-surface-400 mb-2">Integrações</h4>
              <div className="space-y-1.5">
                {sistema.flows.map((f, i) => (
                  <div key={i} className="flex items-start gap-2 p-2 rounded-lg border border-surface-100 bg-surface-50">
                    <span className="text-[11px] font-mono text-brand-500 shrink-0 mt-0.5">
                      {f.dir === "in" ? "←" : f.dir === "out" ? "→" : "↔"}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold text-surface-700">{f.to}</p>
                      <p className="text-[11px] text-surface-500 leading-snug">{f.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-surface-100" />

          {/* Campos editáveis */}
          <div>
            <h4 className="text-[10px] uppercase tracking-widest font-semibold text-surface-400 mb-3">Monitoramento</h4>

            <div className="space-y-3">
              <div>
                <label className="block text-[12px] font-medium text-surface-700 mb-1">
                  Uptime (%)
                </label>
                <div className="relative">
                  <Wifi size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={uptime}
                    onChange={(e) => setUptime(e.target.value)}
                    placeholder="ex: 99.5"
                    className="w-full pl-8 pr-3 py-2 text-sm border border-surface-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                  />
                </div>
                {uptime !== "" && <UptimeBar value={Number(uptime)} />}
              </div>

              <div>
                <label className="block text-[12px] font-medium text-surface-700 mb-1">
                  Última verificação
                </label>
                <input
                  type="date"
                  value={ultimaVerificacao}
                  onChange={(e) => setUltimaVerificacao(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-surface-700 mb-1">
                  Observação / Situação atual
                </label>
                <textarea
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  rows={4}
                  placeholder="Status atual, impedimentos, próximos passos..."
                  className="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Meta */}
          {sistema.obs?.updatedAt && (
            <p className="text-[10.5px] text-surface-400">
              Última atualização: {sistema.obs.updatedAt}
              {sistema.obs.updatedBy && ` por ${sistema.obs.updatedBy.split("@")[0]}`}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-surface-200 px-5 py-3 flex-shrink-0 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 text-sm font-medium text-surface-600 border border-surface-200 rounded-lg hover:bg-surface-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={update.isPending}
            className="flex-1 py-2 text-sm font-semibold text-white bg-brand-500 rounded-lg hover:bg-brand-600 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
          >
            {update.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Salvar
          </button>
        </div>
      </div>
    </>
  );
}

// ── KPI card ──────────────────────────────────────────────────────────
function KpiCard({ label, value, icon: Icon, color }: {
  label: string; value: number; icon: React.ElementType; color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-surface-200 p-3.5 flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}20` }}>
        <Icon size={15} style={{ color }} />
      </div>
      <div>
        <p className="text-lg font-bold text-surface-900 leading-none">{value}</p>
        <p className="text-[11px] text-surface-400 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────
export default function MonitoramentoClient() {
  const { data: sistemas = [], isLoading } = useSistemasQuery();
  const [selected, setSelected] = useState<SystemWithObs | null>(null);
  const [search, setSearch] = useState("");
  const [zoneFilter, setZoneFilter] = useState<SystemZone | "todas">("todas");
  const [statusFilter, setStatusFilter] = useState<SystemStatus | "todos">("todos");
  const [viewMode, setViewMode] = useState<"grade" | "mapa">("grade");

  const filtered = useMemo(() => {
    return sistemas.filter((s) => {
      if (zoneFilter !== "todas" && s.zone !== zoneFilter) return false;
      if (statusFilter !== "todos" && s.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!s.name.toLowerCase().includes(q) && !s.desc.toLowerCase().includes(q) && !s.vendor?.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [sistemas, zoneFilter, statusFilter, search]);

  const grouped = useMemo(() => {
    const map: Record<string, SystemWithObs[]> = {};
    for (const zone of ZONE_ORDER) {
      const items = filtered.filter((s) => s.zone === zone);
      if (items.length > 0) map[zone] = items;
    }
    return map;
  }, [filtered]);

  // KPIs
  const kpis = useMemo(() => ({
    total: sistemas.length,
    estaveis: sistemas.filter((s) => s.status === "estavel").length,
    desenvolvimento: sistemas.filter((s) => s.status === "desenvolvimento" || s.status === "implantacao").length,
    atencao: sistemas.filter((s) => s.status === "melhorias" || s.status === "mapeamento" || s.status === "futuro").length,
    comObs: sistemas.filter((s) => s.obs?.observacao?.trim()).length,
  }), [sistemas]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 size={20} className="animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-surface-50 min-h-0 overflow-y-auto">
      {/* Header */}
      <div className="bg-white border-b border-surface-200 px-5 py-4">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center">
              <Server size={16} className="text-brand-600" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-surface-900">Mapa de Sistemas</h1>
              <p className="text-[11px] text-surface-400">Grupo Roncador · {sistemas.length} sistemas</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Activity size={14} className="text-brand-500" />
              <span className="text-[11px] text-surface-500">{kpis.comObs} com observações</span>
            </div>
            {/* View toggle */}
            <div className="flex items-center bg-surface-100 rounded-lg p-0.5 gap-0.5">
              <button
                onClick={() => setViewMode("grade")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all
                  ${viewMode === "grade" ? "bg-white shadow-sm text-surface-900" : "text-surface-400 hover:text-surface-700"}`}
              >
                <LayoutGrid size={12} /> Grade
              </button>
              <button
                onClick={() => setViewMode("mapa")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all
                  ${viewMode === "mapa" ? "bg-white shadow-sm text-surface-900" : "text-surface-400 hover:text-surface-700"}`}
              >
                <Network size={12} /> Mapa
              </button>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
          <KpiCard label="Total" value={kpis.total} icon={Server} color="#044a42" />
          <KpiCard label="Estáveis" value={kpis.estaveis} icon={CheckCircle2} color="#2F6FED" />
          <KpiCard label="Em dev / implantação" value={kpis.desenvolvimento} icon={Wrench} color="#8B5CF6" />
          <KpiCard label="Melhorias / Futuro" value={kpis.atencao} icon={AlertTriangle} color="#E0563B" />
        </div>

        {/* Filtros — só visível na grade */}
        {viewMode === "mapa" ? (
          <p className="text-[11px] text-surface-400 italic">
            Clique em um sistema no mapa para ver detalhes e editar observações.
          </p>
        ) : (
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-surface-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar sistema..."
              className="pl-7 pr-3 py-1.5 text-[12px] border border-surface-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 w-52"
            />
          </div>

          <div className="relative">
            <select
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value as SystemZone | "todas")}
              className="appearance-none pl-3 pr-7 py-1.5 text-[12px] border border-surface-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 cursor-pointer"
            >
              <option value="todas">Todas as zonas</option>
              {ZONE_ORDER.map((z) => (
                <option key={z} value={z}>{ZONE_LABELS[z]}</option>
              ))}
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as SystemStatus | "todos")}
              className="appearance-none pl-3 pr-7 py-1.5 text-[12px] border border-surface-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 cursor-pointer"
            >
              <option value="todos">Todos os status</option>
              {Object.entries(STATUS_SISTEMA).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
          </div>

          {(search || zoneFilter !== "todas" || statusFilter !== "todos") && (
            <button
              onClick={() => { setSearch(""); setZoneFilter("todas"); setStatusFilter("todos"); }}
              className="px-3 py-1.5 text-[12px] text-surface-500 border border-surface-200 rounded-lg hover:bg-surface-50 flex items-center gap-1"
            >
              <X size={11} /> Limpar
            </button>
          )}

          <span className="ml-auto text-[11px] text-surface-400 self-center">
            {filtered.length} sistema{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>
        )}
      </div>

      {/* Content */}
      {viewMode === "mapa" ? (
        <div className="flex-1 bg-surface-50 overflow-auto">
          <MapaView sistemas={sistemas} onSelect={(s) => setSelected(s)} />
        </div>
      ) : (
        <div className="flex-1 px-5 py-5 space-y-6">
          {Object.keys(grouped).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-surface-400">
              <Server size={32} className="mb-3 opacity-30" />
              <p className="text-sm">Nenhum sistema encontrado</p>
            </div>
          ) : (
            ZONE_ORDER.filter((zone) => grouped[zone]?.length).map((zone) => {
              const items = grouped[zone];
              return (
                <div key={zone}>
                  <div className="flex items-center gap-2 mb-3">
                    <h2 className="text-[11px] font-bold uppercase tracking-widest text-surface-500">
                      {ZONE_LABELS[zone]}
                    </h2>
                    <div className="flex-1 h-px bg-surface-200" />
                    <span className="text-[10px] text-surface-400">{items.length}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {items.map((s: SystemWithObs) => (
                      <SistemaCard
                        key={s.id}
                        sistema={s}
                        onClick={() => setSelected(s)}
                      />
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Drawer */}
      {selected && (
        <EditDrawer
          sistema={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
