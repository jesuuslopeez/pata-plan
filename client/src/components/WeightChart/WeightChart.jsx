import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import './WeightChart.scss';

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
  });
}

function formatFullDate(iso) {
  return new Date(iso).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function renderDot(props) {
  const { cx, cy, payload, index } = props;
  if (cx == null || cy == null) return null;
  if (payload?.isAnomaly) {
    return (
      <circle
        key={`dot-anomaly-${index}`}
        cx={cx}
        cy={cy}
        r={6}
        fill="var(--dot-danger)"
        stroke="var(--dot-danger)"
        strokeWidth={2}
      />
    );
  }
  return (
    <circle
      key={`dot-${index}`}
      cx={cx}
      cy={cy}
      r={4}
      fill="var(--dot-primary)"
      stroke="var(--dot-primary)"
    />
  );
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <div className="weight-chart__tooltip">
      <div className="weight-chart__tooltip-date">{formatFullDate(data.recordedAt)}</div>
      <div className="weight-chart__tooltip-value">{data.value} kg</div>
      {data.isAnomaly && <div className="weight-chart__tooltip-anomaly">Anomalía detectada</div>}
    </div>
  );
}

export function WeightChart({ weights }) {
  if (!weights || weights.length < 2) {
    return (
      <div className="weight-chart__empty">
        Se necesitan al menos 2 registros para mostrar el gráfico
      </div>
    );
  }

  const data = weights.map((w) => ({
    recordedAt: w.recordedAt,
    dateLabel: formatDate(w.recordedAt),
    value: Number(w.valueKg),
    isAnomaly: w.isAnomaly,
  }));

  return (
    <div className="weight-chart">
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="weightFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--area-primary)" stopOpacity={0.3} />
              <stop offset="100%" stopColor="var(--area-primary)" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--grid-color)" />
          <XAxis
            dataKey="dateLabel"
            tick={{ fontSize: 11, fill: 'var(--axis-color)' }}
            stroke="var(--axis-color)"
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'var(--axis-color)' }}
            stroke="var(--axis-color)"
            unit=" kg"
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="value"
            stroke="var(--line-primary)"
            strokeWidth={2}
            fill="url(#weightFill)"
            dot={renderDot}
            activeDot={{ r: 6 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
