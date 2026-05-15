import { translateEventType } from '../../utils/eventTypeLabels';
import { resolveAssetUrl } from '../../utils/assetUrl';
import './AnimalAlertCard.scss';

const SPECIES_LABEL = {
  DOG: 'Perro',
  CAT: 'Gato',
  OTHER: 'Otro',
};

function formatEventText(alert) {
  const typeName = translateEventType(alert.eventType?.name);
  if (alert.status === 'OVERDUE') {
    return `${typeName} — ${alert.daysOverdue} ${alert.daysOverdue === 1 ? 'día' : 'días'} vencida`;
  }
  if (alert.daysUntil !== undefined) {
    return `${typeName} — en ${alert.daysUntil} ${alert.daysUntil === 1 ? 'día' : 'días'}`;
  }
  return typeName;
}

export function AnimalAlertCard({ animal, group, alerts }) {
  const hasOverdue = alerts.some((a) => a.status === 'OVERDUE');
  const barClass = hasOverdue ? 'animal-alert-card__bar--danger' : 'animal-alert-card__bar--warning';
  const initial = animal.name?.[0]?.toUpperCase() || '?';

  const speciesLabel = SPECIES_LABEL[animal.species] || animal.species;
  const breed = animal.breed || 'Sin raza';
  const groupName = group?.name || '';

  return (
    <div className="animal-alert-card">
      <div className={`animal-alert-card__bar ${barClass}`} />
      <div className="animal-alert-card__content">
        <div className="animal-alert-card__header">
          <div className="animal-alert-card__avatar">
            {animal.photoUrl ? (
              <img
                className="animal-alert-card__avatar-img"
                src={resolveAssetUrl(animal.photoUrl)}
                alt={animal.name}
              />
            ) : (
              initial
            )}
          </div>
          <div className="animal-alert-card__info">
            <div className="animal-alert-card__name">{animal.name}</div>
            <div className="animal-alert-card__meta">
              {speciesLabel} · {breed} · {groupName}
            </div>
          </div>
        </div>
        <ul className="animal-alert-card__events">
          {alerts.map((alert) => {
            const isOverdue = alert.status === 'OVERDUE';
            return (
              <li
                key={alert.id}
                className={`animal-alert-card__event ${isOverdue ? 'animal-alert-card__event--overdue' : 'animal-alert-card__event--pending'}`}
              >
                <span className="animal-alert-card__dot" />
                <span>{formatEventText(alert)}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
