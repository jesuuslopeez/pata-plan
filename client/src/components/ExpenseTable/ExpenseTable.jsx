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
      <table className="expense-table" aria-label="Listado de gastos">
        <thead className="expense-table__head">
          <tr>
            <th className="expense-table__th" scope="col">Fecha</th>
            <th className="expense-table__th" scope="col">Animal</th>
            <th className="expense-table__th" scope="col">Categoría</th>
            <th className="expense-table__th" scope="col">Descripción</th>
            <th className="expense-table__th expense-table__th--right" scope="col">
              Importe
            </th>
          </tr>
        </thead>

        <tbody>
          {expenses.map((expense) => (
            <tr className="expense-table__row" key={expense.id}>
              <td className="expense-table__date">{formatDate(expense.expenseDate)}</td>
              <td className="expense-table__animal">{expense.animal?.name || '—'}</td>
              <td className="expense-table__cat">
                <Badge
                  text={CATEGORY_LABEL[expense.category] || expense.category}
                  variant={CATEGORY_VARIANT[expense.category] || 'neutral'}
                />
              </td>
              <td className="expense-table__desc">{expense.description || '—'}</td>
              <td className="expense-table__amount">
                <span className="expense-table__amount-value">{formatAmount(expense.amount)}</span>
                <span className="expense-table__amount-suffix"> EUR</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

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
