import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { createAnimalEvent } from '../../services/animal.service';
import { getEventTypes, createEventType } from '../../services/protocol.service';
import { translateEventType } from '../../utils/eventTypeLabels';
import './AddEventModal.scss';

const OTHER_OPTION = '__OTHER__';

const INITIAL_FORM = {
  eventTypeId: '',
  customName: '',
  scheduledDate: '',
  product: '',
  vetName: '',
  frequencyDays: '',
  notes: '',
};


export function AddEventModal({ open, animalId, onClose, onCreated }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [eventTypes, setEventTypes] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setForm(INITIAL_FORM);
    setError(null);
    getEventTypes()
      .then((res) => setEventTypes(res.data?.eventTypes || []))
      .catch(() => setEventTypes([]));
  }, [open]);

  if (!open) return null;

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const isOther = form.eventTypeId === OTHER_OPTION;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.eventTypeId || !form.scheduledDate) return;
    if (isOther && !form.customName.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      let eventTypeId = form.eventTypeId;
      if (isOther) {
        const created = await createEventType({
          name: form.customName.trim(),
          category: 'TREATMENT',
          isCustom: true,
        });
        eventTypeId = created.data?.eventType?.id;
      }

      const payload = {
        eventTypeId,
        scheduledDate: form.scheduledDate,
      };
      if (form.product.trim()) payload.product = form.product.trim();
      if (form.vetName.trim()) payload.vetName = form.vetName.trim();
      if (form.frequencyDays) payload.frequencyDays = form.frequencyDays;
      if (form.notes.trim()) payload.notes = form.notes.trim();

      const res = await createAnimalEvent(animalId, payload);
      onCreated?.(res.data?.event);
      onClose?.();
    } catch (err) {
      setError(err?.response?.data?.error || 'No se ha podido crear el evento');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="add-event-modal" role="dialog" aria-modal="true">
      <div className="add-event-modal__overlay" onClick={onClose} />
      <div className="add-event-modal__content">
        <header className="add-event-modal__header">
          <h2 className="add-event-modal__title">Añadir evento sanitario</h2>
          <button
            type="button"
            className="add-event-modal__close"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </header>

        <form className="add-event-modal__form" onSubmit={handleSubmit}>
          <div className="add-event-modal__field">
            <label className="add-event-modal__label" htmlFor="event-type">
              Tipo de evento *
            </label>
            <select
              id="event-type"
              className="add-event-modal__input"
              value={form.eventTypeId}
              onChange={handleChange('eventTypeId')}
              required
            >
              <option value="" disabled>
                Selecciona un tipo
              </option>
              {eventTypes.map((et) => (
                <option key={et.id} value={et.id}>
                  {translateEventType(et.name)}
                </option>
              ))}
              <option value={OTHER_OPTION}>Otro…</option>
            </select>
          </div>

          {isOther && (
            <div className="add-event-modal__field">
              <label className="add-event-modal__label" htmlFor="event-custom-name">
                Nombre del evento *
              </label>
              <input
                id="event-custom-name"
                type="text"
                className="add-event-modal__input"
                value={form.customName}
                onChange={handleChange('customName')}
                required
                placeholder="Ej: Limpieza dental"
              />
            </div>
          )}

          <div className="add-event-modal__row">
            <div className="add-event-modal__field">
              <label className="add-event-modal__label" htmlFor="event-date">
                Fecha programada *
              </label>
              <input
                id="event-date"
                type="date"
                className="add-event-modal__input"
                value={form.scheduledDate}
                onChange={handleChange('scheduledDate')}
                required
              />
            </div>

            <div className="add-event-modal__field">
              <label className="add-event-modal__label" htmlFor="event-frequency">
                Frecuencia (días)
              </label>
              <input
                id="event-frequency"
                type="number"
                min="1"
                className="add-event-modal__input"
                value={form.frequencyDays}
                onChange={handleChange('frequencyDays')}
                placeholder="Opcional"
              />
            </div>
          </div>

          <div className="add-event-modal__field">
            <label className="add-event-modal__label" htmlFor="event-product">
              Producto
            </label>
            <input
              id="event-product"
              type="text"
              className="add-event-modal__input"
              value={form.product}
              onChange={handleChange('product')}
              placeholder="Ej: Nobivac DHPPi"
            />
          </div>

          <div className="add-event-modal__field">
            <label className="add-event-modal__label" htmlFor="event-vet">
              Veterinario
            </label>
            <input
              id="event-vet"
              type="text"
              className="add-event-modal__input"
              value={form.vetName}
              onChange={handleChange('vetName')}
            />
          </div>

          <div className="add-event-modal__field">
            <label className="add-event-modal__label" htmlFor="event-notes">
              Notas
            </label>
            <textarea
              id="event-notes"
              className="add-event-modal__input add-event-modal__input--textarea"
              value={form.notes}
              onChange={handleChange('notes')}
              rows={3}
            />
          </div>

          {error && <p className="add-event-modal__error">{error}</p>}

          <footer className="add-event-modal__footer">
            <button
              type="button"
              className="add-event-modal__btn add-event-modal__btn--secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="add-event-modal__btn add-event-modal__btn--primary"
              disabled={
                submitting ||
                !form.eventTypeId ||
                !form.scheduledDate ||
                (isOther && !form.customName.trim())
              }
            >
              {submitting ? 'Guardando…' : 'Crear evento'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
