import { useEffect, useId, useRef, useState } from 'react';
import { PawPrint, Upload, X, FolderPlus, Sparkles } from 'lucide-react';
import { createAnimal, updateAnimal } from '../../services/animal.service';
import { createGroup } from '../../services/group.service';
import { resolveAssetUrl } from '../../utils/assetUrl';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import './AddAnimalModal.scss';

const SPECIES_OPTIONS = [
  { value: 'DOG', label: 'Perro' },
  { value: 'CAT', label: 'Gato' },
  { value: 'OTHER', label: 'Otro' },
];

const SEX_OPTIONS = [
  { value: 'MALE', label: 'Macho' },
  { value: 'FEMALE', label: 'Hembra' },
  { value: 'UNKNOWN', label: 'Desconocido' },
];

const EMPTY_FORM = {
  name: '',
  species: '',
  sex: 'UNKNOWN',
  groupId: '',
  breed: '',
  dateOfBirth: '',
  microchip: '',
  notes: '',
};

const toDateInput = (iso) => (iso ? new Date(iso).toISOString().slice(0, 10) : '');

const todayIso = () => new Date().toISOString().slice(0, 10);

const fromInitial = (initial) => ({
  name: initial.name ?? '',
  species: initial.species ?? '',
  sex: initial.sex ?? 'UNKNOWN',
  groupId: String(initial.groupId ?? initial.group?.id ?? ''),
  breed: initial.breed ?? '',
  dateOfBirth: toDateInput(initial.dateOfBirth),
  microchip: initial.microchip ?? '',
  notes: initial.notes ?? '',
});

