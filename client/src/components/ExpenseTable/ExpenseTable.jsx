import { Badge } from '../Badge/Badge';
import './ExpenseTable.scss';

const CATEGORY_LABEL = {
  VACCINE: 'Vacunas',
  DEWORMING: 'Desparasitaciones',
  SURGERY: 'Cirugías',
  MEDICATION: 'Medicación',
  FOOD: 'Alimentación',
  OTHER: 'Otros',
};

const CATEGORY_VARIANT = {
  VACCINE: 'success',
  DEWORMING: 'info',
  SURGERY: 'danger',
  MEDICATION: 'warning',
  FOOD: 'warning',
  OTHER: 'neutral',
};

const formatDate = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const formatAmount = (value) =>
  Number(value).toLocaleString('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export function ExpenseTable({ expenses }) {
  if (!expenses || expenses.length === 0) {
    return <p className="expense-table__empty">Sin gastos registrados</p>;
  }

  return (
    <>
      <div className="expense-table" role="table">
        <div className="expense-table__head" role="row">
          <span className="expense-table__th" role="columnheader">Fecha</span>
          <span className="expense-table__th" role="columnheader">Animal</span>
          <span className="expense-table__th" role="columnheader">Categoría</span>
          <span className="expense-table__th" role="columnheader">Descripción</span>
          <span
            className="expense-table__th expense-table__th--right"
            role="columnheader"
          >
            Importe
          </span>
        </div>

        {expenses.map((expense) => (
          <div className="expense-table__row" role="row" key={expense.id}>
            <span className="expense-table__date" role="cell">
              {formatDate(expense.expenseDate)}
            </span>
            <span className="expense-table__animal" role="cell">
              {expense.animal?.name || '—'}
            </span>
            <span className="expense-table__cat" role="cell">
              <Badge
                text={CATEGORY_LABEL[expense.category] || expense.category}
                variant={CATEGORY_VARIANT[expense.category] || 'neutral'}
              />
            </span>
            <span className="expense-table__desc" role="cell">
              {expense.description || '—'}
            </span>
            <span className="expense-table__amount" role="cell">
              <span className="expense-table__amount-value">{formatAmount(expense.amount)}</span>
              <span className="expense-table__amount-suffix"> EUR</span>
            </span>
          </div>
        ))}
      </div>

      <ul className="expense-cards" aria-hidden="true">
        {expenses.map((expense) => (
          <li className="expense-cards__item" key={expense.id}>
            <header className="expense-cards__head">
              <span className="expense-cards__animal">{expense.animal?.name || '—'}</span>
              <Badge
                text={CATEGORY_LABEL[expense.category] || expense.category}
                variant={CATEGORY_VARIANT[expense.category] || 'neutral'}
              />
            </header>
            <p className="expense-cards__date">{formatDate(expense.expenseDate)}</p>
            {expense.description && (
              <p className="expense-cards__desc">{expense.description}</p>
            )}
            <p className="expense-cards__amount">
              <span className="expense-cards__amount-value">{formatAmount(expense.amount)}</span>
              <span className="expense-cards__amount-suffix"> EUR</span>
            </p>
          </li>
        ))}
      </ul>
    </>
  );
}
