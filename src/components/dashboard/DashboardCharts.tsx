"use client";

import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { Task } from "@/types";
import { STATUS_LABELS } from "@/types";

const STATUS_COLORS: Record<string, string> = {
  pendente: "#94a3b8",
  em_andamento: "#3b82f6",
  concluido: "#044a42",
  cancelado: "#ef4444",
};

interface Props {
  tasks: Task[];
}

export default function DashboardCharts({ tasks }: Props) {
  const statusData = Object.entries(STATUS_LABELS).map(([key, label]) => ({
    name: label,
    value: tasks.filter((t) => t.status === key).length,
    color: STATUS_COLORS[key],
  })).filter((d) => d.value > 0);

  const userMap = new Map<string, { name: string; pendente: number; em_andamento: number; concluido: number }>();
  tasks.forEach((t) => {
    if (!userMap.has(t.assignedTo)) {
      userMap.set(t.assignedTo, { name: t.assignedToName.split(" ")[0], pendente: 0, em_andamento: 0, concluido: 0 });
    }
    const u = userMap.get(t.assignedTo)!;
    if (t.status === "pendente") u.pendente++;
    else if (t.status === "em_andamento") u.em_andamento++;
    else if (t.status === "concluido") u.concluido++;
  });
  const userData = Array.from(userMap.values());

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-white rounded-xl border border-surface-200 p-5">
        <h3 className="text-sm font-semibold text-surface-700 mb-4">Tarefas por Status</h3>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={statusData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={3}
              dataKey="value"
            >
              {statusData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(v) => [`${v} tarefa(s)`, ""]} />
            <Legend iconType="circle" iconSize={8} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-xl border border-surface-200 p-5">
        <h3 className="text-sm font-semibold text-surface-700 mb-4">Tarefas por Colaborador</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={userData} barSize={12}>
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="pendente" name="Pendente" fill="#94a3b8" stackId="a" radius={[0, 0, 0, 0]} />
            <Bar dataKey="em_andamento" name="Em andamento" fill="#3b82f6" stackId="a" />
            <Bar dataKey="concluido" name="Concluído" fill="#044a42" stackId="a" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
