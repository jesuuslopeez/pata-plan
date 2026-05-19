import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { getAnimals } from '../../services/animal.service';
import { getExpenses, getExpenseStats } from '../../services/expense.service';
import { ExpenseTable } from '../../components/ExpenseTable/ExpenseTable';
import { MonthlyChart } from '../../components/MonthlyChart/MonthlyChart';
import { CategoryChart } from '../../components/CategoryChart/CategoryChart';
import { AddExpenseModal } from '../../components/AddExpenseModal/AddExpenseModal';
import './Expenses.scss';

const PAGE_SIZE = 20;

const CATEGORY_OPTIONS = [
  { value: 'VACCINE', label: 'Vacunas' },
  { value: 'DEWORMING', label: 'Desparasitaciones' },
  { value: 'SURGERY', label: 'Cirugías' },
  { value: 'MEDICATION', label: 'Medicación' },
  { value: 'FOOD', label: 'Alimentación' },
  { value: 'OTHER', label: 'Otros' },
];

const formatAmount = (value) =>
  Number(value).toLocaleString('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatPercent = (value) => {
  if (value === null || value === undefined) return '—';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
};

export function Expenses() {
  const [stats, setStats] = useState(null);
  const [animals, setAnimals] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [filters, setFilters] = useState({
    animalId: '',
    category: '',
    dateFrom: '',
    dateTo: '',
  });
  const [page, setPage] = useState(0);
  const [addOpen, setAddOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getExpenseStats()
        .then((res) => setStats(res.data?.stats || null))
        .catch(() => setStats(null)),
      getAnimals()
        .then((res) => setAnimals(res.data?.animals || []))
        .catch(() => setAnimals([])),
    ]).finally(() => setLoading(false));
  }, [reloadKey]);

  useEffect(() => {
    const offset = page * PAGE_SIZE;
    setError('');
    getExpenses({ ...filters, limit: PAGE_SIZE, offset })
      .then((res) => {
        setExpenses(res.data?.expenses || []);
        setTotal(res.data?.total || 0);
      })
      .catch((err) => {
        setExpenses([]);
        setTotal(0);
        setError(err?.response?.data?.error || 'No se han podido cargar los gastos');
      });
  }, [filters, page, reloadKey]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);

  const handleFilter = (key) => (e) => {
    setFilters((prev) => ({ ...prev, [key]: e.target.value }));
    setPage(0);
  };

  const monthlyChange = stats?.monthlyChangePercent;
  const monthlyChangeClass = (() => {
    if (monthlyChange === null || monthlyChange === undefined) return 'expenses__change--neutral';
    if (monthlyChange > 0) return 'expenses__change--up';
    if (monthlyChange < 0) return 'expenses__change--down';
    return 'expenses__change--neutral';
  })();

  return (
    <div className="expenses">
      <header className="expenses__header">
        <h1 className="expenses__title">Gastos</h1>
        <button
          className="expenses__add-btn"
          type="button"
          onClick={() => setAddOpen(true)}
          disabled={animals.length === 0}
        >
          <Plus size={16} />
          <span>Añadir gasto</span>
        </button>
      </header>

      <section className="expenses__metrics">
        <article className="metric-card">
          <span className="metric-card__label">Gasto total</span>
          <p className="metric-card__value">
            <span>{stats ? formatAmount(stats.totalAllTime) : '—'}</span>
            <span className="metric-card__suffix">EUR</span>
          </p>
        </article>

        <article className="metric-card">
          <span className="metric-card__label">Este mes</span>
          <p className="metric-card__value">
            <span>{stats ? formatAmount(stats.totalThisMonth) : '—'}</span>
            <span className="metric-card__suffix">EUR</span>
          </p>
          <span className={`expenses__change ${monthlyChangeClass}`}>
            {formatPercent(monthlyChange)} vs mes anterior
          </span>
        </article>

        <article className="metric-card">
          <span className="metric-card__label">Media por animal</span>
          <p className="metric-card__value">
            <span>{stats ? formatAmount(stats.averagePerAnimal) : '—'}</span>
            <span className="metric-card__suffix">EUR</span>
          </p>
        </article>
      </section>

      <section className="expenses__charts">
        <article className="expenses__chart-card expenses__chart-card--wide">
          <h2 className="expenses__chart-title">Gasto mensual</h2>
          <MonthlyChart data={stats?.byMonth || []} />
        </article>
        <article className="expenses__chart-card">
          <h2 className="expenses__chart-title">Por categoría</h2>
          <CategoryChart data={stats?.byCategory || []} />
        </article>
      </section>

      <section className="expenses__list-card">
        <div className="expenses__filters">
          <select
            className="expenses__filter"
            value={filters.animalId}
            onChange={handleFilter('animalId')}
            aria-label="Filtrar por animal"
          >
            <option value="">Todos los animales</option>
            {animals.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>

          <select
            className="expenses__filter"
            value={filters.category}
            onChange={handleFilter('category')}
            aria-label="Filtrar por categoría"
          >
            <option value="">Todas las categorías</option>
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>

          <label className="expenses__filter-date">
            <span className="expenses__filter-date-label">Desde</span>
            <input
              type="date"
              className="expenses__filter expenses__filter--date"
              value={filters.dateFrom}
              onChange={handleFilter('dateFrom')}
              aria-label="Fecha desde"
            />
          </label>

          <label className="expenses__filter-date">
            <span className="expenses__filter-date-label">Hasta</span>
            <input
              type="date"
              className="expenses__filter expenses__filter--date"
              value={filters.dateTo}
              onChange={handleFilter('dateTo')}
              aria-label="Fecha hasta"
            />
          </label>
        </div>

        {error && <p className="expenses__error">{error}</p>}

        {loading ? (
          <p className="expenses__loading">Cargando…</p>
        ) : (
          <ExpenseTable expenses={expenses} />
        )}

        <AddExpenseModal
          open={addOpen}
          animals={animals}
          onClose={() => setAddOpen(false)}
          onSaved={() => {
            setPage(0);
            setReloadKey((k) => k + 1);
          }}
        />

        {total > 0 && (
          <footer className="expenses__pagination">
            <span className="expenses__pagination-info">
              Mostrando {expenses.length === 0 ? 0 : page * PAGE_SIZE + 1}–
              {page * PAGE_SIZE + expenses.length} de {total}
            </span>
            <div className="expenses__pagination-actions">
              <button
                type="button"
                className="expenses__pager"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                <ChevronLeft size={14} />
                <span>Anterior</span>
              </button>
              <button
                type="button"
                className="expenses__pager"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
              >
                <span>Siguiente</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </footer>
        )}
      </section>
    </div>
  );
}
