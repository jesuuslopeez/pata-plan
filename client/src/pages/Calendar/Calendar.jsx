import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getAnimals, getAnimalEvents, completeEvent } from '../../services/animal.service';
import { getGroups } from '../../services/dashboard.service';
import { SelectFilter } from '../../components/SelectFilter/SelectFilter';
import { CalendarGrid } from '../../components/CalendarGrid/CalendarGrid';
import { EventDetailModal } from '../../components/EventDetailModal/EventDetailModal';
import './Calendar.scss';

const MONTH_LABELS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const TYPE_OPTIONS = [
  { value: '', label: 'Todos los tipos' },
  { value: 'VACCINE', label: 'Vacunas' },
  { value: 'DEWORMING_INTERNAL', label: 'Desp. interna' },
  { value: 'DEWORMING_EXTERNAL', label: 'Desp. externa' },
  { value: 'CHECKUP', label: 'Revisiones' },
  { value: 'TREATMENT', label: 'Tratamientos' },
];

export function Calendar() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const [animals, setAnimals] = useState([]);
  const [groups, setGroups] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [animalId, setAnimalId] = useState('');
  const [groupId, setGroupId] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    getGroups().then((r) => setGroups(r.data?.groups || [])).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const loadAll = async () => {
      try {
        const animalsRes = await getAnimals();
        const animalsList = animalsRes.data?.animals || [];
        setAnimals(animalsList);

        if (animalsList.length === 0) {
          setEvents([]);
          return;
        }

        const eventResponses = await Promise.all(
          animalsList.map((a) =>
            getAnimalEvents(a.id)
              .then((r) => ({ animal: a, events: r.data?.events || [] }))
              .catch(() => ({ animal: a, events: [] }))
          )
        );

        const all = [];
        for (const { animal, events: animalEvents } of eventResponses) {
          for (const event of animalEvents) {
            all.push({ ...event, animal, group: animal.group });
          }
        }
        setEvents(all);
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, []);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      if (animalId && String(event.animal?.id) !== animalId) return false;
      if (groupId && String(event.group?.id) !== groupId) return false;
      if (typeFilter && event.eventType?.category !== typeFilter) return false;
      return true;
    });
  }, [events, animalId, groupId, typeFilter]);

  const handlePrev = () => {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const handleNext = () => {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  const handleToday = () => {
    const now = new Date();
    setYear(now.getFullYear());
    setMonth(now.getMonth());
  };

  const handleComplete = async (eventId) => {
    try {
      await completeEvent(eventId);
      setEvents((prev) =>
        prev.map((e) =>
          e.id === eventId
            ? { ...e, status: 'COMPLETED', completedDate: new Date().toISOString() }
            : e
        )
      );
      setSelectedEvent(null);
    } catch (err) {
      alert('Error al marcar como completado');
    }
  };

  const animalOptions = [
    { value: '', label: 'Todos los animales' },
    ...animals.map((a) => ({ value: String(a.id), label: a.name })),
  ];
  const groupOptions = [
    { value: '', label: 'Todos los grupos' },
    ...groups.map((g) => ({ value: String(g.id), label: g.name })),
  ];

  return (
    <div className="calendar-page">
      <header className="calendar-page__header">
        <h1 className="calendar-page__title">Calendario</h1>
      </header>

      <div className="calendar-page__controls">
        <div className="calendar-page__nav">
          <button
            className="calendar-page__nav-btn"
            onClick={handlePrev}
            type="button"
            aria-label="Mes anterior"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="calendar-page__month-label">
            {MONTH_LABELS[month]} {year}
          </span>
          <button
            className="calendar-page__nav-btn"
            onClick={handleNext}
            type="button"
            aria-label="Mes siguiente"
          >
            <ChevronRight size={18} />
          </button>
          <button className="calendar-page__today-btn" onClick={handleToday} type="button">
            Hoy
          </button>
        </div>

        <div className="calendar-page__filters">
          <SelectFilter value={animalId} onChange={setAnimalId} options={animalOptions} />
          <SelectFilter value={groupId} onChange={setGroupId} options={groupOptions} />
          <SelectFilter value={typeFilter} onChange={setTypeFilter} options={TYPE_OPTIONS} />
        </div>
      </div>

      <div className="calendar-page__legend">
        <LegendItem className="calendar-page__legend-item--vaccine" label="Vacuna" />
        <LegendItem className="calendar-page__legend-item--deworming" label="Desparasitación" />
        <LegendItem className="calendar-page__legend-item--treatment" label="Tratamiento" />
        <LegendItem className="calendar-page__legend-item--checkup" label="Revisión" />
      </div>

      {loading ? (
        <div className="calendar-page__loading">Cargando calendario...</div>
      ) : (
        <CalendarGrid
          year={year}
          month={month}
          events={filteredEvents}
          onEventClick={setSelectedEvent}
        />
      )}

      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onComplete={handleComplete}
        />
      )}
    </div>
  );
}

function LegendItem({ className, label }) {
  return (
    <div className="calendar-page__legend-item">
      <span className={`calendar-page__legend-dot ${className}`} />
      <span>{label}</span>
    </div>
  );
}
