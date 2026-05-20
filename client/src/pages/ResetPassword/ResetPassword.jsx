import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { resetPasswordRequest } from '../../services/auth.service';
import { usePageTitle } from '../../hooks/usePageTitle';
import './ResetPassword.scss';

export function ResetPassword() {
  usePageTitle('Nueva contraseña');
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!token) {
      setError('Falta el token de la URL.');
      return;
    }
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setSubmitting(true);
    try {
      await resetPasswordRequest(token, password);
      setDone(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err?.response?.data?.error || 'No se ha podido cambiar la contraseña.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="reset-password">
      <div className="reset-password__left">
        <div className="reset-password__brand">
          <img className="reset-password__logo" src="/pataplan.png" alt="PataPlan logo" />
          <p className="reset-password__tagline">La salud de tus animales, bajo control</p>
        </div>
      </div>
      <div className="reset-password__right">
        <div className="reset-password__form-wrap">
          {!token ? (
            <>
              <div className="reset-password__header">
                <h2 className="reset-password__title">Enlace no válido</h2>
                <p className="reset-password__subtitle">
                  No has llegado aquí desde un enlace de restablecimiento. Pide uno nuevo
                  desde "¿Olvidaste tu contraseña?".
                </p>
              </div>
              <p className="reset-password__link">
                <Link to="/forgot-password">Solicitar enlace</Link>
                {' · '}
                <Link to="/login">Volver al inicio</Link>
              </p>
            </>
          ) : done ? (
            <>
              <div className="reset-password__header" role="status">
                <h2 className="reset-password__title">¡Contraseña actualizada!</h2>
                <p className="reset-password__subtitle">
                  Te redirigimos al inicio de sesión…
                </p>
              </div>
            </>
          ) : (
            <form className="reset-password__form" onSubmit={handleSubmit} noValidate>
              <div className="reset-password__header">
                <h2 className="reset-password__title">Nueva contraseña</h2>
                <p className="reset-password__subtitle">
                  Elige una contraseña de al menos 8 caracteres.
                </p>
              </div>

              {error && <div className="reset-password__alert" role="alert">{error}</div>}

              <div className="reset-password__field">
                <label className="reset-password__label" htmlFor="password">
                  Nueva contraseña
                </label>
                <input
                  id="password"
                  type="password"
                  className="reset-password__input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  aria-required="true"
                  aria-invalid={error ? 'true' : 'false'}
                />
              </div>

              <div className="reset-password__field">
                <label className="reset-password__label" htmlFor="confirm">
                  Confirmar contraseña
                </label>
                <input
                  id="confirm"
                  type="password"
                  className="reset-password__input"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  aria-required="true"
                  aria-invalid={error ? 'true' : 'false'}
                />
              </div>

              <button
                type="submit"
                className="reset-password__button"
                disabled={submitting}
              >
                {submitting ? 'Guardando…' : 'Cambiar contraseña'}
              </button>

              <p className="reset-password__link">
                <Link to="/login">Volver al inicio de sesión</Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
