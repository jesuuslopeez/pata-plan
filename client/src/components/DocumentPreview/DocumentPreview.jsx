import { useEffect } from 'react';
import { X } from 'lucide-react';
import { resolveAssetUrl } from '../../utils/assetUrl';
import './DocumentPreview.scss';

export function DocumentPreview({ open, document, onClose }) {
  useEffect(() => {
    if (!open) return undefined;
    const handler = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open || !document) return null;

  return (
    <div
      className="document-preview"
      role="dialog"
      aria-modal="true"
      aria-label={document.filename}
      onClick={onClose}
    >
      <button
        type="button"
        className="document-preview__close"
        onClick={onClose}
        aria-label="Cerrar"
      >
        <X size={24} aria-hidden="true" />
      </button>

      <figure className="document-preview__figure" onClick={(e) => e.stopPropagation()}>
        <img
          src={resolveAssetUrl(document.fileUrl)}
          alt={document.filename}
          className="document-preview__image"
          decoding="async"
        />
        <figcaption className="document-preview__caption">{document.filename}</figcaption>
      </figure>
    </div>
  );
}
