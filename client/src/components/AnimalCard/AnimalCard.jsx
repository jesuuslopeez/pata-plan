import { useNavigate } from 'react-router-dom';
import { PawPrint } from 'lucide-react';
import { Badge } from '../Badge/Badge';
import './AnimalCard.scss';

const SPECIES_LABEL = {
  DOG: 'Perro',
  CAT: 'Gato',
  OTHER: 'Otro',
};

function getHealthStatus(animal) {
  const overdue = animal._count?.overdueEvents || 0;
  const pending = animal._count?.pendingEvents || 0;

  if (overdue > 0) {
    return { text: 'Vencido', variant: 'danger' };
  }
  if (pending > 0) {
    return { text: 'Pendiente', variant: 'warning' };
  }
  return { text: 'Al día', variant: 'success' };
}

export function AnimalCard({ animal }) {
  const navigate = useNavigate();
  const status = getHealthStatus(animal);
  const speciesLabel = SPECIES_LABEL[animal.species] || animal.species;
  const breedLabel = animal.breed || 'Sin raza';

  const handleClick = () => {
    navigate(`/animals/${animal.id}`);
  };

  return (
    <article
      className="animal-card"
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div className="animal-card__photo">
        {animal.photoUrl ? (
          <img
            className="animal-card__image"
            src={animal.photoUrl}
            alt={animal.name}
          />
        ) : (
          <PawPrint className="animal-card__placeholder" size={48} />
        )}
      </div>

      <div className="animal-card__body">
        <h3 className="animal-card__name">{animal.name}</h3>
        <p className="animal-card__meta">
          {speciesLabel} · {breedLabel}
        </p>
        <div className="animal-card__badges">
          {animal.group?.name && <Badge text={animal.group.name} variant="info" />}
          <Badge text={status.text} variant={status.variant} />
        </div>
      </div>
    </article>
  );
}
