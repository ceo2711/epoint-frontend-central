import Link from "next/link";

export function StatCard({
  title,
  value,
  accent = "blue",
  href,
  suffix,
}: {
  title: string;
  value: number | string;
  accent?: "blue" | "indigo" | "green" | "slate" | "amber" | "red";
  href?: string;
  suffix?: string;
}) {
  const accentColors = {
    blue: "from-blue-500 to-blue-600",
    indigo: "from-indigo-500 to-indigo-600",
    green: "from-emerald-500 to-emerald-600",
    slate: "from-slate-400 to-slate-500",
    amber: "from-amber-500 to-amber-600",
    red: "from-red-500 to-red-600",
  };

  const content = (
    <div className="stat-card transition hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</p>
          <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900">
            {value}
            {suffix ? <span className="ml-1 text-lg font-semibold text-slate-500">{suffix}</span> : null}
          </p>
        </div>
        <div className={`h-2.5 w-2.5 rounded-full bg-gradient-to-r ${accentColors[accent]}`} />
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }

  return content;
}
