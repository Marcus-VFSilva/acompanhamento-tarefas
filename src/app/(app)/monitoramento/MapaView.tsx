"use client";

import { useRef, useEffect, useState, useMemo, useCallback } from "react";
import { STATUS_SISTEMA, ZONE_LABELS } from "@/types/system";
import type { SystemWithObs, SystemStatus, SystemZone } from "@/types/system";

const ZONE_COLUMNS: { left: SystemZone[]; center: SystemZone[]; right: SystemZone[]; bottom: SystemZone[] } = {
  left:   ["suprimentos", "integracao", "campo"],
  center: ["nucleo"],
  right:  ["infra", "fiscal", "analytics", "atendimento"],
  bottom: ["futuro"],
};

function StatusDot({ status }: { status: SystemStatus }) {
  const s = STATUS_SISTEMA[status];
  return <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />;
}

function MapCard({
  sistema,
  onClick,
  cardRef,
}: {
  sistema: SystemWithObs;
  onClick: () => void;
  cardRef: (el: HTMLDivElement | null) => void;
}) {
  const st = STATUS_SISTEMA[sistema.status];
  const isCore = !!sistema.core;
  return (
    <div
      ref={cardRef}
      onClick={onClick}
      className={`bg-white rounded-xl border cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 select-none
        ${isCore ? "border-[1.5px] shadow-md" : "border-surface-200"}`}
      style={{ borderColor: isCore ? st.color : undefined }}
    >
      <div className="px-3 py-2.5">
        <div className="flex items-start gap-1.5 mb-1.5">
          <StatusDot status={sistema.status} />
          <h3 className={`font-semibold text-surface-900 leading-snug ${isCore ? "text-[14px]" : "text-[12px]"}`}>
            {sistema.name}
          </h3>
        </div>
        {isCore && sistema.modules && (
          <div className="flex flex-wrap gap-1 mb-1.5">
            {sistema.modules.slice(0, 5).map((m) => (
              <span key={m} className="text-[9px] bg-surface-50 border border-surface-100 text-surface-500 px-1.5 py-0.5 rounded font-mono">{m}</span>
            ))}
            {sistema.modules.length > 5 && (
              <span className="text-[9px] text-surface-400">+{sistema.modules.length - 5}</span>
            )}
          </div>
        )}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full text-white`} style={{ background: st.color }}>
            {st.label}
          </span>
          {sistema.vendor && (
            <span className="text-[9px] text-surface-400 font-mono">{sistema.vendor}</span>
          )}
        </div>
      </div>
    </div>
  );
}

interface SvgPath {
  id: string;
  d: string;
  color: string;
  dir: "in" | "out" | "both";
}

function computePath(
  from: DOMRect, to: DOMRect, container: DOMRect,
  fromZone: SystemZone, toZone: SystemZone
): string {
  const fromCx = from.left + from.width / 2 - container.left;
  const fromCy = from.top + from.height / 2 - container.top;
  const toCx = to.left + to.width / 2 - container.left;
  const toCy = to.top + to.height / 2 - container.top;

  let x1 = fromCx, y1 = fromCy, x2 = toCx, y2 = toCy;
  let cp1x: number, cp1y: number, cp2x: number, cp2y: number;

  const leftZones = new Set<SystemZone>(["suprimentos", "integracao", "campo"]);
  const rightZones = new Set<SystemZone>(["infra", "fiscal", "analytics", "atendimento"]);
  const centerZones = new Set<SystemZone>(["nucleo"]);

  const fromLeft = leftZones.has(fromZone);
  const fromRight = rightZones.has(fromZone);
  const fromCenter = centerZones.has(fromZone);
  const toLeft = leftZones.has(toZone);
  const toRight = rightZones.has(toZone);
  const toCenter = centerZones.has(toZone);

  if ((fromLeft && toCenter) || (fromLeft && toRight)) {
    x1 = from.right - container.left;
    x2 = to.left - container.left;
    const dx = Math.abs(x2 - x1) * 0.45;
    cp1x = x1 + dx; cp1y = y1;
    cp2x = x2 - dx; cp2y = y2;
  } else if ((fromRight && toCenter) || (fromRight && toLeft)) {
    x1 = from.left - container.left;
    x2 = to.right - container.left;
    const dx = Math.abs(x2 - x1) * 0.45;
    cp1x = x1 - dx; cp1y = y1;
    cp2x = x2 + dx; cp2y = y2;
  } else if (fromCenter && toRight) {
    x1 = from.right - container.left;
    x2 = to.left - container.left;
    const dx = Math.abs(x2 - x1) * 0.45;
    cp1x = x1 + dx; cp1y = y1;
    cp2x = x2 - dx; cp2y = y2;
  } else if (fromCenter && toLeft) {
    x1 = from.left - container.left;
    x2 = to.right - container.left;
    const dx = Math.abs(x2 - x1) * 0.45;
    cp1x = x1 - dx; cp1y = y1;
    cp2x = x2 + dx; cp2y = y2;
  } else {
    // Same column — route around (S-curve)
    const side = fromLeft ? -60 : fromRight ? 60 : 80;
    if (fromCy < toCy) {
      y1 = from.bottom - container.top;
      y2 = to.top - container.top;
    } else {
      y1 = from.top - container.top;
      y2 = to.bottom - container.top;
    }
    cp1x = x1 + side; cp1y = y1 + (y2 - y1) * 0.2;
    cp2x = x2 + side; cp2y = y2 - (y2 - y1) * 0.2;
  }

  return `M ${x1.toFixed(1)} ${y1.toFixed(1)} C ${cp1x!.toFixed(1)} ${cp1y!.toFixed(1)} ${cp2x!.toFixed(1)} ${cp2y!.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`;
}

const DIR_COLOR: Record<string, string> = {
  in: "#3b82f6",
  out: "#044a42",
  both: "#8b5cf6",
};

// Build an index of which zone each system belongs to
function useZoneIndex(sistemas: SystemWithObs[]) {
  return useMemo(() => {
    const m: Record<string, SystemZone> = {};
    for (const s of sistemas) m[s.id] = s.zone;
    return m;
  }, [sistemas]);
}

export default function MapaView({
  sistemas,
  onSelect,
}: {
  sistemas: SystemWithObs[];
  onSelect: (s: SystemWithObs) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [paths, setPaths] = useState<SvgPath[]>([]);

  const zoneIndex = useZoneIndex(sistemas);

  const byZone = useMemo(() => {
    const m: Record<string, SystemWithObs[]> = {};
    for (const s of sistemas) {
      if (!m[s.zone]) m[s.zone] = [];
      m[s.zone].push(s);
    }
    return m;
  }, [sistemas]);

  const calculate = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const cRect = container.getBoundingClientRect();
    const newPaths: SvgPath[] = [];

    for (const sistema of sistemas) {
      const fromEl = cardRefs.current[sistema.id];
      if (!fromEl) continue;
      const fromRect = fromEl.getBoundingClientRect();

      for (const flow of sistema.flows) {
        const toEl = cardRefs.current[flow.to];
        if (!toEl) continue;
        const toRect = toEl.getBoundingClientRect();
        const fromZone = zoneIndex[sistema.id];
        const toZone = zoneIndex[flow.to];
        if (!fromZone || !toZone) continue;

        const d = computePath(fromRect, toRect, cRect, fromZone, toZone);
        newPaths.push({
          id: `${sistema.id}→${flow.to}`,
          d,
          color: DIR_COLOR[flow.dir] ?? DIR_COLOR.both,
          dir: flow.dir,
        });
      }
    }

    setPaths(newPaths);
  }, [sistemas, zoneIndex]);

  useEffect(() => {
    const timer = setTimeout(calculate, 60);
    const obs = new ResizeObserver(calculate);
    if (containerRef.current) obs.observe(containerRef.current);
    return () => { clearTimeout(timer); obs.disconnect(); };
  }, [calculate]);

  const setRef = (id: string) => (el: HTMLDivElement | null) => {
    cardRefs.current[id] = el;
  };

  function renderColumn(zones: SystemZone[]) {
    return zones.flatMap((zone) => {
      const items = byZone[zone] ?? [];
      if (items.length === 0) return [];
      return [
        <div key={`zone-${zone}`} className="mb-1">
          <p className="text-[9px] font-bold uppercase tracking-widest text-surface-400 mb-1.5 px-0.5">
            {ZONE_LABELS[zone]}
          </p>
          <div className="space-y-2">
            {items.map((s) => (
              <MapCard key={s.id} sistema={s} cardRef={setRef(s.id)} onClick={() => onSelect(s)} />
            ))}
          </div>
        </div>,
      ];
    });
  }

  return (
    <div ref={containerRef} className="relative px-4 py-4" style={{ minHeight: 560 }}>
      {/* Animated SVG overlay */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 0, overflow: "visible" }}
      >
        <defs>
          <style>{`
            @keyframes _flow_fwd { to { stroke-dashoffset: -24; } }
            @keyframes _flow_bwd { to { stroke-dashoffset: 24; } }
          `}</style>
        </defs>
        {paths.map((p) => (
          <g key={p.id}>
            <path d={p.d} fill="none" stroke={p.color} strokeWidth={1.5} strokeOpacity={0.12} />
            <path
              d={p.d}
              fill="none"
              stroke={p.color}
              strokeWidth={1.8}
              strokeOpacity={0.65}
              strokeDasharray="8 4"
              style={{ animation: `${p.dir === "in" ? "_flow_bwd" : "_flow_fwd"} 1.6s linear infinite` }}
            />
            {p.dir === "both" && (
              <path
                d={p.d}
                fill="none"
                stroke={p.color}
                strokeWidth={1.8}
                strokeOpacity={0.35}
                strokeDasharray="8 4"
                strokeDashoffset={12}
                style={{ animation: `_flow_bwd 1.6s linear infinite` }}
              />
            )}
          </g>
        ))}
      </svg>

      {/* Three-column layout */}
      <div className="relative grid grid-cols-3 gap-8" style={{ zIndex: 1 }}>
        <div className="space-y-4">{renderColumn(ZONE_COLUMNS.left)}</div>
        <div className="space-y-4">{renderColumn(ZONE_COLUMNS.center)}</div>
        <div className="space-y-4">{renderColumn(ZONE_COLUMNS.right)}</div>
      </div>

      {/* Bottom band */}
      {(byZone["futuro"]?.length ?? 0) > 0 && (
        <div className="relative mt-6" style={{ zIndex: 1 }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="flex-1 h-px bg-surface-200 border-dashed" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-surface-400">
              {ZONE_LABELS["futuro"]}
            </span>
            <div className="flex-1 h-px bg-surface-200" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {(byZone["futuro"] ?? []).map((s) => (
              <MapCard key={s.id} sistema={s} cardRef={setRef(s.id)} onClick={() => onSelect(s)} />
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="relative mt-5 flex flex-wrap gap-4 justify-center" style={{ zIndex: 1 }}>
        {[
          { color: DIR_COLOR.out,  label: "Envia dados" },
          { color: DIR_COLOR.in,   label: "Recebe dados" },
          { color: DIR_COLOR.both, label: "Bidirecional" },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5 text-[11px] text-surface-400">
            <svg width={28} height={8}>
              <path d="M0 4 L28 4" stroke={color} strokeWidth={2} strokeDasharray="6 3" />
            </svg>
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
