import { useEffect, useRef, useState } from 'react';
import { PawPrint, Upload, X } from 'lucide-react';
import { createAnimal, updateAnimal } from '../../services/animal.service';
import { resolveAssetUrl } from '../../utils/assetUrl';
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

export function AddAnimalModal({ open, groups, initial, onClose, onSaved }) {
  const isEdit = !!initial;
  const [form, setForm] = useState(EMPTY_FORM);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [removeExistingPhoto, setRemoveExistingPhoto] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setForm(initial ? fromInitial(initial) : EMPTY_FORM);
    setPhotoFile(null);
    setPhotoPreview(initial?.photoUrl ? resolveAssetUrl(initial.photoUrl) : null);
    setRemoveExistingPhoto(false);
    setError(null);
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

  const isValid = form.name.trim() && form.species && form.groupId;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) return;
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
    <div className="add-animal-modal" role="dialog" aria-modal="true">
      <div className="add-animal-modal__overlay" onClick={onClose} />
      <div className="add-animal-modal__content">
        <header className="add-animal-modal__header">
          <h2 className="add-animal-modal__title">
            {isEdit ? 'Editar animal' : 'Añadir animal'}
          </h2>
          <button
            type="button"
            className="add-animal-modal__close"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </header>

        <form className="add-animal-modal__form" onSubmit={handleSubmit}>
          <div className="add-animal-modal__photo">
            <div className="add-animal-modal__photo-preview">
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="Vista previa"
                  className="add-animal-modal__photo-img"
                />
              ) : (
                <PawPrint size={32} className="add-animal-modal__photo-placeholder" />
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
                <Upload size={14} />
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
              Nombre *
            </label>
            <input
              id="animal-name"
              type="text"
              className="add-animal-modal__input"
              value={form.name}
              onChange={handleChange('name')}
              required
              autoFocus
            />
          </div>

          <div className="add-animal-modal__row">
            <div className="add-animal-modal__field">
              <label className="add-animal-modal__label" htmlFor="animal-species">
                Especie *
              </label>
              <select
                id="animal-species"
                className="add-animal-modal__input"
                value={form.species}
                onChange={handleChange('species')}
                required
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
                Sexo *
              </label>
              <select
                id="animal-sex"
                className="add-animal-modal__input"
                value={form.sex}
                onChange={handleChange('sex')}
                required
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
              Grupo *
            </label>
            <select
              id="animal-group"
              className="add-animal-modal__input"
              value={form.groupId}
              onChange={handleChange('groupId')}
              required
            >
              <option value="" disabled>
                Selecciona un grupo
              </option>
              {groups?.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
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

          {error && <p className="add-animal-modal__error">{error}</p>}

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
