import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

const loginMock = vi.fn();
vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({ login: loginMock }),
}));

const resendMock = vi.fn();
vi.mock('../../services/auth.service', () => ({
  resendVerificationRequest: (...args) => resendMock(...args),
}));

import { Login } from './Login';

function renderLogin() {
  return render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );
}

describe('Login page', () => {
  beforeEach(() => {
    loginMock.mockReset();
    resendMock.mockReset();
  });

  it('shows validation errors when the form is submitted empty', async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    expect(screen.getByText('El email es obligatorio')).toBeInTheDocument();
    expect(screen.getByText('La contraseña es obligatoria')).toBeInTheDocument();
    expect(loginMock).not.toHaveBeenCalled();
  });

  it('rejects malformed emails and short passwords', async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText(/correo electrónico/i), 'no-es-email');
    await user.type(screen.getByLabelText(/contraseña/i), 'abc');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    expect(screen.getByText('Formato de email no válido')).toBeInTheDocument();
    expect(screen.getByText('Mínimo 8 caracteres')).toBeInTheDocument();
    expect(loginMock).not.toHaveBeenCalled();
  });

  it('calls login with the entered credentials when the form is valid', async () => {
    loginMock.mockResolvedValue();
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText(/correo electrónico/i), 'jesus@example.com');
    await user.type(screen.getByLabelText(/contraseña/i), 'superSecret1');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    expect(loginMock).toHaveBeenCalledWith('jesus@example.com', 'superSecret1', false);
  });

  it('shows the API error message when login fails', async () => {
    loginMock.mockRejectedValue({
      response: { data: { error: 'Credenciales inválidas' } },
    });
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText(/correo electrónico/i), 'jesus@example.com');
    await user.type(screen.getByLabelText(/contraseña/i), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    expect(await screen.findByText('Credenciales inválidas')).toBeInTheDocument();
  });

  it('offers the resend verification action when the account is not verified', async () => {
    loginMock.mockRejectedValue({
      response: {
        data: {
          code: 'EMAIL_NOT_VERIFIED',
          email: 'jesus@example.com',
          error: 'Debes verificar tu correo antes de iniciar sesión.',
        },
      },
    });
    resendMock.mockResolvedValue();

    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText(/correo electrónico/i), 'jesus@example.com');
    await user.type(screen.getByLabelText(/contraseña/i), 'superSecret1');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    const resendButton = await screen.findByRole('button', { name: /reenviar correo/i });
    await user.click(resendButton);
    expect(resendMock).toHaveBeenCalledWith('jesus@example.com');
  });
});
