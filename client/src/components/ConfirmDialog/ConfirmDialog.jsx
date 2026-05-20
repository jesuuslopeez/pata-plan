import { useEffect, useId, useState } from 'react';
import { X } from 'lucide-react';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { useFocusTrap } from '../../hooks/useFocusTrap';
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
  const titleId = useId();
  const messageId = useId();
  const containerRef = useFocusTrap(open);

  useEffect(() => {
    if (!open) setBusy(false);
  }, [open]);

  useEscapeKey(onClose, open && !busy);

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
    <div
      className="confirm-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={message ? messageId : undefined}
    >
      <div className="confirm-dialog__overlay" onClick={onClose} aria-hidden="true" />
      <div className="confirm-dialog__content" ref={containerRef}>
        <header className="confirm-dialog__header">
          <h2 className="confirm-dialog__title" id={titleId}>{title}</h2>
          <button
            type="button"
            className="confirm-dialog__close"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </header>

        {message && <p className="confirm-dialog__message" id={messageId}>{message}</p>}

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
