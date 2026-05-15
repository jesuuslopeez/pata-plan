import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import './ConfirmDialog.scss';

export function ConfirmDialog({
  open,
  title = '¿Confirmar?',
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  danger = false,
  hideCancel = false,
  onConfirm,
  onClose,
}) {
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) setBusy(false);
  }, [open]);

  if (!open) return null;

  const handleConfirm = async () => {
    if (!onConfirm) {
      onClose?.();
      return;
    }
    setBusy(true);
    try {
      await onConfirm();
      onClose?.();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="confirm-dialog" role="dialog" aria-modal="true">
      <div className="confirm-dialog__overlay" onClick={onClose} />
      <div className="confirm-dialog__content">
        <header className="confirm-dialog__header">
          <h2 className="confirm-dialog__title">{title}</h2>
          <button
            type="button"
            className="confirm-dialog__close"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </header>

        {message && <p className="confirm-dialog__message">{message}</p>}

        <footer className="confirm-dialog__footer">
          {!hideCancel && (
            <button
              type="button"
              className="confirm-dialog__btn confirm-dialog__btn--secondary"
              onClick={onClose}
              disabled={busy}
            >
              {cancelText}
            </button>
          )}
          <button
            type="button"
            className={`confirm-dialog__btn ${
              danger ? 'confirm-dialog__btn--danger' : 'confirm-dialog__btn--primary'
            }`}
            onClick={handleConfirm}
            disabled={busy}
          >
            {busy ? 'Procesando…' : confirmText}
          </button>
        </footer>
      </div>
    </div>
  );
}
