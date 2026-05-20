import './SpendSummary.scss';

function formatAmount(value) {
  const n = Number(value || 0);
  return n.toLocaleString('es-ES', { maximumFractionDigits: 0 });
}

export function SpendSummary({ amount, changePercent }) {
  const hasChange = changePercent !== null && changePercent !== undefined && !isNaN(changePercent);
  const isDecrease = hasChange && changePercent < 0;
  const arrow = isDecrease ? '↓' : '↑';

  return (
    <section className="spend-summary" aria-label="Gasto del mes">
      <p className="spend-summary__label" id="spend-summary-label">Gasto este mes</p>
      <div className="spend-summary__amount-row" aria-labelledby="spend-summary-label">
        <span className="spend-summary__amount">{formatAmount(amount)}</span>
        <span className="spend-summary__currency">EUR</span>
      </div>
      {hasChange && (
        <p
          className={`spend-summary__change ${
            isDecrease ? 'spend-summary__change--down' : 'spend-summary__change--up'
          }`}
        >
          <span aria-hidden="true">{arrow} </span>
          {Math.abs(changePercent).toFixed(0)}% vs mes anterior
        </p>
      )}
    </section>
  );
}
