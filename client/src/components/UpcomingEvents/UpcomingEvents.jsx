import { Calendar } from 'lucide-react';
import './UpcomingEvents.scss';

const CATEGORY_LABEL = {
  VACCINE: 'Vacuna',
  DEWORMING_INTERNAL: 'Desp. int.',
  DEWORMING_EXTERNAL: 'Desp. ext.',
  CHECKUP: 'Revisión',
  TREATMENT: 'Tratamiento',
};

const CATEGORY_CLASS = {
  VACCINE: 'upcoming-events__badge--vaccine',
  DEWORMING_INTERNAL: 'upcoming-events__badge--deworming',
  DEWORMING_EXTERNAL: 'upcoming-events__badge--deworming',
  CHECKUP: 'upcoming-events__badge--checkup',
  TREATMENT: 'upcoming-events__badge--treatment',
};

function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((target - today) / 86400000);

  if (diffDays === 0) return 'Hoy';
  if (diffDays === 1) return 'Mañana';
  if (diffDays > 1 && diffDays < 7) {
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    return days[date.getDay()];
  }
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
}

export function UpcomingEvents({ events }) {
  return (
    <section className="upcoming-events">
      <div className="upcoming-events__header">
        <Calendar className="upcoming-events__icon" size={16} />
        <h3 className="upcoming-events__title">Próximos días</h3>
      </div>

      {(!events || events.length === 0) ? (
        <p className="upcoming-events__empty">Sin eventos próximos</p>
      ) : (
        <ul className="upcoming-events__list">
          {events.map((event) => (
            <li key={event.id} className="upcoming-events__item">
              <span className="upcoming-events__date">{formatDate(event.scheduledDate)}</span>
              <span className="upcoming-events__label">
                {event.animal?.name} - {event.eventType?.name}
              </span>
              <span className={`upcoming-events__badge ${CATEGORY_CLASS[event.eventType?.category] || ''}`}>
                {CATEGORY_LABEL[event.eventType?.category] || event.eventType?.category}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
