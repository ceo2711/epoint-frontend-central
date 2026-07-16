"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { ProjectionPoint, StatusCount, TimeseriesPoint } from "@/features/dashboard/types";
import { STATUS_CHART_COLORS } from "@/features/dashboard/constants";
import { useTranslation } from "@/contexts/LanguageContext";
import { CLIENT_STATUS_LABELS } from "@/types/api";
import { PROSPECT_STATUS_ORDER } from "@/features/prospects/types";

const STATUS_COLORS = STATUS_CHART_COLORS;

const PROSPECT_STATUS_SET = new Set<string>(PROSPECT_STATUS_ORDER);

const CHART_TOOLTIP_STYLE = {
  borderRadius: "12px",
  border: "1px solid #e2e8f0",
  boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
};

function formatShortDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return date.toLocaleDateString("es-AR", { day: "2-digit", month: "short" });
}

function statusLabel(status: string, translate?: (key: string) => string) {
  if (PROSPECT_STATUS_SET.has(status) && translate) {
    return translate(`prospects.status.${status}`);
  }
  return CLIENT_STATUS_LABELS[status] ?? status;
}

export function StatusPieChart({ data, title }: { data: StatusCount[]; title: string }) {
  const { t } = useTranslation();
  const chartData = data
    .filter((item) => item.count > 0)
    .map((item) => ({
      name: statusLabel(item.status, (key) => t(key as never)),
      value: item.count,
      status: item.status,
    }));

  if (chartData.length === 0) {
    return (
      <ChartCard title={title}>
        <p className="py-16 text-center text-sm text-slate-500">Sin datos para mostrar</p>
      </ChartCard>
    );
  }

  return (
    <ChartCard title={title}>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={58}
            outerRadius={98}
            paddingAngle={2}
          >
            {chartData.map((entry) => (
              <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? "#64748b"} />
            ))}
          </Pie>
          <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function StatusBarChart({ data, title }: { data: StatusCount[]; title: string }) {
  const { t } = useTranslation();
  const chartData = data.map((item) => ({
    name: statusLabel(item.status, (key) => t(key as never)),
    count: item.count,
    status: item.status,
  }));

  return (
    <ChartCard title={title}>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 72 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-32} textAnchor="end" height={90} interval={0} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
          <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
          <Bar dataKey="count" radius={[8, 8, 0, 0]}>
            {chartData.map((entry) => (
              <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? "#64748b"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function TrendLineChart({
  data,
  title,
  color = "#3d6b45",
}: {
  data: TimeseriesPoint[];
  title: string;
  color?: string;
}) {
  const chartData = data.map((point) => ({
    ...point,
    label: formatShortDate(point.date),
  }));

  return (
    <ChartCard title={title}>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} minTickGap={24} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
          <Tooltip contentStyle={CHART_TOOLTIP_STYLE} labelFormatter={(_, payload) => payload?.[0]?.payload?.date ?? ""} />
          <Line type="monotone" dataKey="count" stroke={color} strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function ProjectionLineChart({
  history,
  projections,
  title,
}: {
  history: TimeseriesPoint[];
  projections: ProjectionPoint[];
  title: string;
}) {
  const historyPoints = history.map((point) => ({
    date: point.date,
    label: formatShortDate(point.date),
    actual: point.count,
    projected: null as number | null,
  }));
  const lastHistory = historyPoints.at(-1);
  const bridgePoint = lastHistory
    ? { ...lastHistory, projected: lastHistory.actual }
    : null;
  const projectionPoints = projections.map((point) => ({
    date: point.date,
    label: formatShortDate(point.date),
    actual: null as number | null,
    projected: point.projected,
  }));
  const chartData = bridgePoint
    ? [...historyPoints.slice(0, -1), bridgePoint, ...projectionPoints]
    : [...historyPoints, ...projectionPoints];

  return (
    <ChartCard title={title}>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} minTickGap={24} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
          <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
          <Legend />
          <Line
            type="monotone"
            dataKey="actual"
            name="Histórico"
            stroke="#3d6b45"
            strokeWidth={2.5}
            dot={{ r: 3 }}
            connectNulls={false}
          />
          <Line
            type="monotone"
            dataKey="projected"
            name="Proyección"
            stroke="#6366f1"
            strokeWidth={2.5}
            strokeDasharray="6 4"
            dot={{ r: 3 }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card-flat p-4 sm:p-5">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
      {children}
    </div>
  );
}
