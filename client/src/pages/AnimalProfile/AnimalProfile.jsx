import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft,
  PawPrint,
  Edit,
  Trash,
  Plus,
} from 'lucide-react';
import {
  getAnimal,
  deleteAnimal,
  getAnimalEvents,
  completeEvent,
  getAnimalWeights,
  getAnimalVisits,
} from '../../services/animal.service';
import { Badge } from '../../components/Badge/Badge';
import { Tabs } from '../../components/Tabs/Tabs';
import { HealthEventsTable } from '../../components/HealthEventsTable/HealthEventsTable';
import { VetVisitsList } from '../../components/VetVisitsList/VetVisitsList';
import { DocumentsGrid } from '../../components/DocumentsGrid/DocumentsGrid';
import { WeightChart } from '../../components/WeightChart/WeightChart';
import './AnimalProfile.scss';

const SPECIES_LABEL = { DOG: 'Perro', CAT: 'Gato', OTHER: 'Otro' };
const SEX_LABEL = { MALE: 'Macho', FEMALE: 'Hembra', UNKNOWN: 'Desconocido' };

const TABS = [
  { id: 'health', label: 'Salud' },
  { id: 'visits', label: 'Visitas' },
  { id: 'documents', label: 'Documentos' },
  { id: 'weight', label: 'Peso' },
];

