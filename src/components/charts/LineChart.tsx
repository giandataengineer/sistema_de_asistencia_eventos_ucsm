function formatNum(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}K`;
  return n.toString();
}

function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return "";
  let d = `M${pts[0].x},${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const curr = pts[i];
    const next = pts[i + 1];
    const cpx = (curr.x + next.x) / 2;
    d += ` C${cpx},${curr.y} ${cpx},${next.y} ${next.x},${next.y}`;
  }
  return d;
}

interface LineChartProps {
  data: number[];
  xLabels: string[];
  color?: string;
  height?: number;
  yLabel?: string;
}

export function LineChart({
  data,
  xLabels,
  color = "#10b981",
  height = 220,
  yLabel = "",
}: LineChartProps) {
  if (data.length < 2) return null;

  const max = Math.max(...data, 1);
  const padTop = 20;
  const padBottom = 32;
  const padLeft = 52;
  const padRight = 16;
  const w = 600;
  const h = height;
  const chartH = h - padTop - padBottom;
  const chartW = w - padLeft - padRight;

  const gridLines = 4;
  const gridStep = max / gridLines;
  const gridValues = Array.from({ length: gridLines + 1 }, (_, i) => Math.round(i * gridStep));

  const points = data.map((v, i) => ({
    x: padLeft + (i / (data.length - 1)) * chartW,
    y: padTop + chartH - (v / max) * chartH,
  }));

  const linePath = smoothPath(points);
  const areaPath = `${linePath} L${points[points.length - 1].x},${padTop + chartH} L${points[0].x},${padTop + chartH} Z`;
  const labelStep = Math.max(1, Math.ceil(xLabels.length / 6));

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: `${height}px`, maxHeight: `${height}px` }}>
      <defs>
        <linearGradient id={`area-grad-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0.01" />
        </linearGradient>
      </defs>

      {gridValues.map((val, i) => {
        const y = padTop + chartH - (val / max) * chartH;
        return (
          <g key={i}>
            <line x1={padLeft} y1={y} x2={w - padRight} y2={y} stroke="#e5e7eb" strokeWidth="1" strokeDasharray={i === 0 ? "0" : "4 3"} />
            <text x={padLeft - 8} y={y + 4} textAnchor="end" fill="#9ca3af" fontSize="11" fontFamily="system-ui">
              {yLabel}{formatNum(val)}
            </text>
          </g>
        );
      })}

      <path d={areaPath} fill={`url(#area-grad-${color.replace("#", "")})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="white" stroke={color} strokeWidth="2" opacity={data[i] > 0 ? 1 : 0.3} />
      ))}

      {xLabels.map((label, i) => {
        if (i % labelStep !== 0 && i !== xLabels.length - 1) return null;
        const x = padLeft + (i / (xLabels.length - 1)) * chartW;
        return (
          <text key={i} x={x} y={h - 8} textAnchor="middle" fill="#9ca3af" fontSize="11" fontFamily="system-ui">
            {label}
          </text>
        );
      })}
    </svg>
  );
}

interface DualLineChartProps {
  data1: number[];
  data2: number[];
  xLabels: string[];
  color1?: string;
  color2?: string;
  label1?: string;
  label2?: string;
  height?: number;
}

export function DualLineChart({
  data1,
  data2,
  xLabels,
  color1 = "#10b981",
  color2 = "#06b6d4",
  label1 = "Serie 1",
  label2 = "Serie 2",
  height = 220,
}: DualLineChartProps) {
  if (data1.length < 2) return null;

  const max = Math.max(...data1, ...data2, 1);
  const padTop = 20;
  const padBottom = 32;
  const padLeft = 52;
  const padRight = 16;
  const w = 600;
  const h = height;
  const chartH = h - padTop - padBottom;
  const chartW = w - padLeft - padRight;

  const gridLines = 4;
  const gridStep = max / gridLines;
  const gridValues = Array.from({ length: gridLines + 1 }, (_, i) => Math.round(i * gridStep));

  function toPoints(data: number[]) {
    return data.map((v, i) => ({
      x: padLeft + (i / (data.length - 1)) * chartW,
      y: padTop + chartH - (v / max) * chartH,
    }));
  }

  const pts1 = toPoints(data1);
  const pts2 = toPoints(data2);
  const line1 = smoothPath(pts1);
  const line2 = smoothPath(pts2);
  const area1 = `${line1} L${pts1[pts1.length - 1].x},${padTop + chartH} L${pts1[0].x},${padTop + chartH} Z`;

  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: `${height}px`, maxHeight: `${height}px` }}>
        <defs>
          <linearGradient id="area-dual-1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color1} stopOpacity="0.15" />
            <stop offset="100%" stopColor={color1} stopOpacity="0.01" />
          </linearGradient>
        </defs>

        {gridValues.map((val, i) => {
          const y = padTop + chartH - (val / max) * chartH;
          return (
            <g key={i}>
              <line x1={padLeft} y1={y} x2={w - padRight} y2={y} stroke="#e5e7eb" strokeWidth="1" strokeDasharray={i === 0 ? "0" : "4 3"} />
              <text x={padLeft - 8} y={y + 4} textAnchor="end" fill="#9ca3af" fontSize="11" fontFamily="system-ui">
                {formatNum(val)}
              </text>
            </g>
          );
        })}

        <path d={area1} fill="url(#area-dual-1)" />
        <path d={line1} fill="none" stroke={color1} strokeWidth="2.5" strokeLinecap="round" />
        <path d={line2} fill="none" stroke={color2} strokeWidth="2.5" strokeLinecap="round" strokeDasharray="6 4" />

        {pts1.map((p, i) => (
          <circle key={`a${i}`} cx={p.x} cy={p.y} r="3.5" fill="white" stroke={color1} strokeWidth="2" />
        ))}
        {pts2.map((p, i) => (
          <circle key={`b${i}`} cx={p.x} cy={p.y} r="3" fill="white" stroke={color2} strokeWidth="1.5" />
        ))}

        {xLabels.map((label, i) => {
          const x = padLeft + (i / (xLabels.length - 1)) * chartW;
          return (
            <text key={i} x={x} y={h - 8} textAnchor="middle" fill="#9ca3af" fontSize="11" fontFamily="system-ui">
              {label}
            </text>
          );
        })}
      </svg>
      <div className="flex items-center gap-5 mt-2 ml-14">
        <span className="flex items-center gap-1.5 text-xs text-muted">
          <span className="w-4 h-[2.5px] rounded-full" style={{ backgroundColor: color1 }} /> {label1}
        </span>
        <span className="flex items-center gap-1.5 text-xs text-muted">
          <span className="w-4 h-[2.5px] rounded-full border-t-2 border-dashed" style={{ borderColor: color2 }} /> {label2}
        </span>
      </div>
    </div>
  );
}
