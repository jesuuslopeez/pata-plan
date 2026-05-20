import { useEffect, useState } from 'react';
import { Edit, Plus, Trash } from 'lucide-react';
import {
  createGroup,
  deleteGroup,
  getGroups,
  updateGroup,
} from '../../services/group.service';
import { ConfirmDialog } from '../ConfirmDialog/ConfirmDialog';
import './GroupSettings.scss';

export function GroupSettings() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [deletingGroup, setDeletingGroup] = useState(null);
  const [alertDialog, setAlertDialog] = useState(null);

  const load = () => {
    setLoading(true);
    getGroups()
      .then((res) => {
        const all = res.data?.groups || [];
        setGroups(all.filter((g) => !g.role || g.role === 'OWNER'));
      })
      .catch(() => setGroups([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const animalCount = (group) => group._count?.animals ?? group.animalCount ?? 0;

  const startEdit = (group) => {
    setEditingId(group.id);
    setEditingName(group.name);
    setError('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  const saveEdit = async (group) => {
    const trimmed = editingName.trim();
    if (!trimmed || trimmed === group.name) {
      cancelEdit();
      return;
    }
    try {
      await updateGroup(group.id, trimmed);
      cancelEdit();
      load();
    } catch (err) {
      setError(err?.response?.data?.error || 'No se ha podido actualizar el grupo');
    }
  };

  const handleDelete = (group) => {
    if (animalCount(group) > 0) {
      setAlertDialog({
        title: 'No se puede eliminar',
        message: 'No se puede eliminar un grupo con animales asignados.',
      });
      return;
    }
    setDeletingGroup(group);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) return;
    setCreating(true);
    setError('');
    try {
      await createGroup(trimmed);
      setNewName('');
      load();
    } catch (err) {
      setError(err?.response?.data?.error || 'No se ha podido crear el grupo');
    } finally {
      setCreating(false);
    }
  };

  return (
    <section className="group-settings">
      <h2 className="group-settings__title">Grupos</h2>

      {loading ? (
        <p className="group-settings__loading" role="status" aria-live="polite">Cargando…</p>
      ) : groups.length === 0 ? (
        <p className="group-settings__empty">Aún no tienes grupos. Crea el primero abajo.</p>
      ) : (
        <ul className="group-settings__list">
          {groups.map((group) => {
            const isEditing = editingId === group.id;
            return (
              <li className="group-settings__row" key={group.id}>
                {isEditing ? (
                  <input
                    className="group-settings__edit-input"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={() => saveEdit(group)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        saveEdit(group);
                      } else if (e.key === 'Escape') {
                        cancelEdit();
                      }
                    }}
                    autoFocus
                  />
                ) : (
                  <div className="group-settings__row-body">
                    <span className="group-settings__name">{group.name}</span>
                    <span className="group-settings__count">{animalCount(group)} animales</span>
                  </div>
                )}
                <div className="group-settings__row-actions">
                  <button
                    type="button"
                    className="group-settings__icon-btn"
                    onClick={() => startEdit(group)}
                    aria-label="Editar grupo"
                  >
                    <Edit size={14} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="group-settings__icon-btn group-settings__icon-btn--danger"
                    onClick={() => handleDelete(group)}
                    aria-label="Eliminar grupo"
                  >
                    <Trash size={14} aria-hidden="true" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <form className="group-settings__add" onSubmit={handleCreate}>
        <input
          className="group-settings__add-input"
          type="text"
          placeholder="Nombre del nuevo grupo"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          maxLength={100}
        />
        <button
          type="submit"
          className="group-settings__add-btn"
          disabled={creating || !newName.trim()}
        >
          <Plus size={14} aria-hidden="true" />
          <span>Añadir</span>
        </button>
      </form>

      {error && <p className="group-settings__error" role="alert">{error}</p>}

      <ConfirmDialog
        open={!!deletingGroup}
        title="Eliminar grupo"
        message={deletingGroup ? `¿Eliminar el grupo "${deletingGroup.name}"?` : ''}
        confirmText="Eliminar"
        danger
        onClose={() => setDeletingGroup(null)}
        onConfirm={async () => {
          try {
            await deleteGroup(deletingGroup.id);
            load();
          } catch (err) {
            setError(err?.response?.data?.error || 'No se ha podido eliminar el grupo');
          }
        }}
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
