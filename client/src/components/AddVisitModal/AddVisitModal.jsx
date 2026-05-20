import { useEffect, useId, useState } from 'react';
import { X } from 'lucide-react';
import { createAnimalVisit, updateVisit } from '../../services/animal.service';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import './AddVisitModal.scss';

const EMPTY_FORM = {
  visitDate: '',
  reason: '',
  diagnosis: '',
  treatment: '',
  vetName: '',
  observations: '',
  cost: '',
};

const todayIso = () => new Date().toISOString().slice(0, 10);

const toDateInput = (iso) => (iso ? new Date(iso).toISOString().slice(0, 10) : '');

const fromVisit = (visit) => ({
  visitDate: toDateInput(visit.visitDate),
  reason: visit.reason ?? '',
  diagnosis: visit.diagnosis ?? '',
  treatment: visit.treatment ?? '',
  vetName: visit.vetName ?? '',
  observations: visit.observations ?? '',
  cost: visit.cost != null ? String(visit.cost) : '',
});

export function AddVisitModal({ open, animalId, initial, onClose, onSaved }) {
  const isEdit = !!initial;
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const titleId = useId();
  const containerRef = useFocusTrap(open);

  useEscapeKey(onClose, open);

  useEffect(() => {
    if (!open) return;
    setForm(initial ? fromVisit(initial) : EMPTY_FORM);
    setError(null);
  }, [open, initial]);

  if (!open) return null;

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const isValid = form.visitDate && form.reason.trim();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) return;
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        visitDate: form.visitDate,
        reason: form.reason.trim(),
        diagnosis: form.diagnosis.trim() || null,
        treatment: form.treatment.trim() || null,
        vetName: form.vetName.trim() || null,
        observations: form.observations.trim() || null,
        cost: form.cost === '' ? null : form.cost,
      };

      const res = isEdit
        ? await updateVisit(initial.id, payload)
        : await createAnimalVisit(animalId, payload);
      onSaved?.(res.data?.visit);
      onClose?.();
    } catch (err) {
      setError(err?.response?.data?.error || 'No se ha podido guardar la visita');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="add-visit-modal" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <div className="add-visit-modal__overlay" onClick={onClose} aria-hidden="true" />
      <div className="add-visit-modal__content" ref={containerRef}>
        <header className="add-visit-modal__header">
          <h2 id={titleId} className="add-visit-modal__title">
            {isEdit ? 'Editar visita veterinaria' : 'Añadir visita veterinaria'}
          </h2>
          <button
            type="button"
            className="add-visit-modal__close"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </header>

        <form className="add-visit-modal__form" onSubmit={handleSubmit}>
          <div className="add-visit-modal__row">
            <div className="add-visit-modal__field">
              <label className="add-visit-modal__label" htmlFor="visit-date">
                Fecha de la visita <span aria-hidden="true">*</span>
              </label>
              <input
                id="visit-date"
                type="date"
                className="add-visit-modal__input"
                value={form.visitDate}
                onChange={handleChange('visitDate')}
                max={todayIso()}
                required
                aria-required="true"
              />
            </div>

            <div className="add-visit-modal__field">
              <label className="add-visit-modal__label" htmlFor="visit-cost">
                Coste (EUR)
              </label>
              <input
                id="visit-cost"
                type="number"
                min="0"
                step="0.01"
                className="add-visit-modal__input"
                value={form.cost}
                onChange={handleChange('cost')}
                placeholder="Opcional"
              />
            </div>
          </div>

          <div className="add-visit-modal__field">
            <label className="add-visit-modal__label" htmlFor="visit-reason">
              Motivo <span aria-hidden="true">*</span>
            </label>
            <input
              id="visit-reason"
              type="text"
              maxLength={200}
              className="add-visit-modal__input"
              value={form.reason}
              onChange={handleChange('reason')}
              placeholder="Ej: Revisión anual"
              required
              aria-required="true"
            />
          </div>

          <div className="add-visit-modal__field">
            <label className="add-visit-modal__label" htmlFor="visit-vet">
              Veterinario
            </label>
            <input
              id="visit-vet"
              type="text"
              maxLength={100}
              className="add-visit-modal__input"
              value={form.vetName}
              onChange={handleChange('vetName')}
            />
          </div>

          <div className="add-visit-modal__field">
            <label className="add-visit-modal__label" htmlFor="visit-diagnosis">
              Diagnóstico
            </label>
            <textarea
              id="visit-diagnosis"
              className="add-visit-modal__input add-visit-modal__input--textarea"
              value={form.diagnosis}
              onChange={handleChange('diagnosis')}
              rows={2}
            />
          </div>

          <div className="add-visit-modal__field">
            <label className="add-visit-modal__label" htmlFor="visit-treatment">
              Tratamiento
            </label>
            <textarea
              id="visit-treatment"
              className="add-visit-modal__input add-visit-modal__input--textarea"
              value={form.treatment}
              onChange={handleChange('treatment')}
              rows={2}
            />
          </div>

          <div className="add-visit-modal__field">
            <label className="add-visit-modal__label" htmlFor="visit-observations">
              Observaciones
            </label>
            <textarea
              id="visit-observations"
              className="add-visit-modal__input add-visit-modal__input--textarea"
              value={form.observations}
              onChange={handleChange('observations')}
              rows={3}
            />
          </div>

          {error && <p className="add-visit-modal__error" role="alert">{error}</p>}

          <footer className="add-visit-modal__footer">
            <button
              type="button"
              className="add-visit-modal__btn add-visit-modal__btn--secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="add-visit-modal__btn add-visit-modal__btn--primary"
              disabled={submitting || !isValid}
            >
              {submitting ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear visita'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
