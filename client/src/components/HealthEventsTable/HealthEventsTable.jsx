import { CheckCircle } from 'lucide-react';
import { Badge } from '../Badge/Badge';
import './HealthEventsTable.scss';

const STATUS_CONFIG = {
  COMPLETED: { label: 'Completado', variant: 'success' },
  PENDING: { label: 'Pendiente', variant: 'warning' },
  OVERDUE: { label: 'Vencido', variant: 'danger' },
  SKIPPED: { label: 'Omitido', variant: 'neutral' },
};

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function HealthEventsTable({ events, onComplete }) {
  if (!events || events.length === 0) {
    return null;
  }

  return (
    <div className="health-events-table">
      {events.map((event) => {
        const status = STATUS_CONFIG[event.status] || STATUS_CONFIG.PENDING;
        const canComplete = event.status === 'PENDING' || event.status === 'OVERDUE';

        return (
          <div key={event.id} className="health-events-table__row">
            <span className="health-events-table__date">{formatDate(event.scheduledDate)}</span>
            <div className="health-events-table__info">
              <span className="health-events-table__type">{event.eventType?.name || 'Evento'}</span>
              {event.product && (
                <span className="health-events-table__product">{event.product}</span>
              )}
            </div>
            <Badge text={status.label} variant={status.variant} />
            {event.nextDueDate && (
              <span className="health-events-table__next">
                Próxima: {formatDate(event.nextDueDate)}
              </span>
            )}
            {canComplete && (
              <button
                className="health-events-table__complete"
                onClick={() => onComplete?.(event.id)}
                type="button"
                title="Marcar como completado"
              >
                <CheckCircle size={18} />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
