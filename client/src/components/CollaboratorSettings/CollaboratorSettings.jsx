import { useEffect, useState } from 'react';
import { Trash, UserPlus, Users } from 'lucide-react';
import { Badge } from '../Badge/Badge';
import {
  getCollaborators,
  inviteCollaborator,
  removeCollaborator,
} from '../../services/collaborator.service';
import './CollaboratorSettings.scss';

export function CollaboratorSettings() {
  const [collaborators, setCollaborators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const load = () => {
    setLoading(true);
    getCollaborators()
      .then((res) => setCollaborators(res.data?.collaborators || []))
      .catch(() => setCollaborators([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleInvite = async (e) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await inviteCollaborator(trimmed);
      setEmail('');
      load();
      if (res.data?.created && res.data?.tempPassword) {
        setFeedback({
          type: 'success',
          text: `Colaborador creado. Contraseña temporal: ${res.data.tempPassword}`,
        });
      } else {
        setFeedback({ type: 'success', text: 'Colaborador añadido' });
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err?.response?.data?.error || 'No se ha podido invitar al colaborador',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (collab) => {
    if (!window.confirm(`¿Eliminar al colaborador ${collab.email}?`)) return;
    try {
      await removeCollaborator(collab.id);
      setCollaborators((prev) => prev.filter((c) => c.id !== collab.id));
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err?.response?.data?.error || 'No se ha podido eliminar al colaborador',
      });
    }
  };

  return (
    <section className="collaborator-settings">
      <h2 className="collaborator-settings__title">Colaboradores</h2>
      <p className="collaborator-settings__hint">
        Los colaboradores pueden ver animales y registrar eventos sanitarios, pero no pueden
        acceder a gastos ni configuración.
      </p>

      {loading ? (
        <p className="collaborator-settings__loading">Cargando…</p>
      ) : collaborators.length === 0 ? (
        <div className="collaborator-settings__empty">
          <Users size={32} className="collaborator-settings__empty-icon" />
          <p className="collaborator-settings__empty-text">Sin colaboradores</p>
        </div>
      ) : (
        <ul className="collaborator-settings__list">
          {collaborators.map((collab) => (
            <li className="collaborator-settings__row" key={collab.id}>
              <div className="collaborator-settings__row-body">
                <span className="collaborator-settings__email">{collab.email}</span>
                <Badge text="Colaborador" variant="info" />
              </div>
              <button
                type="button"
                className="collaborator-settings__icon-btn"
                onClick={() => handleRemove(collab)}
                aria-label="Eliminar colaborador"
              >
                <Trash size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <form className="collaborator-settings__invite" onSubmit={handleInvite}>
        <input
          className="collaborator-settings__input"
          type="email"
          placeholder="Email del colaborador"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button
          type="submit"
          className="collaborator-settings__btn"
          disabled={submitting || !email.trim()}
        >
          <UserPlus size={14} />
          <span>{submitting ? 'Invitando…' : 'Invitar'}</span>
        </button>
      </form>

      {feedback && (
        <p className={`collaborator-settings__feedback collaborator-settings__feedback--${feedback.type}`}>
          {feedback.text}
        </p>
      )}
    </section>
  );
}
