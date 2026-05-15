import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { createAnimalWeight, updateWeight } from '../../services/animal.service';
import './AddWeightModal.scss';

const todayIso = () => new Date().toISOString().slice(0, 10);

const toDateInput = (iso) => (iso ? new Date(iso).toISOString().slice(0, 10) : '');

const fromInitial = (initial) => ({
  valueKg: initial.valueKg != null ? String(initial.valueKg) : '',
  recordedAt: toDateInput(initial.recordedAt),
});

export function AddWeightModal({ open, animalId, initial, onClose, onSaved }) {
  const isEdit = !!initial;
  const [form, setForm] = useState({ valueKg: '', recordedAt: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setForm(initial ? fromInitial(initial) : { valueKg: '', recordedAt: todayIso() });
    setError('');
  }, [open, initial]);

  if (!open) return null;

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const value = parseFloat(form.valueKg);
  const isValid =
    !isNaN(value) && value > 0 && value <= 200 && !!form.recordedAt;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) return;
    setSubmitting(true);
    setError('');
    try {
      const payload = { valueKg: value, recordedAt: form.recordedAt };
      const res = isEdit
        ? await updateWeight(initial.id, payload)
        : await createAnimalWeight(animalId, payload);
      onSaved?.(res.data);
      onClose?.();
    } catch (err) {
      setError(err?.response?.data?.error || 'No se ha podido guardar el peso');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="add-weight-modal" role="dialog" aria-modal="true">
      <div className="add-weight-modal__overlay" onClick={onClose} />
      <div className="add-weight-modal__content">
        <header className="add-weight-modal__header">
          <h2 className="add-weight-modal__title">
            {isEdit ? 'Editar peso' : 'Registrar peso'}
          </h2>
          <button
            type="button"
            className="add-weight-modal__close"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </header>

        <form className="add-weight-modal__form" onSubmit={handleSubmit}>
          <div className="add-weight-modal__row">
            <div className="add-weight-modal__field">
              <label className="add-weight-modal__label" htmlFor="weight-value">
                Peso (kg) *
              </label>
              <input
                id="weight-value"
                type="number"
                min="0.1"
                max="200"
                step="0.1"
                className="add-weight-modal__input"
                value={form.valueKg}
                onChange={handleChange('valueKg')}
                placeholder="Ej: 4.2"
                required
                autoFocus
              />
            </div>

            <div className="add-weight-modal__field">
              <label className="add-weight-modal__label" htmlFor="weight-date">
                Fecha *
              </label>
              <input
                id="weight-date"
                type="date"
                className="add-weight-modal__input"
                value={form.recordedAt}
                onChange={handleChange('recordedAt')}
                max={todayIso()}
                required
              />
            </div>
          </div>

          {error && <p className="add-weight-modal__error">{error}</p>}

          <footer className="add-weight-modal__footer">
            <button
              type="button"
              className="add-weight-modal__btn add-weight-modal__btn--secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="add-weight-modal__btn add-weight-modal__btn--primary"
              disabled={submitting || !isValid}
            >
              {submitting ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Registrar peso'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
