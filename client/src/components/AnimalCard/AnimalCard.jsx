import { useNavigate } from 'react-router-dom';
import { PawPrint } from 'lucide-react';
import { Badge } from '../Badge/Badge';
import { resolveAssetUrl } from '../../utils/assetUrl';
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
      aria-label={`Ver perfil de ${animal.name}`}
    >
      <div className="animal-card__photo">
        {animal.photoUrl && (
          <img
            className="animal-card__blur"
            src={resolveAssetUrl(animal.photoUrl)}
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
          />
        )}
        <PawPrint
          className="animal-card__paw-watermark"
          size={88}
          strokeWidth={1.2}
          aria-hidden="true"
        />
        {animal.photoUrl ? (
          <img
            className="animal-card__image"
            src={resolveAssetUrl(animal.photoUrl)}
            alt={`Foto de ${animal.name}`}
            loading="lazy"
            decoding="async"
            width="320"
            height="240"
          />
        ) : (
          <PawPrint className="animal-card__placeholder" size={48} aria-hidden="true" />
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