function formatDate(iso) {
  if (!iso) return 'Sin registrar';
  return new Date(iso).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function getHealthStatus(animal) {
  const counts = animal?.eventCounts || {};
  if (counts.overdue > 0) return { text: 'Vencido', variant: 'danger' };
  if (counts.pending > 0) return { text: 'Pendiente', variant: 'warning' };
  return { text: 'Al día', variant: 'success' };
}

export function AnimalProfile() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [animal, setAnimal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('health');

  const [events, setEvents] = useState([]);
  const [visits, setVisits] = useState([]);
  const [weights, setWeights] = useState([]);
  const [trend, setTrend] = useState(null);

  const loadAnimal = () => {
    getAnimal(id)
      .then((res) => setAnimal(res.data?.animal || null))
      .catch(() => setAnimal(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAnimal();
    getAnimalEvents(id).then((r) => setEvents(r.data?.events || [])).catch(() => {});
    getAnimalVisits(id).then((r) => setVisits(r.data?.visits || [])).catch(() => {});
    getAnimalWeights(id)
      .then((r) => {
        setWeights(r.data?.weights || []);
        setTrend(r.data?.trend || null);
      })
      .catch(() => {});
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('¿Seguro que quieres eliminar este animal? Esta acción no se puede deshacer.')) {
      return;
    }
    try {
      await deleteAnimal(id);
      navigate('/animals');
    } catch (err) {
      alert('Error al eliminar el animal');
    }
  };

  const handleCompleteEvent = async (eventId) => {
    try {
      await completeEvent(eventId);
      const res = await getAnimalEvents(id);
      setEvents(res.data?.events || []);
      loadAnimal();
    } catch (err) {
      alert('Error al marcar como completado');
    }
  };

  if (loading) {
    return <div className="animal-profile__loading">Cargando...</div>;
  }

  if (!animal) {
    return (
      <div className="animal-profile">
        <button className="animal-profile__back" onClick={() => navigate('/animals')} type="button">
          <ChevronLeft size={16} />
          <span>Volver a animales</span>
        </button>
        <p className="animal-profile__loading">Animal no encontrado</p>
      </div>
    );
  }

  const status = getHealthStatus(animal);
  const latestWeight = animal.latestWeight;

  return (
    <div className="animal-profile">
      <button
        className="animal-profile__back"
        onClick={() => navigate('/animals')}
        type="button"
      >
        <ChevronLeft size={16} />
        <span>Volver a animales</span>
      </button>

      <header className="animal-profile__header">
        <div className="animal-profile__photo">
          {animal.photoUrl ? (
            <img src={animal.photoUrl} alt={animal.name} className="animal-profile__photo-img" />
          ) : (
            <PawPrint className="animal-profile__photo-placeholder" size={40} />
          )}
        </div>

        <div className="animal-profile__identity">
          <h1 className="animal-profile__name">{animal.name}</h1>
          <p className="animal-profile__meta">
            {SPECIES_LABEL[animal.species] || animal.species} — {animal.breed || 'Sin raza'}
          </p>
          <div className="animal-profile__badges">
            {animal.group?.name && <Badge text={animal.group.name} variant="info" />}
            <Badge text={status.text} variant={status.variant} />
          </div>
        </div>

        <div className="animal-profile__actions">
          <button className="animal-profile__btn animal-profile__btn--secondary" type="button">
            <Edit size={16} />
            <span>Editar</span>
          </button>
          <button
            className="animal-profile__btn animal-profile__btn--danger"
            onClick={handleDelete}
            type="button"
          >
            <Trash size={16} />
            <span>Eliminar</span>
          </button>
        </div>
      </header>

      <div className="animal-profile__info">
        <div className="animal-profile__info-card">
          <span className="animal-profile__info-label">Fecha nacimiento</span>
          <span className="animal-profile__info-value">{formatDate(animal.dateOfBirth)}</span>
        </div>
        <div className="animal-profile__info-card">
          <span className="animal-profile__info-label">Microchip</span>
          <span className="animal-profile__info-value">{animal.microchip || 'Sin registrar'}</span>
        </div>
        <div className="animal-profile__info-card">
          <span className="animal-profile__info-label">Sexo</span>
          <span className="animal-profile__info-value">{SEX_LABEL[animal.sex] || 'Desconocido'}</span>
        </div>
        <div className="animal-profile__info-card">
          <span className="animal-profile__info-label">Peso actual</span>
          <span className="animal-profile__info-value">
            {latestWeight ? `${Number(latestWeight.valueKg).toFixed(1)} kg` : 'Sin registros'}
          </span>
        </div>
      </div>

      <Tabs tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="animal-profile__tab-content">
        {activeTab === 'health' && (
          <section>
            <div className="animal-profile__section-header">
              <h2 className="animal-profile__section-title">Eventos sanitarios</h2>
              <button className="animal-profile__btn animal-profile__btn--primary" type="button">
                <Plus size={16} />
                <span>Añadir evento</span>
              </button>
            </div>
            {events.length > 0 ? (
              <HealthEventsTable events={events} onComplete={handleCompleteEvent} />
            ) : (
              <EmptyState text="Sin eventos registrados" />
            )}
          </section>
        )}

        {activeTab === 'visits' && (
          <section>
            <div className="animal-profile__section-header">
              <h2 className="animal-profile__section-title">Visitas veterinarias</h2>
              <button className="animal-profile__btn animal-profile__btn--primary" type="button">
                <Plus size={16} />
                <span>Añadir visita</span>
              </button>
            </div>
            {visits.length > 0 ? (
              <VetVisitsList visits={visits} />
            ) : (
              <EmptyState text="Sin visitas registradas" />
            )}
          </section>
        )}

        {activeTab === 'documents' && (
          <section>
            <DocumentsGrid animalId={parseInt(id, 10)} />
          </section>
        )}

        {activeTab === 'weight' && (
          <section className="animal-profile__weight">
            <div className="animal-profile__section-header">
              <h2 className="animal-profile__section-title">Evolución de peso</h2>
              <button className="animal-profile__btn animal-profile__btn--primary" type="button">
                <Plus size={16} />
                <span>Registrar peso</span>
              </button>
            </div>
            <WeightChart weights={weights} />
            {trend && (
              <div className="animal-profile__trend">
                <TrendCard label="Peso actual" value={`${trend.currentWeight} kg`} />
                <TrendCard
                  label="Variación"
                  value={
                    trend.changeKg !== null
                      ? `${trend.changeKg > 0 ? '+' : ''}${trend.changeKg} kg (${trend.changePercent}%)`
                      : '—'
                  }
                  variant={
                    trend.changeKg === null ? 'neutral' : trend.changeKg < 0 ? 'danger' : 'success'
                  }
                />
                <TrendCard label="Media" value={`${trend.averageWeight} kg`} />
                <TrendCard label="Registros" value={trend.totalRecords} />
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="animal-profile__empty">
      <p>{text}</p>
    </div>
  );
}

function TrendCard({ label, value, variant }) {
  return (
    <div className="animal-profile__trend-card">
      <span className="animal-profile__trend-label">{label}</span>
      <span className={`animal-profile__trend-value animal-profile__trend-value--${variant || 'default'}`}>
        {value}
      </span>
    </div>
  );
}
