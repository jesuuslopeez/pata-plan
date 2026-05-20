import { useEffect, useState } from 'react';
import { Copy, RefreshCw, Ban, Trash, ChevronDown, ChevronRight } from 'lucide-react';
import { getGroups } from '../../services/group.service';
import {
  getInviteCode,
  regenerateInviteCode,
  revokeInviteCode,
  listGroupCollaborators,
  updateCollaboratorRole,
  removeGroupCollaborator,
} from '../../services/collaborator.service';
import { ConfirmDialog } from '../ConfirmDialog/ConfirmDialog';
import './GroupCollaboratorsPanel.scss';

const ROLE_LABEL = { VIEWER: 'Lector', EDITOR: 'Editor' };

export function GroupCollaboratorsPanel() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});
  const [codes, setCodes] = useState({});
  const [collaboratorsByGroup, setCollaboratorsByGroup] = useState({});
  const [alertDialog, setAlertDialog] = useState(null);
  const [revokingGroup, setRevokingGroup] = useState(null);
  const [removingCollab, setRemovingCollab] = useState(null);

  const loadGroups = () => {
    setLoading(true);
    getGroups()
      .then((res) => setGroups(res.data?.groups || []))
      .catch(() => setGroups([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadGroups();
  }, []);

  const loadCode = (groupId) =>
    getInviteCode(groupId)
      .then((res) => {
        setCodes((prev) => ({ ...prev, [groupId]: res.data?.inviteCode ?? null }));
      })
      .catch(() => {});

  const loadCollaborators = (groupId) =>
    listGroupCollaborators(groupId)
      .then((res) => {
        setCollaboratorsByGroup((prev) => ({
          ...prev,
          [groupId]: res.data?.collaborators || [],
        }));
      })
      .catch(() => {});

  const toggle = (groupId) => {
    setExpanded((prev) => {
      const next = { ...prev, [groupId]: !prev[groupId] };
      if (next[groupId]) {
        loadCode(groupId);
        loadCollaborators(groupId);
      }
      return next;
    });
  };

  const handleRegenerate = async (groupId) => {
    try {
      const res = await regenerateInviteCode(groupId);
      setCodes((prev) => ({ ...prev, [groupId]: res.data?.inviteCode ?? null }));
    } catch (err) {
      setAlertDialog({
        title: 'No se ha podido generar el código',
        message: err?.response?.data?.error || 'Inténtalo de nuevo más tarde.',
      });
    }
  };

  const handleCopy = async (groupId) => {
    const code = codes[groupId];
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setAlertDialog({
        title: 'Código copiado',
        message: 'Compártelo con quien quieras invitar al grupo.',
      });
    } catch {
      setAlertDialog({
        title: 'No se ha podido copiar',
        message: 'Cópialo manualmente desde el campo.',
      });
    }
  };

  const handleRevoke = async () => {
    if (!revokingGroup) return;
    try {
      await revokeInviteCode(revokingGroup.id);
      setCodes((prev) => ({ ...prev, [revokingGroup.id]: null }));
    } catch (err) {
      setAlertDialog({
        title: 'No se ha podido revocar',
        message: err?.response?.data?.error || 'Inténtalo de nuevo más tarde.',
      });
    }
  };

  const handleRoleChange = async (groupId, membershipId, role) => {
    try {
      const res = await updateCollaboratorRole(groupId, membershipId, role);
      setCollaboratorsByGroup((prev) => ({
        ...prev,
        [groupId]: (prev[groupId] || []).map((c) =>
          c.id === membershipId ? res.data?.collaborator || c : c
        ),
      }));
    } catch (err) {
      setAlertDialog({
        title: 'No se ha podido cambiar el rol',
        message: err?.response?.data?.error || 'Inténtalo de nuevo más tarde.',
      });
    }
  };

  const handleRemove = async () => {
    if (!removingCollab) return;
    const { groupId, id } = removingCollab;
    try {
      await removeGroupCollaborator(groupId, id);
      setCollaboratorsByGroup((prev) => ({
        ...prev,
        [groupId]: (prev[groupId] || []).filter((c) => c.id !== id),
      }));
    } catch (err) {
      setAlertDialog({
        title: 'No se ha podido eliminar',
        message: err?.response?.data?.error || 'Inténtalo de nuevo más tarde.',
      });
    }
  };

  return (
    <section className="group-collaborators">
      <h2 className="group-collaborators__title">Colaboradores por grupo</h2>
      <p className="group-collaborators__hint">
        Genera un código para que alguien se una a un grupo. Por defecto entran como
        lectores; puedes promoverlos a editores o quitarlos cuando quieras.
      </p>

      {loading ? (
        <p className="group-collaborators__loading" role="status" aria-live="polite">Cargando…</p>
      ) : groups.length === 0 ? (
        <p className="group-collaborators__empty">
          Crea un grupo primero para poder gestionar colaboradores.
        </p>
      ) : (
        <ul className="group-collaborators__list">
          {groups.map((group) => {
            const isOpen = !!expanded[group.id];
            const code = codes[group.id];
            const collaborators = collaboratorsByGroup[group.id] || [];
            return (
              <li key={group.id} className="group-collaborators__row">
                <button
                  type="button"
                  className="group-collaborators__toggle"
                  onClick={() => toggle(group.id)}
                >
                  {isOpen ? <ChevronDown size={16} aria-hidden="true" /> : <ChevronRight size={16} aria-hidden="true" />}
                  <span className="group-collaborators__name">{group.name}</span>
                </button>

                {isOpen && (
                  <div className="group-collaborators__body">
                    <div className="group-collaborators__code">
                      <label className="group-collaborators__label">
                        Código de invitación
                      </label>
                      <div className="group-collaborators__code-row">
                        <input
                          type="text"
                          className="group-collaborators__code-input"
                          value={code || ''}
                          readOnly
                          placeholder="Sin código todavía"
                        />
                        {code && (
                          <button
                            type="button"
                            className="group-collaborators__icon-btn"
                            onClick={() => handleCopy(group.id)}
                            aria-label="Copiar código"
                            title="Copiar código"
                          >
                            <Copy size={14} aria-hidden="true" />
                          </button>
                        )}
                        <button
                          type="button"
                          className="group-collaborators__icon-btn"
                          onClick={() => handleRegenerate(group.id)}
                          aria-label="Regenerar código"
                          title={code ? 'Regenerar código' : 'Generar código'}
                        >
                          <RefreshCw size={14} aria-hidden="true" />
                        </button>
                        {code && (
                          <button
                            type="button"
                            className="group-collaborators__icon-btn group-collaborators__icon-btn--danger"
                            onClick={() => setRevokingGroup(group)}
                            aria-label="Revocar código"
                            title="Revocar código"
                          >
                            <Ban size={14} aria-hidden="true" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="group-collaborators__members">
                      <label className="group-collaborators__label">
                        Colaboradores ({collaborators.length})
                      </label>
                      {collaborators.length === 0 ? (
                        <p className="group-collaborators__no-members">
                          Aún no hay colaboradores en este grupo.
                        </p>
                      ) : (
                        <ul className="group-collaborators__members-list">
                          {collaborators.map((c) => (
                            <li
                              key={c.id}
                              className="group-collaborators__member"
                            >
                              <div className="group-collaborators__member-info">
                                <span className="group-collaborators__member-name">
                                  {c.user?.name || c.user?.email}
                                </span>
                                <span className="group-collaborators__member-email">
                                  {c.user?.email}
                                </span>
                              </div>
                              <div className="group-collaborators__member-actions">
                                <select
                                  className="group-collaborators__role"
                                  value={c.role}
                                  onChange={(e) =>
                                    handleRoleChange(group.id, c.id, e.target.value)
                                  }
                                  aria-label="Rol del colaborador"
                                >
                                  {Object.entries(ROLE_LABEL).map(([value, label]) => (
                                    <option key={value} value={value}>
                                      {label}
                                    </option>
                                  ))}
                                </select>
                                <button
                                  type="button"
                                  className="group-collaborators__icon-btn group-collaborators__icon-btn--danger"
                                  onClick={() =>
                                    setRemovingCollab({ ...c, groupId: group.id })
                                  }
                                  aria-label="Eliminar colaborador"
                                >
                                  <Trash size={14} aria-hidden="true" />
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog
        open={!!revokingGroup}
        title="Revocar código"
        message={
          revokingGroup
            ? `¿Revocar el código del grupo "${revokingGroup.name}"? Los colaboradores actuales seguirán dentro, pero nadie nuevo podrá unirse con ese código.`
            : ''
        }
        confirmText="Revocar"
        danger
        onClose={() => setRevokingGroup(null)}
        onConfirm={handleRevoke}
      />

      <ConfirmDialog
        open={!!removingCollab}
        title="Eliminar colaborador"
        message={
          removingCollab
            ? `¿Eliminar a ${removingCollab.user?.name || removingCollab.user?.email} del grupo?`
            : ''
        }
        confirmText="Eliminar"
        danger
        onClose={() => setRemovingCollab(null)}
        onConfirm={handleRemove}
      />

      <ConfirmDialog
        open={!!alertDialog}
        title={alertDialog?.title || 'Aviso'}
        message={alertDialog?.message}
        confirmText="Entendido"
        hideCancel
        onClose={() => setAlertDialog(null)}
      />
    </section>
  );
}
