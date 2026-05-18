import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmDialog } from './ConfirmDialog';

describe('ConfirmDialog', () => {
  it('does not render anything when open is false', () => {
    const { container } = render(<ConfirmDialog open={false} message="hola" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders title and message when open', () => {
    render(<ConfirmDialog open title="¿Borrar?" message="Esta acción no se puede deshacer." />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('¿Borrar?')).toBeInTheDocument();
    expect(screen.getByText(/no se puede deshacer/)).toBeInTheDocument();
  });

  it('calls onConfirm then onClose when the confirm button is clicked', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn().mockResolvedValue();
    const onClose = vi.fn();

    render(<ConfirmDialog open onConfirm={onConfirm} onClose={onClose} confirmText="Borrar" />);

    await user.click(screen.getByRole('button', { name: 'Borrar' }));

    expect(onConfirm).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when the cancel button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<ConfirmDialog open onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('hides the cancel button when hideCancel is true', () => {
    render(<ConfirmDialog open hideCancel />);
    expect(screen.queryByRole('button', { name: 'Cancelar' })).not.toBeInTheDocument();
  });

  it('applies the danger style when the danger flag is set', () => {
    render(<ConfirmDialog open danger confirmText="Eliminar" />);
    expect(screen.getByRole('button', { name: 'Eliminar' })).toHaveClass(
      'confirm-dialog__btn--danger'
    );
  });

  it('exposes a close button with an accessible label', () => {
    render(<ConfirmDialog open />);
    expect(screen.getByRole('button', { name: 'Cerrar' })).toBeInTheDocument();
  });

  it('closes when the Escape key is pressed', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<ConfirmDialog open onClose={onClose} />);

    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });
});
