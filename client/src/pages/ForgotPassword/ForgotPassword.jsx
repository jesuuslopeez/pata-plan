import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPasswordRequest } from '../../services/auth.service';
import { usePageTitle } from '../../hooks/usePageTitle';
import './ForgotPassword.scss';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ForgotPassword() {
  usePageTitle('Recuperar contraseña');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!EMAIL_REGEX.test(email)) {
      setError('Formato de correo no válido');
      return;
    }
    setSubmitting(true);
    try {
      await forgotPasswordRequest(email.trim());
      setSent(true);
    } catch (err) {
      setError(err?.response?.data?.error || 'No se ha podido enviar el correo.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="forgot-password">
      <div className="forgot-password__left">
        <div className="forgot-password__brand">
          <img className="forgot-password__logo" src="/pataplan.png" alt="PataPlan logo" width="180" height="60" />
          <p className="forgot-password__tagline">La salud de tus animales, bajo control</p>
        </div>
      </div>
      <div className="forgot-password__right">
        <div className="forgot-password__form-wrap">
          {sent ? (
            <>
              <div className="forgot-password__header" role="status">
                <h2 className="forgot-password__title">Revisa tu correo</h2>
                <p className="forgot-password__subtitle">
                  Si la dirección está registrada, te hemos enviado un enlace para
                  restablecer tu contraseña.
                </p>
              </div>
              <p className="forgot-password__link">
                <Link to="/login">Volver al inicio de sesión</Link>
              </p>
            </>
          ) : (
            <form className="forgot-password__form" onSubmit={handleSubmit} noValidate>
              <div className="forgot-password__header">
                <h2 className="forgot-password__title">¿Olvidaste tu contraseña?</h2>
                <p className="forgot-password__subtitle">
                  Introduce tu correo y te enviaremos un enlace para crear una nueva.
                </p>
              </div>

              {error && <div className="forgot-password__alert" role="alert">{error}</div>}

              <div className="forgot-password__field">
                <label className="forgot-password__label" htmlFor="email">
                  Correo electrónico
                </label>
                <input
                  id="email"
                  type="email"
                  className="forgot-password__input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  aria-required="true"
                  aria-invalid={error ? 'true' : 'false'}
                />
              </div>

              <button
                type="submit"
                className="forgot-password__button"
                disabled={submitting}
              >
                {submitting ? 'Enviando…' : 'Enviar enlace'}
              </button>

              <p className="forgot-password__link">
                <Link to="/login">Volver al inicio de sesión</Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
