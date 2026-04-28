import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import './ProtocolStepModal.scss';

const EMPTY_FORM = { eventTypeId: '', dayOffset: 0, product: '', notes: '' };

export function ProtocolStepModal({ open, initial, eventTypes, onClose, onSubmit }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setForm(
        initial
          ? {
              eventTypeId: String(initial.eventTypeId ?? initial.eventType?.id ?? ''),
              dayOffset: initial.dayOffset ?? 0,
              product: initial.product ?? '',
              notes: initial.notes ?? '',
            }
          : EMPTY_FORM
      );
      setError('');
    }
  }, [open, initial]);

  if (!open) return null;

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.eventTypeId) {
      setError('Selecciona un tipo de evento');
      return;
    }
    const day = parseInt(form.dayOffset, 10);
    if (isNaN(day) || day < 0) {
      setError('El día debe ser un número entero positivo o cero');
      return;
    }
    onSubmit({
      eventTypeId: parseInt(form.eventTypeId, 10),
      dayOffset: day,
      product: form.product.trim() || null,
      notes: form.notes.trim() || null,
    });
  };

  return (
    <div className="step-modal" role="dialog" aria-modal="true" onClick={onClose}>
      <form
        className="step-modal__panel"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <header className="step-modal__head">
          <h2 className="step-modal__title">{initial ? 'Editar paso' : 'Añadir paso'}</h2>
          <button
            type="button"
            className="step-modal__close"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </header>

        <div className="step-modal__field">
          <label className="step-modal__label" htmlFor="step-event-type">
            Tipo de evento
          </label>
          <select
            id="step-event-type"
            className="step-modal__input"
            value={form.eventTypeId}
            onChange={handleChange('eventTypeId')}
            required
          >
            <option value="">Selecciona…</option>
            {eventTypes.map((et) => (
              <option key={et.id} value={et.id}>
                {et.name} ({et.category})
              </option>
            ))}
          </select>
        </div>

        <div className="step-modal__field">
          <label className="step-modal__label" htmlFor="step-day-offset">
            Día (desde el inicio)
          </label>
          <input
            id="step-day-offset"
            type="number"
            min="0"
            className="step-modal__input"
            value={form.dayOffset}
            onChange={handleChange('dayOffset')}
            required
          />
        </div>

        <div className="step-modal__field">
          <label className="step-modal__label" htmlFor="step-product">
            Producto (opcional)
          </label>
          <input
            id="step-product"
            type="text"
            className="step-modal__input"
            value={form.product}
            onChange={handleChange('product')}
            placeholder="p. ej. Nobivac DHPPi"
          />
        </div>

        <div className="step-modal__field">
          <label className="step-modal__label" htmlFor="step-notes">
            Notas (opcional)
          </label>
          <textarea
            id="step-notes"
            className="step-modal__input step-modal__input--textarea"
            value={form.notes}
            onChange={handleChange('notes')}
            rows={3}
          />
        </div>

        {error && <p className="step-modal__error">{error}</p>}

        <footer className="step-modal__actions">
          <button type="button" className="step-modal__btn step-modal__btn--secondary" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="step-modal__btn step-modal__btn--primary">
            {initial ? 'Guardar cambios' : 'Añadir paso'}
          </button>
        </footer>
      </form>
    </div>
  );
}
