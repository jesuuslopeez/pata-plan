import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import './CategoryChart.scss';

const CATEGORY_LABEL = {
  VACCINE: 'Vacunas',
  DEWORMING: 'Desparasitaciones',
  SURGERY: 'Cirugías',
  MEDICATION: 'Medicación',
  FOOD: 'Alimentación',
  OTHER: 'Otros',
};

const CATEGORY_COLOR = {
  VACCINE: 'var(--category-vaccine)',
  DEWORMING: 'var(--category-deworming)',
  SURGERY: 'var(--category-surgery)',
  MEDICATION: 'var(--category-medication)',
  FOOD: 'var(--category-food)',
  OTHER: 'var(--category-other)',
};

const formatAmount = (value) =>
  `${Number(value).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EUR`;

function CustomTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const item = payload[0];
  return (
    <div className="category-chart__tooltip">
      <p className="category-chart__tooltip-label">{item.name}</p>
      <p className="category-chart__tooltip-value">{formatAmount(item.value)}</p>
    </div>
  );
}

function renderLegend({ payload }) {
  if (!payload) return null;
  return (
    <ul className="category-chart__legend">
      {payload.map((entry) => (
        <li key={entry.value} className="category-chart__legend-item">
          <span className="category-chart__legend-dot" style={{ backgroundColor: entry.color }} />
          <span className="category-chart__legend-text">{entry.value}</span>
        </li>
      ))}
    </ul>
  );
}

export function CategoryChart({ data }) {
  const chartData = (data || [])
    .filter((row) => Number(row.total) > 0)
    .map((row) => ({
      name: CATEGORY_LABEL[row.category] || row.category,
      key: row.category,
      value: Number(row.total) || 0,
    }));

  if (chartData.length === 0) {
    return <p className="category-chart__empty">Sin datos por categoría</p>;
  }

  return (
    <div className="category-chart">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            innerRadius="40%"
            outerRadius="70%"
            paddingAngle={2}
            stroke="none"
          >
            {chartData.map((entry) => (
              <Cell key={entry.key} fill={CATEGORY_COLOR[entry.key] || 'var(--category-other)'} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            align="center"
            iconType="circle"
            content={renderLegend}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
