import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getAnimals, getAnimalEvents, completeEvent } from '../../services/animal.service';
import { getGroups } from '../../services/dashboard.service';
import { SelectFilter } from '../../components/SelectFilter/SelectFilter';
import { CalendarGrid } from '../../components/CalendarGrid/CalendarGrid';
import { EventDetailModal } from '../../components/EventDetailModal/EventDetailModal';
import { ConfirmDialog } from '../../components/ConfirmDialog/ConfirmDialog';
import { usePageTitle } from '../../hooks/usePageTitle';
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
  usePageTitle('Calendario');
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
  const [alertDialog, setAlertDialog] = useState(null);

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
      setAlertDialog({
        title: 'No se ha podido completar el evento',
        message: 'Inténtalo de nuevo más tarde.',
      });
    }
  };

  const animalOptions = [
    { value: '', label: 'Todos los animales' },
    ...animals.map((a) => ({ value: String(a.id), label: a.name })),
  ];
  const groupLabel = (g) =>
    g.role && g.role !== 'OWNER' && g.owner?.name
      ? `${g.name} (de ${g.owner.name})`
      : g.name;
  const groupOptions = [
    { value: '', label: 'Todos los grupos' },
    ...groups.map((g) => ({ value: String(g.id), label: groupLabel(g) })),
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
            <ChevronLeft size={18} aria-hidden="true" />
          </button>
          <span className="calendar-page__month-label" aria-live="polite">
            {MONTH_LABELS[month]} {year}
          </span>
          <button
            className="calendar-page__nav-btn"
            onClick={handleNext}
            type="button"
            aria-label="Mes siguiente"
          >
            <ChevronRight size={18} aria-hidden="true" />
          </button>
          <button className="calendar-page__today-btn" onClick={handleToday} type="button">
            Hoy
          </button>
        </div>

        <div className="calendar-page__filters">
          <SelectFilter
            value={animalId}
            onChange={setAnimalId}
            options={animalOptions}
            aria-label="Filtrar por animal"
          />
          <SelectFilter
            value={groupId}
            onChange={setGroupId}
            options={groupOptions}
            aria-label="Filtrar por grupo"
          />
          <SelectFilter
            value={typeFilter}
            onChange={setTypeFilter}
            options={TYPE_OPTIONS}
            aria-label="Filtrar por tipo de evento"
          />
        </div>
      </div>

      <div className="calendar-page__legend" role="list" aria-label="Leyenda del calendario">
        <LegendItem className="calendar-page__legend-item--vaccine" label="Vacuna" />
        <LegendItem className="calendar-page__legend-item--deworming" label="Desparasitación" />
        <LegendItem className="calendar-page__legend-item--treatment" label="Tratamiento" />
        <LegendItem className="calendar-page__legend-item--checkup" label="Revisión" />
      </div>

      {loading ? (
        <div className="calendar-page__loading" role="status" aria-live="polite">Cargando calendario...</div>
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

      <ConfirmDialog
        open={!!alertDialog}
        title={alertDialog?.title || 'Aviso'}
        message={alertDialog?.message}
        confirmText="Entendido"
        hideCancel
        onClose={() => setAlertDialog(null)}
      />
    </div>
  );
}

function LegendItem({ className, label }) {
  return (
    <div className="calendar-page__legend-item" role="listitem">
      <span className={`calendar-page__legend-dot ${className}`} aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
