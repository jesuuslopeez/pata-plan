import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import './MonthlyChart.scss';

const MONTH_LABEL = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const formatMonth = (key) => {
  if (!key || typeof key !== 'string') return '';
  const idx = parseInt(key.slice(-2), 10) - 1;
  return MONTH_LABEL[idx] ?? key;
};

const formatAmount = (value) =>
  `${Number(value).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EUR`;

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="monthly-chart__tooltip">
      <p className="monthly-chart__tooltip-label">{label}</p>
      <p className="monthly-chart__tooltip-value">{formatAmount(payload[0].value)}</p>
    </div>
  );
}

export function MonthlyChart({ data }) {
  const chartData = (data || []).map((row) => ({
    label: formatMonth(row.month),
    total: Number(row.total) || 0,
  }));

  const hasData = chartData.some((d) => d.total > 0);

  if (!hasData) {
    return <p className="monthly-chart__empty">Sin datos de gasto este año</p>;
  }

  return (
    <div className="monthly-chart">
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          <CartesianGrid stroke="var(--monthly-chart-grid)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="label"
            stroke="var(--monthly-chart-axis)"
            fontSize="0.6875rem"
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="var(--monthly-chart-axis)"
            fontSize="0.6875rem"
            tickLine={false}
            axisLine={false}
            width={48}
          />
          <Tooltip cursor={{ fill: 'var(--monthly-chart-cursor)' }} content={<CustomTooltip />} />
          <Bar
            dataKey="total"
            fill="var(--monthly-chart-bar)"
            radius={[4, 4, 0, 0]}
            className="monthly-chart__bar"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
