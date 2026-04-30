import { useEffect, useState } from 'react';
import { X, Ban, ClipboardList } from 'lucide-react';
import {
  cancelAssignment,
  assignProtocolToAnimal,
  getAnimalAssignments,
  getProtocols,
} from '../../services/protocol.service';
import { Badge } from '../Badge/Badge';
import './AssignProtocolModal.scss';

const STATUS_VARIANT = {
  ACTIVE: 'success',
  COMPLETED: 'neutral',
  CANCELLED: 'danger',
};
const STATUS_LABEL = {
  ACTIVE: 'Activa',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
};

const todayIso = () => new Date().toISOString().slice(0, 10);

export function AssignProtocolModal({ open, animalId, animalName, onClose, onChanged }) {
  const [protocols, setProtocols] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [protocolId, setProtocolId] = useState('');
  const [startDate, setStartDate] = useState(todayIso());
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const refreshAssignments = () =>
    getAnimalAssignments(animalId)
      .then((res) => setAssignments(res.data?.assignments || []))
      .catch(() => setAssignments([]));

  useEffect(() => {
    if (!open) return;
    setError('');
    setProtocolId('');
    setStartDate(todayIso());
    setLoading(true);
    Promise.all([
      getProtocols()
        .then((res) => setProtocols(res.data?.protocols || res.data || []))
        .catch(() => setProtocols([])),
      refreshAssignments(),
    ]).finally(() => setLoading(false));
  }, [open, animalId]);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!protocolId) {
      setError('Selecciona un protocolo');
      return;
    }
    if (!startDate) {
      setError('Selecciona la fecha de inicio');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await assignProtocolToAnimal(animalId, {
        protocolId: parseInt(protocolId, 10),
        startDate,
      });
      await refreshAssignments();
      setProtocolId('');
      onChanged?.();
    } catch (err) {
      setError(err?.response?.data?.error || 'No se ha podido asignar el protocolo');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (assignment) => {
    if (!window.confirm(`¿Cancelar la asignación de "${assignment.protocol?.name}"?`)) {
      return;
    }
    try {
      await cancelAssignment(assignment.id);
      await refreshAssignments();
      onChanged?.();
    } catch (err) {
      window.alert(err?.response?.data?.error || 'No se ha podido cancelar la asignación');
    }
  };

  return (
    <div className="assign-modal" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="assign-modal__panel" onClick={(e) => e.stopPropagation()}>
        <header className="assign-modal__head">
          <div>
            <h2 className="assign-modal__title">Asignar protocolo</h2>
            <p className="assign-modal__subtitle">a {animalName}</p>
          </div>
          <button
            type="button"
            className="assign-modal__close"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </header>

        <form className="assign-modal__form" onSubmit={handleSubmit}>
          <div className="assign-modal__field">
            <label className="assign-modal__label" htmlFor="assign-protocol">
              Protocolo
            </label>
            <select
              id="assign-protocol"
              className="assign-modal__input"
              value={protocolId}
              onChange={(e) => setProtocolId(e.target.value)}
              disabled={loading || protocols.length === 0}
            >
              <option value="">Selecciona…</option>
              {protocols.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.steps?.length || 0} pasos)
                </option>
              ))}
            </select>
            {!loading && protocols.length === 0 && (
              <p className="assign-modal__hint">
                No hay protocolos disponibles. Crea uno desde la sección de protocolos.
              </p>
            )}
          </div>

          <div className="assign-modal__field">
            <label className="assign-modal__label" htmlFor="assign-start-date">
              Fecha de inicio
            </label>
            <input
              id="assign-start-date"
              type="date"
              className="assign-modal__input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          {error && <p className="assign-modal__error">{error}</p>}

          <button type="submit" className="assign-modal__submit" disabled={submitting}>
            {submitting ? 'Asignando…' : 'Asignar protocolo'}
          </button>
        </form>

        <section className="assign-modal__list">
          <h3 className="assign-modal__list-title">Asignaciones existentes</h3>
          {loading ? (
            <p className="assign-modal__list-empty">Cargando…</p>
          ) : assignments.length === 0 ? (
            <p className="assign-modal__list-empty">
              <ClipboardList size={16} />
              <span>Sin asignaciones registradas</span>
            </p>
          ) : (
            <ul className="assign-modal__items">
              {assignments.map((a) => (
                <li key={a.id} className="assign-modal__item">
                  <div className="assign-modal__item-body">
                    <div className="assign-modal__item-head">
                      <span className="assign-modal__item-name">
                        {a.protocol?.name || 'Protocolo'}
                      </span>
                      <Badge
                        text={STATUS_LABEL[a.status] || a.status}
                        variant={STATUS_VARIANT[a.status] || 'neutral'}
                      />
                    </div>
                    <p className="assign-modal__item-meta">
                      Inicio:{' '}
                      {new Date(a.startDate).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  {a.status === 'ACTIVE' && (
                    <button
                      type="button"
                      className="assign-modal__item-cancel"
                      onClick={() => handleCancel(a)}
                      aria-label="Cancelar asignación"
                    >
                      <Ban size={14} />
                      <span>Cancelar</span>
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
