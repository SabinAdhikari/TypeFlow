import { useMemo } from "react";

interface WpmChartProps {
  data: { date: string; wpm: number; accuracy: number }[];
}

export function WpmChart({ data }: WpmChartProps) {
  const width = 800;
  const height = 250;
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };

  const { wpmPath, accPath, maxWpm, points, accPoints } = useMemo(() => {
    if (data.length === 0) return { wpmPath: "", accPath: "", maxWpm: 100, points: [], accPoints: [] };

    const maxWpm = Math.max(...data.map((d) => d.wpm), 50);
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const xStep = data.length > 1 ? chartW / (data.length - 1) : 0;

    const points = data.map((d, i) => ({
      x: padding.left + i * xStep,
      y: padding.top + chartH - (d.wpm / maxWpm) * chartH,
      wpm: d.wpm,
      date: d.date,
    }));

    const accPoints = data.map((d, i) => ({
      x: padding.left + i * xStep,
      y: padding.top + chartH - (d.accuracy / 100) * chartH,
      accuracy: d.accuracy,
      date: d.date,
    }));

    const wpmPath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
    const accPath = accPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

    return { wpmPath, accPath, maxWpm, points, accPoints };
  }, [data]);

  if (data.length === 0) return null;

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[500px]" style={{ height: "auto" }}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((p) => (
          <line
            key={p}
            x1={padding.left}
            x2={width - padding.right}
            y1={padding.top + p * (height - padding.top - padding.bottom)}
            y2={padding.top + p * (height - padding.top - padding.bottom)}
            className="stroke-slate-200 dark:stroke-slate-800"
            strokeWidth={1}
          />
        ))}

        {/* Y-axis labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((p) => (
          <text
            key={p}
            x={padding.left - 8}
            y={padding.top + p * (height - padding.top - padding.bottom) + 4}
            className="fill-slate-400 text-xs"
            textAnchor="end"
          >
            {Math.round(maxWpm * (1 - p))}
          </text>
        ))}

        {/* WPM area gradient */}
        <defs>
          <linearGradient id="wpmGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1ab6ff" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#1ab6ff" stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* WPM area fill */}
        {points.length > 0 && (
          <path
            d={`${wpmPath} L ${points[points.length - 1].x} ${height - padding.bottom} L ${points[0].x} ${height - padding.bottom} Z`}
            fill="url(#wpmGradient)"
          />
        )}

        {/* Accuracy line (dashed) */}
        <path
          d={accPath}
          fill="none"
          className="stroke-emerald-400"
          strokeWidth={2}
          strokeDasharray="5 5"
        />

        {/* WPM line */}
        <path
          d={wpmPath}
          fill="none"
          className="stroke-brand-500"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={3} className="fill-brand-500" />
            <circle cx={p.x} cy={p.y} r={6} className="fill-brand-500 opacity-0 hover:opacity-20 transition-opacity" />
          </g>
        ))}

        {/* Legend */}
        <g transform={`translate(${width - 160}, ${padding.top - 5})`}>
          <line x1={0} y1={0} x2={20} y2={0} className="stroke-brand-500" strokeWidth={2.5} />
          <text x={25} y={4} className="fill-slate-500 text-xs">WPM</text>
          <line x1={70} y1={0} x2={90} y2={0} className="stroke-emerald-400" strokeWidth={2} strokeDasharray="5 5" />
          <text x={95} y={4} className="fill-slate-500 text-xs">Accuracy</text>
        </g>
      </svg>
    </div>
  );
}
