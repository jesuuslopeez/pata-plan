import { useEffect, useState } from 'react';
import { Edit, Plus, Trash } from 'lucide-react';
import {
  createGroup,
  deleteGroup,
  getGroups,
  updateGroup,
} from '../../services/group.service';
import './GroupSettings.scss';

export function GroupSettings() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    getGroups()
      .then((res) => setGroups(res.data?.groups || []))
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

  const handleDelete = async (group) => {
    if (animalCount(group) > 0) {
      window.alert('No se puede eliminar un grupo con animales');
      return;
    }
    if (!window.confirm(`¿Eliminar el grupo "${group.name}"?`)) return;
    try {
      await deleteGroup(group.id);
      load();
    } catch (err) {
      setError(err?.response?.data?.error || 'No se ha podido eliminar el grupo');
    }
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
        <p className="group-settings__loading">Cargando…</p>
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
                    <Edit size={14} />
                  </button>
                  <button
                    type="button"
                    className="group-settings__icon-btn group-settings__icon-btn--danger"
                    onClick={() => handleDelete(group)}
                    aria-label="Eliminar grupo"
                  >
                    <Trash size={14} />
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
          <Plus size={14} />
          <span>Añadir</span>
        </button>
      </form>

      {error && <p className="group-settings__error">{error}</p>}
    </section>
  );
}