export function AddAnimalModal({ open, groups, initial, onClose, onSaved, onGroupCreated }) {
  const isEdit = !!initial;
  const [form, setForm] = useState(EMPTY_FORM);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [removeExistingPhoto, setRemoveExistingPhoto] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [groupError, setGroupError] = useState(null);

  useEscapeKey(onClose, open);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const titleId = useId();
  const errorId = useId();
  const containerRef = useFocusTrap(open);

  const noGroups = !isEdit && (!groups || groups.length === 0);

  useEffect(() => {
    if (!open) return;
    setForm(initial ? fromInitial(initial) : EMPTY_FORM);
    setPhotoFile(null);
    setPhotoPreview(initial?.photoUrl ? resolveAssetUrl(initial.photoUrl) : null);
    setRemoveExistingPhoto(false);
    setError(null);
    setNewGroupName('');
    setGroupError(null);
  }, [open, initial]);

  useEffect(() => {
    if (!photoFile) return undefined;
    const url = URL.createObjectURL(photoFile);
    setPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photoFile]);

  if (!open) return null;

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('La foto debe ser una imagen (jpeg, jpg, png o webp)');
      return;
    }
    setError(null);
    setPhotoFile(file);
    setRemoveExistingPhoto(false);
  };

  const clearPhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (initial?.photoUrl) setRemoveExistingPhoto(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCreateGroup = async () => {
    const trimmed = newGroupName.trim();
    if (!trimmed) {
      setGroupError('El nombre del grupo es obligatorio');
      return;
    }
    setCreatingGroup(true);
    setGroupError(null);
    try {
      const res = await createGroup(trimmed);
      const created = res.data?.group;
      setNewGroupName('');
      if (created) {
        setForm((prev) => ({ ...prev, groupId: String(created.id) }));
        onGroupCreated?.(created);
      }
    } catch (err) {
      setGroupError(err?.response?.data?.error || 'No se ha podido crear el grupo');
    } finally {
      setCreatingGroup(false);
    }
  };

  const isValid = form.name.trim() && form.species && form.groupId;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) return;
    if (form.dateOfBirth && form.dateOfBirth > todayIso()) {
      setError('La fecha de nacimiento no puede ser futura');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        name: form.name.trim(),
        species: form.species,
        sex: form.sex,
        groupId: form.groupId,
        breed: form.breed.trim(),
        dateOfBirth: form.dateOfBirth,
        microchip: form.microchip.trim(),
        notes: form.notes.trim(),
      };
      if (photoFile) payload.photo = photoFile;
      if (isEdit && removeExistingPhoto && !photoFile) payload.removePhoto = 'true';
      const res = isEdit
        ? await updateAnimal(initial.id, payload)
        : await createAnimal(payload);
      onSaved?.(res.data?.animal);
      onClose?.();
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          (isEdit ? 'No se ha podido actualizar el animal' : 'No se ha podido crear el animal')
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="add-animal-modal" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <div className="add-animal-modal__overlay" onClick={onClose} aria-hidden="true" />
      <div className="add-animal-modal__content" ref={containerRef}>
        <header className="add-animal-modal__header">
          <h2 className="add-animal-modal__title" id={titleId}>
            {isEdit ? 'Editar animal' : 'Añadir animal'}
          </h2>
          <button
            type="button"
            className="add-animal-modal__close"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </header>

        <form className="add-animal-modal__form" onSubmit={handleSubmit}>
          <div className="add-animal-modal__photo">
            <div className="add-animal-modal__photo-preview" aria-hidden={!photoPreview}>
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt={isEdit && form.name ? `Foto de ${form.name}` : 'Vista previa de la foto'}
                  className="add-animal-modal__photo-img"
                  decoding="async"
                />
              ) : (
                <PawPrint size={32} className="add-animal-modal__photo-placeholder" aria-hidden="true" />
              )}
            </div>
            <div className="add-animal-modal__photo-actions">
              <input
                ref={fileInputRef}
                id="animal-photo"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                className="add-animal-modal__photo-input"
                onChange={handlePhotoChange}
              />
              <button
                type="button"
                className="add-animal-modal__btn add-animal-modal__btn--secondary"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={14} aria-hidden="true" />
                <span>{photoPreview ? 'Cambiar foto' : 'Subir foto'}</span>
              </button>
              {photoPreview && (
                <button
                  type="button"
                  className="add-animal-modal__photo-clear"
                  onClick={clearPhoto}
                >
                  Quitar
                </button>
              )}
            </div>
          </div>

          <div className="add-animal-modal__field">
            <label className="add-animal-modal__label" htmlFor="animal-name">
              Nombre <span aria-hidden="true">*</span>
            </label>
            <input
              id="animal-name"
              type="text"
              className="add-animal-modal__input"
              value={form.name}
              onChange={handleChange('name')}
              required
              aria-required="true"
              autoFocus
            />
          </div>

          <div className="add-animal-modal__row">
            <div className="add-animal-modal__field">
              <label className="add-animal-modal__label" htmlFor="animal-species">
                Especie <span aria-hidden="true">*</span>
              </label>
              <select
                id="animal-species"
                className="add-animal-modal__input"
                value={form.species}
                onChange={handleChange('species')}
                required
                aria-required="true"
              >
                <option value="" disabled>
                  Selecciona una especie
                </option>
                {SPECIES_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="add-animal-modal__field">
              <label className="add-animal-modal__label" htmlFor="animal-sex">
                Sexo <span aria-hidden="true">*</span>
              </label>
              <select
                id="animal-sex"
                className="add-animal-modal__input"
                value={form.sex}
                onChange={handleChange('sex')}
                required
                aria-required="true"
              >
                {SEX_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="add-animal-modal__field">
            <label className="add-animal-modal__label" htmlFor="animal-group">
              Grupo <span aria-hidden="true">*</span>
            </label>
            <select
              id="animal-group"
              className="add-animal-modal__input"
              value={form.groupId}
              onChange={handleChange('groupId')}
              required
              aria-required="true"
              disabled={noGroups}
            >
              <option value="" disabled>
                {noGroups ? 'Crea tu primer grupo abajo' : 'Selecciona un grupo'}
              </option>
              {groups?.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>

            {noGroups && (
              <div className="add-animal-modal__group-hint" role="region" aria-label="Crear grupo">
                <div className="add-animal-modal__group-hint-head">
                  <span className="add-animal-modal__group-hint-icon" aria-hidden="true">
                    <Sparkles size={18} />
                  </span>
                  <div>
                    <p className="add-animal-modal__group-hint-title">
                      Empieza creando un grupo
                    </p>
                    <p className="add-animal-modal__group-hint-body">
                      Los grupos organizan a tus animales (ej. <em>Casa</em>, <em>Refugio</em>).
                      Necesitas al menos uno para añadir animales.
                    </p>
                  </div>
                </div>
                <div className="add-animal-modal__group-hint-form">
                  <input
                    type="text"
                    className="add-animal-modal__input"
                    placeholder="Nombre del grupo (ej. Casa)"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCreateGroup();
                      }
                    }}
                    maxLength={50}
                    disabled={creatingGroup}
                  />
                  <button
                    type="button"
                    className="add-animal-modal__btn add-animal-modal__btn--primary"
                    onClick={handleCreateGroup}
                    disabled={creatingGroup || !newGroupName.trim()}
                  >
                    <FolderPlus size={16} aria-hidden="true" />
                    <span>{creatingGroup ? 'Creando…' : 'Crear grupo'}</span>
                  </button>
                </div>
                {groupError && (
                  <p className="add-animal-modal__group-hint-error" role="alert">{groupError}</p>
                )}
              </div>
            )}
          </div>

          <div className="add-animal-modal__row">
            <div className="add-animal-modal__field">
              <label className="add-animal-modal__label" htmlFor="animal-breed">
                Raza
              </label>
              <input
                id="animal-breed"
                type="text"
                className="add-animal-modal__input"
                value={form.breed}
                onChange={handleChange('breed')}
              />
            </div>

            <div className="add-animal-modal__field">
              <label className="add-animal-modal__label" htmlFor="animal-dob">
                Fecha de nacimiento
              </label>
              <input
                id="animal-dob"
                type="date"
                className="add-animal-modal__input"
                value={form.dateOfBirth}
                onChange={handleChange('dateOfBirth')}
                max={todayIso()}
              />
            </div>
          </div>

          <div className="add-animal-modal__field">
            <label className="add-animal-modal__label" htmlFor="animal-microchip">
              Microchip
            </label>
            <input
              id="animal-microchip"
              type="text"
              className="add-animal-modal__input"
              value={form.microchip}
              onChange={handleChange('microchip')}
            />
          </div>

          <div className="add-animal-modal__field">
            <label className="add-animal-modal__label" htmlFor="animal-notes">
              Notas
            </label>
            <textarea
              id="animal-notes"
              className="add-animal-modal__input add-animal-modal__input--textarea"
              value={form.notes}
              onChange={handleChange('notes')}
              rows={3}
            />
          </div>

          {error && <p className="add-animal-modal__error" id={errorId} role="alert">{error}</p>}

          <footer className="add-animal-modal__footer">
            <button
              type="button"
              className="add-animal-modal__btn add-animal-modal__btn--secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="add-animal-modal__btn add-animal-modal__btn--primary"
              disabled={submitting || !isValid}
            >
              {submitting ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear animal'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
