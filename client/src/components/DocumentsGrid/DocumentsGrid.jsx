import { useEffect, useState } from 'react';
import { FileText, Pencil, Trash, Upload } from 'lucide-react';
import {
  getAnimalDocuments,
  deleteDocument,
  updateDocument,
} from '../../services/animal.service';
import { DocumentUpload } from '../DocumentUpload/DocumentUpload';
import { DocumentPreview } from '../DocumentPreview/DocumentPreview';
import { ConfirmDialog } from '../ConfirmDialog/ConfirmDialog';
import { RenameDocumentModal } from '../RenameDocumentModal/RenameDocumentModal';
import { resolveAssetUrl } from '../../utils/assetUrl';
import './DocumentsGrid.scss';

const SKELETON_COUNT = 4;

function isImage(fileType) {
  return typeof fileType === 'string' && fileType.includes('image');
}

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function DocumentsGrid({ animalId }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [renameDoc, setRenameDoc] = useState(null);
  const [deleteDoc, setDeleteDoc] = useState(null);

  const load = () => {
    setLoading(true);
    getAnimalDocuments(animalId)
      .then((res) => setDocuments(res.data?.documents || []))
      .catch(() => setDocuments([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!animalId) return;
    load();
  }, [animalId]);

  const handleCardClick = (doc) => {
    if (isImage(doc.fileType)) {
      setPreviewDoc(doc);
    } else {
      window.open(resolveAssetUrl(doc.fileUrl), '_blank', 'noopener,noreferrer');
    }
  };

  const confirmDelete = async () => {
    if (!deleteDoc) return;
    await deleteDocument(deleteDoc.id);
    setDocuments((prev) => prev.filter((d) => d.id !== deleteDoc.id));
  };

  const submitRename = async (filename) => {
    if (!renameDoc) return;
    const res = await updateDocument(renameDoc.id, { filename });
    const updated = res.data?.document;
    setDocuments((prev) =>
      prev.map((d) => (d.id === renameDoc.id ? { ...d, ...(updated || { filename }) } : d))
    );
  };

  return (
    <div className="documents-grid">
      <header className="documents-grid__header">
        <h3 className="documents-grid__title">Documentos</h3>
        <button
          type="button"
          className="documents-grid__upload-btn"
          onClick={() => setUploadOpen(true)}
        >
          <Upload size={16} aria-hidden="true" />
          <span>Subir documento</span>
        </button>
      </header>

      {loading ? (
        <div className="documents-grid__list">
          {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
            <div key={i} className="documents-grid__skeleton" aria-hidden="true" />
          ))}
        </div>
      ) : documents.length === 0 ? (
        <div className="documents-grid__empty">
          <FileText className="documents-grid__empty-icon" size={48} aria-hidden="true" />
          <p className="documents-grid__empty-text">Sin documentos</p>
          <button
            type="button"
            className="documents-grid__upload-btn"
            onClick={() => setUploadOpen(true)}
          >
            <Upload size={16} />
            <span>Subir documento</span>
          </button>
        </div>
      ) : (
        <div className="documents-grid__list">
          {documents.map((doc) => (
            <article
              key={doc.id}
              className="document-card"
              onClick={() => handleCardClick(doc)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleCardClick(doc);
                }
              }}
            >
              <div className="document-card__actions">
                <button
                  type="button"
                  className="document-card__action document-card__action--rename"
                  onClick={(e) => {
                    e.stopPropagation();
                    setRenameDoc(doc);
                  }}
                  aria-label="Renombrar documento"
                  title="Renombrar"
                >
                  <Pencil size={14} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="document-card__action document-card__action--delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteDoc(doc);
                  }}
                  aria-label="Eliminar documento"
                  title="Eliminar"
                >
                  <Trash size={14} aria-hidden="true" />
                </button>
              </div>

              <div className="document-card__preview">
                {isImage(doc.fileType) ? (
                  <img
                    src={resolveAssetUrl(doc.fileUrl)}
                    alt={doc.filename}
                    className="document-card__thumb"
                    loading="lazy"
                  />
                ) : (
                  <div className="document-card__pdf">
                    <FileText size={40} className="document-card__pdf-icon" aria-hidden="true" />
                    <span className="document-card__pdf-label">PDF</span>
                  </div>
                )}
              </div>

              <div className="document-card__info">
                <p className="document-card__name" title={doc.filename}>
                  {doc.filename}
                </p>
                <p className="document-card__date">{formatDate(doc.uploadedAt)}</p>
                {doc.description && (
                  <p className="document-card__desc">{doc.description}</p>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      <DocumentUpload
        open={uploadOpen}
        animalId={animalId}
        onClose={() => setUploadOpen(false)}
        onUploaded={() => {
          setUploadOpen(false);
          load();
        }}
      />

      <DocumentPreview
        open={!!previewDoc}
        document={previewDoc}
        onClose={() => setPreviewDoc(null)}
      />

      <RenameDocumentModal
        open={!!renameDoc}
        initialName={renameDoc?.filename || ''}
        onClose={() => setRenameDoc(null)}
        onSubmit={submitRename}
      />

      <ConfirmDialog
        open={!!deleteDoc}
        title="Eliminar documento"
        message={
          deleteDoc
            ? `¿Seguro que quieres eliminar "${deleteDoc.filename}"? Esta acción no se puede deshacer.`
            : ''
        }
        confirmText="Eliminar"
        danger
        onClose={() => setDeleteDoc(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
