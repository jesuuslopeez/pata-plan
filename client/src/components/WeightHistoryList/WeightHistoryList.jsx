import { AlertTriangle, Pencil, Trash } from 'lucide-react';
import './WeightHistoryList.scss';

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function WeightHistoryList({ weights, canManage = false, onEdit, onDelete }) {
  if (!weights || weights.length === 0) return null;

  const sorted = [...weights].sort(
    (a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
  );

  return (
    <div className="weight-history-list">
      <h3 className="weight-history-list__title">Histórico de registros</h3>
      <ul className="weight-history-list__items">
        {sorted.map((w) => (
          <li key={w.id} className="weight-history-list__row">
            <div className="weight-history-list__main">
              <span className="weight-history-list__date">{formatDate(w.recordedAt)}</span>
              <span className="weight-history-list__value">
                {Number(w.valueKg).toFixed(2)} kg
              </span>
              {w.isAnomaly && (
                <span className="weight-history-list__anomaly">
                  <AlertTriangle size={12} />
                  <span>Anómalo</span>
                </span>
              )}
            </div>

            {canManage && (
              <div className="weight-history-list__actions">
                <button
                  type="button"
                  className="weight-history-list__icon-btn"
                  onClick={() => onEdit?.(w)}
                  aria-label="Editar registro"
                  title="Editar"
                >
                  <Pencil size={14} />
                </button>
                <button
                  type="button"
                  className="weight-history-list__icon-btn weight-history-list__icon-btn--danger"
                  onClick={() => onDelete?.(w)}
                  aria-label="Eliminar registro"
                  title="Eliminar"
                >
                  <Trash size={14} />
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
