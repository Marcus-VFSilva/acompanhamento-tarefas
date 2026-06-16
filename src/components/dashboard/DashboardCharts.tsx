"use client";

import {
  PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import type { Task } from "@/types";
import { STATUS_LABELS } from "@/types";

const STATUS_COLORS: Record<string, string> = {
  pendente: "#94a3b8",
  em_andamento: "#3b82f6",
  concluido: "#044a42",
  cancelado: "#ef4444",
};

interface Props { tasks: Task[] }

export default function DashboardCharts({ tasks }: Props) {
  const statusData = Object.entries(STATUS_LABELS).map(([key, label]) => ({
    name: label,
    value: tasks.filter((t) => t.status === key).length,
    color: STATUS_COLORS[key],
  })).filter((d) => d.value > 0);

  const projectMap = new Map<string, { pendente: number; em_andamento: number; concluido: number }>();
  tasks.forEach((t) => {
    const key = t.projeto || "Sem projeto";
    if (!projectMap.has(key)) projectMap.set(key, { pendente: 0, em_andamento: 0, concluido: 0 });
    const p = projectMap.get(key)!;
    if (t.status === "pendente") p.pendente++;
    else if (t.status === "em_andamento") p.em_andamento++;
    else if (t.status === "concluido") p.concluido++;
  });
  const projectData = Array.from(projectMap.entries()).map(([name, v]) => ({ name, ...v }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-white rounded-xl border border-surface-200 p-5">
        <h3 className="text-sm font-semibold text-surface-700 mb-4">Distribuição por status</h3>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
              {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
            </Pie>
            <Tooltip formatter={(v) => [`${v} tarefa(s)`, ""]} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-xl border border-surface-200 p-5">
        <h3 className="text-sm font-semibold text-surface-700 mb-4">Tarefas por projeto</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={projectData} layout="vertical" barSize={10}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={110} />
            <Tooltip />
            <Bar dataKey="pendente" name="Pendente" fill="#94a3b8" stackId="a" />
            <Bar dataKey="em_andamento" name="Em andamento" fill="#3b82f6" stackId="a" />
            <Bar dataKey="concluido" name="Concluído" fill="#044a42" stackId="a" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
