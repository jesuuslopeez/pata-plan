import { useId } from 'react';
import { X, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../Badge/Badge';
import { translateEventType } from '../../utils/eventTypeLabels';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import './EventDetailModal.scss';

const STATUS_CONFIG = {
  COMPLETED: { label: 'Completado', variant: 'success' },
  PENDING: { label: 'Pendiente', variant: 'warning' },
  OVERDUE: { label: 'Vencido', variant: 'danger' },
  SKIPPED: { label: 'Omitido', variant: 'neutral' },
};

const CATEGORY_LABEL = {
  VACCINE: 'Vacuna',
  DEWORMING_INTERNAL: 'Desparasitación interna',
  DEWORMING_EXTERNAL: 'Desparasitación externa',
  CHECKUP: 'Revisión',
  TREATMENT: 'Tratamiento',
};

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export function EventDetailModal({ event, onClose, onComplete }) {
  const navigate = useNavigate();
  useEscapeKey(onClose, Boolean(event));
  const titleId = useId();
  const containerRef = useFocusTrap(Boolean(event));
  if (!event) return null;

  const status = STATUS_CONFIG[event.status] || STATUS_CONFIG.PENDING;
  const canComplete = event.status === 'PENDING' || event.status === 'OVERDUE';

  return (
    <div
      className="event-detail-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={onClose}
    >
      <div className="event-detail-modal__content" ref={containerRef} onClick={(e) => e.stopPropagation()}>
        <header className="event-detail-modal__header">
          <h2 id={titleId} className="event-detail-modal__title">
            {translateEventType(event.eventType?.name)}
          </h2>
          <button
            className="event-detail-modal__close"
            onClick={onClose}
            type="button"
            aria-label="Cerrar"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <div className="event-detail-modal__badges">
          <Badge
            text={CATEGORY_LABEL[event.eventType?.category] || event.eventType?.category}
            variant="info"
          />
          <Badge text={status.label} variant={status.variant} />
        </div>

        <div className="event-detail-modal__fields">
          {event.animal && (
            <div className="event-detail-modal__field">
              <span className="event-detail-modal__label">Animal</span>
              <button
                className="event-detail-modal__link"
                onClick={() => navigate(`/animals/${event.animal.id}`)}
                type="button"
              >
                {event.animal.name}
              </button>
            </div>
          )}
          <div className="event-detail-modal__field">
            <span className="event-detail-modal__label">Fecha programada</span>
            <span className="event-detail-modal__value">{formatDate(event.scheduledDate)}</span>
          </div>
          {event.completedDate && (
            <div className="event-detail-modal__field">
              <span className="event-detail-modal__label">Fecha completada</span>
              <span className="event-detail-modal__value">{formatDate(event.completedDate)}</span>
            </div>
          )}
          {event.nextDueDate && (
            <div className="event-detail-modal__field">
              <span className="event-detail-modal__label">Próxima dosis</span>
              <span className="event-detail-modal__value">{formatDate(event.nextDueDate)}</span>
            </div>
          )}
          {event.product && (
            <div className="event-detail-modal__field">
              <span className="event-detail-modal__label">Producto</span>
              <span className="event-detail-modal__value">{event.product}</span>
            </div>
          )}
          {event.vetName && (
            <div className="event-detail-modal__field">
              <span className="event-detail-modal__label">Veterinario</span>
              <span className="event-detail-modal__value">{event.vetName}</span>
            </div>
          )}
          {event.notes && (
            <div className="event-detail-modal__field">
              <span className="event-detail-modal__label">Notas</span>
              <span className="event-detail-modal__value">{event.notes}</span>
            </div>
          )}
        </div>

        {canComplete && (
          <footer className="event-detail-modal__footer">
            <button
              className="event-detail-modal__btn"
              onClick={() => onComplete?.(event.id)}
              type="button"
            >
              <CheckCircle size={16} aria-hidden="true" />
              <span>Marcar como completado</span>
            </button>
          </footer>
        )}
      </div>
    </div>
  );
}
