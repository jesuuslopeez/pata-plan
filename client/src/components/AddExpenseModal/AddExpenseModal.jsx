import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import {
  createExpense,
  updateExpense,
} from '../../services/expense.service';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import './AddExpenseModal.scss';

const CATEGORY_OPTIONS = [
  { value: 'VACCINE', label: 'Vacunas' },
  { value: 'DEWORMING', label: 'Desparasitaciones' },
  { value: 'SURGERY', label: 'Cirugías' },
  { value: 'MEDICATION', label: 'Medicación' },
  { value: 'FOOD', label: 'Alimentación' },
  { value: 'OTHER', label: 'Otros' },
];

const todayIso = () => new Date().toISOString().slice(0, 10);

const toDateInput = (iso) => (iso ? new Date(iso).toISOString().slice(0, 10) : '');

const buildEmptyForm = () => ({
  groupId: '',
  animalId: '',
  amount: '',
  category: 'OTHER',
  expenseDate: todayIso(),
  description: '',
});

const fromExpense = (expense, animals) => {
  const animal = animals?.find((a) => a.id === expense.animalId);
  return {
    groupId: animal?.group?.id != null ? String(animal.group.id) : '',
    animalId: expense.animalId != null ? String(expense.animalId) : '',
    amount: expense.amount != null ? String(expense.amount) : '',
    category: expense.category || 'OTHER',
    expenseDate: toDateInput(expense.expenseDate),
    description: expense.description ?? '',
  };
};

export function AddExpenseModal({ open, animals, initial, onClose, onSaved }) {
  const isEdit = !!initial;
  const [form, setForm] = useState(buildEmptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEscapeKey(onClose, open);

  useEffect(() => {
    if (!open) return;
    setForm(initial ? fromExpense(initial, animals) : buildEmptyForm());
    setError(null);
  }, [open, initial, animals]);

  const groups = useMemo(() => {
    const map = new Map();
    for (const a of animals || []) {
      if (a.group?.id != null && !map.has(a.group.id)) {
        map.set(a.group.id, { id: a.group.id, name: a.group.name });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [animals]);

  const filteredAnimals = useMemo(() => {
    if (!form.groupId) return [];
    const gid = Number(form.groupId);
    return (animals || []).filter((a) => a.group?.id === gid);
  }, [animals, form.groupId]);

  if (!open) return null;

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleGroupChange = (e) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, groupId: value, animalId: '' }));
  };

  const isValid =
    form.animalId &&
    form.amount !== '' &&
    Number(form.amount) > 0 &&
    form.category &&
    form.expenseDate;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) return;
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        animalId: form.animalId,
        amount: Number(form.amount),
        category: form.category,
        expenseDate: form.expenseDate,
        description: form.description.trim() || null,
      };

      const res = isEdit
        ? await updateExpense(initial.id, payload)
        : await createExpense(payload);
      onSaved?.(res.data?.expense);
      onClose?.();
    } catch (err) {
      setError(err?.response?.data?.error || 'No se ha podido guardar el gasto');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="add-expense-modal" role="dialog" aria-modal="true">
      <div className="add-expense-modal__overlay" onClick={onClose} />
      <div className="add-expense-modal__content">
        <header className="add-expense-modal__header">
          <h2 className="add-expense-modal__title">
            {isEdit ? 'Editar gasto' : 'Añadir gasto'}
          </h2>
          <button
            type="button"
            className="add-expense-modal__close"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </header>

        <form className="add-expense-modal__form" onSubmit={handleSubmit}>
          <div className="add-expense-modal__row">
            <div className="add-expense-modal__field">
              <label className="add-expense-modal__label" htmlFor="expense-group">
                Grupo *
              </label>
              <select
                id="expense-group"
                className="add-expense-modal__input"
                value={form.groupId}
                onChange={handleGroupChange}
                required
              >
                <option value="">Selecciona un grupo</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="add-expense-modal__field">
              <label className="add-expense-modal__label" htmlFor="expense-animal">
                Animal *
              </label>
              <select
                id="expense-animal"
                className="add-expense-modal__input"
                value={form.animalId}
                onChange={handleChange('animalId')}
                disabled={!form.groupId}
                required
              >
                <option value="">
                  {form.groupId ? 'Selecciona un animal' : 'Elige antes un grupo'}
                </option>
                {filteredAnimals.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="add-expense-modal__row">
            <div className="add-expense-modal__field">
              <label className="add-expense-modal__label" htmlFor="expense-amount">
                Importe (EUR) *
              </label>
              <input
                id="expense-amount"
                type="number"
                min="0.01"
                step="0.01"
                className="add-expense-modal__input"
                value={form.amount}
                onChange={handleChange('amount')}
                required
              />
            </div>

            <div className="add-expense-modal__field">
              <label className="add-expense-modal__label" htmlFor="expense-date">
                Fecha *
              </label>
              <input
                id="expense-date"
                type="date"
                className="add-expense-modal__input"
                value={form.expenseDate}
                onChange={handleChange('expenseDate')}
                max={todayIso()}
                required
              />
            </div>
          </div>

          <div className="add-expense-modal__field">
            <label className="add-expense-modal__label" htmlFor="expense-category">
              Categoría *
            </label>
            <select
              id="expense-category"
              className="add-expense-modal__input"
              value={form.category}
              onChange={handleChange('category')}
              required
            >
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div className="add-expense-modal__field">
            <label className="add-expense-modal__label" htmlFor="expense-description">
              Descripción
            </label>
            <textarea
              id="expense-description"
              maxLength={300}
              className="add-expense-modal__input add-expense-modal__input--textarea"
              value={form.description}
              onChange={handleChange('description')}
              rows={3}
              placeholder="Opcional"
            />
          </div>

          {error && <p className="add-expense-modal__error">{error}</p>}

          <footer className="add-expense-modal__footer">
            <button
              type="button"
              className="add-expense-modal__btn add-expense-modal__btn--secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="add-expense-modal__btn add-expense-modal__btn--primary"
              disabled={submitting || !isValid}
            >
              {submitting ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear gasto'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
