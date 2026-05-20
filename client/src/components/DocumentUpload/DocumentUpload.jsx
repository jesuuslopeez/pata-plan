import { useEffect, useRef, useState } from 'react';
import { FileText, Upload, X } from 'lucide-react';
import { uploadDocument } from '../../services/animal.service';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import './DocumentUpload.scss';

const MAX_SIZE_BYTES = 10 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const ACCEPT_ATTR = ACCEPTED_TYPES.join(',');

const isImage = (type) => typeof type === 'string' && type.startsWith('image/');

export function DocumentUpload({ open, animalId, onClose, onUploaded }) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEscapeKey(onClose, open && !uploading);

  useEffect(() => {
    if (!open) return;
    setFile(null);
    setPreviewUrl(null);
    setDescription('');
    setError('');
    setDragging(false);
    setUploading(false);
  }, [open]);

  useEffect(() => {
    if (!file || !isImage(file.type)) {
      setPreviewUrl(null);
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  if (!open) return null;

  const acceptFile = (selected) => {
    if (!selected) return;
    if (!ACCEPTED_TYPES.includes(selected.type)) {
      setError('Formato no admitido. Sube imágenes JPEG, PNG, WebP o PDF.');
      return;
    }
    if (selected.size > MAX_SIZE_BYTES) {
      setError('El archivo supera el tamaño máximo de 10MB.');
      return;
    }
    setError('');
    setFile(selected);
  };

  const handleFileInput = (e) => {
    acceptFile(e.target.files?.[0]);
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    acceptFile(e.dataTransfer.files?.[0]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragging(false);
  };

  const handlePickClick = () => inputRef.current?.click();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Selecciona un archivo para subir.');
      return;
    }
    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (description.trim()) {
        formData.append('description', description.trim());
      }
      await uploadDocument(animalId, formData);
      onUploaded?.();
    } catch (err) {
      setError(err?.response?.data?.error || 'No se ha podido subir el documento.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className="document-upload"
      role="dialog"
      aria-modal="true"
      aria-label="Subir documento"
      onClick={onClose}
    >
      <form
        className="document-upload__panel"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <header className="document-upload__head">
          <h2 className="document-upload__title">Subir documento</h2>
          <button
            type="button"
            className="document-upload__close"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <div
          className={`document-upload__drop${dragging ? ' document-upload__drop--active' : ''}${
            file ? ' document-upload__drop--has-file' : ''
          }`}
          onClick={handlePickClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handlePickClick();
            }
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT_ATTR}
            className="document-upload__input"
            onChange={handleFileInput}
          />

          {file ? (
            <div className="document-upload__file">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt={file.name}
                  className="document-upload__file-thumb"
                />
              ) : (
                <FileText size={32} className="document-upload__file-icon" aria-hidden="true" />
              )}
              <div className="document-upload__file-info">
                <p className="document-upload__file-name" title={file.name}>
                  {file.name}
                </p>
                <p className="document-upload__file-meta">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB · Haz clic para cambiar
                </p>
              </div>
            </div>
          ) : (
            <>
              <Upload size={40} className="document-upload__drop-icon" aria-hidden="true" />
              <p className="document-upload__drop-title">
                Arrastra un archivo aquí o haz clic para seleccionar
              </p>
              <p className="document-upload__drop-hint">
                Imágenes (JPEG, PNG, WebP) y PDFs. Máximo 10MB
              </p>
            </>
          )}
        </div>

        <div className="document-upload__field">
          <label htmlFor="document-description" className="document-upload__label">
            Descripción (opcional)
          </label>
          <input
            id="document-description"
            type="text"
            className="document-upload__text-input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe el documento…"
            maxLength={300}
          />
        </div>

        {error && <p className="document-upload__error" role="alert">{error}</p>}

        <footer className="document-upload__actions">
          <button
            type="button"
            className="document-upload__btn document-upload__btn--secondary"
            onClick={onClose}
            disabled={uploading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="document-upload__btn document-upload__btn--primary"
            disabled={uploading || !file}
          >
            {uploading ? 'Subiendo…' : 'Subir'}
          </button>
        </footer>
      </form>
    </div>
  );
}
