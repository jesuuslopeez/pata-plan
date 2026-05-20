import { useEffect, useId, useState } from 'react';
import { X } from 'lucide-react';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import './RenameDocumentModal.scss';

export function RenameDocumentModal({ open, initialName = '', onClose, onSubmit }) {
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const titleId = useId();
  const containerRef = useFocusTrap(open);

  useEscapeKey(onClose, open);

  useEffect(() => {
    if (!open) return;
    setName(initialName);
    setError('');
    setSubmitting(false);
  }, [open, initialName]);

  if (!open) return null;

  const trimmed = name.trim();
  const isValid = trimmed.length > 0 && trimmed.length <= 255;
  const hasChanged = trimmed !== initialName.trim();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid || !hasChanged) return;
    setSubmitting(true);
    setError('');
    try {
      await onSubmit(trimmed);
      onClose?.();
    } catch (err) {
      setError(err?.response?.data?.error || 'No se ha podido renombrar el documento');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rename-document-modal" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <div className="rename-document-modal__overlay" onClick={onClose} aria-hidden="true" />
      <div className="rename-document-modal__content" ref={containerRef}>
        <header className="rename-document-modal__header">
          <h2 id={titleId} className="rename-document-modal__title">Renombrar documento</h2>
          <button
            type="button"
            className="rename-document-modal__close"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </header>

        <form className="rename-document-modal__form" onSubmit={handleSubmit}>
          <div className="rename-document-modal__field">
            <label className="rename-document-modal__label" htmlFor="document-rename-name">
              Nombre del documento
            </label>
            <input
              id="document-rename-name"
              type="text"
              maxLength={255}
              autoFocus
              className="rename-document-modal__input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              aria-required="true"
            />
          </div>

          {error && <p className="rename-document-modal__error" role="alert">{error}</p>}

          <footer className="rename-document-modal__footer">
            <button
              type="button"
              className="rename-document-modal__btn rename-document-modal__btn--secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rename-document-modal__btn rename-document-modal__btn--primary"
              disabled={submitting || !isValid || !hasChanged}
            >
              {submitting ? 'Guardando…' : 'Guardar'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
