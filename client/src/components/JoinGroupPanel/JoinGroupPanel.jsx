import { useEffect, useState } from 'react';
import { Clipboard, LogIn, LogOut } from 'lucide-react';
import {
  joinByCode,
  getMyMemberships,
  leaveMembership,
} from '../../services/collaborator.service';
import { ConfirmDialog } from '../ConfirmDialog/ConfirmDialog';
import './JoinGroupPanel.scss';

const ROLE_LABEL = { VIEWER: 'Lector', EDITOR: 'Editor' };

export function JoinGroupPanel() {
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [leaving, setLeaving] = useState(null);

  const loadMemberships = () => {
    setLoading(true);
    getMyMemberships()
      .then((res) => setMemberships(res.data?.memberships || []))
      .catch(() => setMemberships([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadMemberships();
  }, []);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setCode(text.trim());
    } catch {
      setFeedback({
        title: 'No se ha podido pegar',
        message: 'Tu navegador no permite leer el portapapeles. Pégalo manualmente.',
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;
    setSubmitting(true);
    try {
      const res = await joinByCode(trimmed);
      setCode('');
      setFeedback({
        title: '¡Te has unido!',
        message: `Ahora colaboras en "${res.data?.group?.name || 'el grupo'}" como ${
          ROLE_LABEL[res.data?.role] || res.data?.role
        }.`,
      });
      loadMemberships();
    } catch (err) {
      setFeedback({
        title: 'No se ha podido unir',
        message: err?.response?.data?.error || 'Comprueba el código e inténtalo de nuevo.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="join-group">
      <h2 className="join-group__title">Unirme a un grupo</h2>
      <p className="join-group__hint">
        Si te han enviado un código de grupo, pégalo aquí para colaborar en él.
      </p>

      <form className="join-group__form" onSubmit={handleSubmit}>
        <div className="join-group__input-wrap">
          <input
            className="join-group__input"
            type="text"
            placeholder="Pega aquí el código"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            maxLength={32}
            autoCapitalize="characters"
            spellCheck={false}
          />
          <button
            type="button"
            className="join-group__paste"
            onClick={handlePaste}
            aria-label="Pegar del portapapeles"
            title="Pegar del portapapeles"
          >
            <Clipboard size={14} />
          </button>
        </div>
        <button
          type="submit"
          className="join-group__btn"
          disabled={submitting || !code.trim()}
        >
          <LogIn size={14} />
          <span>{submitting ? 'Uniéndome…' : 'Unirme'}</span>
        </button>
      </form>

      <div className="join-group__memberships">
        <h3 className="join-group__memberships-title">Grupos en los que colaboras</h3>
        {loading ? (
          <p className="join-group__memberships-empty">Cargando…</p>
        ) : memberships.length === 0 ? (
          <p className="join-group__memberships-empty">
            Todavía no colaboras en ningún grupo.
          </p>
        ) : (
          <ul className="join-group__memberships-list">
            {memberships.map((m) => (
              <li key={m.id} className="join-group__membership">
                <div>
                  <span className="join-group__membership-name">{m.group?.name}</span>
                  <span className="join-group__membership-owner">
                    {' · de '}
                    {m.group?.user?.name || 'otra cuenta'}
                  </span>
                </div>
                <div className="join-group__membership-actions">
                  <span className="join-group__membership-role">
                    {ROLE_LABEL[m.role] || m.role}
                  </span>
                  <button
                    type="button"
                    className="join-group__leave"
                    onClick={() => setLeaving(m)}
                    aria-label="Salir del grupo"
                    title="Salir del grupo"
                  >
                    <LogOut size={14} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={!!feedback}
        title={feedback?.title || 'Aviso'}
        message={feedback?.message}
        confirmText="Entendido"
        hideCancel
        onClose={() => setFeedback(null)}
      />

      <ConfirmDialog
        open={!!leaving}
        title="Salir del grupo"
        message={
          leaving
            ? `¿Seguro que quieres salir de "${leaving.group?.name}"? Dejarás de ver sus animales.`
            : ''
        }
        confirmText="Salir"
        danger
        onClose={() => setLeaving(null)}
        onConfirm={async () => {
          if (!leaving) return;
          try {
            await leaveMembership(leaving.id);
            loadMemberships();
          } catch (err) {
            setFeedback({
              title: 'No se ha podido salir',
              message: err?.response?.data?.error || 'Inténtalo de nuevo.',
            });
          }
        }}
      />
    </section>
  );
}
