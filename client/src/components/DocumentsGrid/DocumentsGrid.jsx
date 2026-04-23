import { FileText, Image as ImageIcon, Trash } from 'lucide-react';
import './DocumentsGrid.scss';

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function getIcon(fileType) {
  if (fileType?.startsWith('image/')) return ImageIcon;
  return FileText;
}

export function DocumentsGrid({ documents, onDelete }) {
  if (!documents || documents.length === 0) {
    return null;
  }

  return (
    <div className="documents-grid">
      {documents.map((doc) => {
        const Icon = getIcon(doc.fileType);
        return (
          <article key={doc.id} className="documents-grid__card">
            <button
              className="documents-grid__delete"
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(doc.id);
              }}
              type="button"
              title="Eliminar documento"
            >
              <Trash size={14} />
            </button>
            <a
              className="documents-grid__link"
              href={doc.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Icon className="documents-grid__icon" size={32} />
              <span className="documents-grid__name" title={doc.filename}>
                {doc.filename}
              </span>
              <span className="documents-grid__date">{formatDate(doc.uploadedAt)}</span>
            </a>
          </article>
        );
      })}
    </div>
  );
}
