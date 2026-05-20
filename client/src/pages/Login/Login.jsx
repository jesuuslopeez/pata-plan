import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { resendVerificationRequest } from '../../services/auth.service';
import { usePageTitle } from '../../hooks/usePageTitle';
import './Login.scss';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function Login() {
  usePageTitle('Iniciar sesión');
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [resendStatus, setResendStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const errs = {};
    if (!email.trim()) {
      errs.email = 'El email es obligatorio';
    } else if (!EMAIL_REGEX.test(email)) {
      errs.email = 'Formato de email no válido';
    }
    if (!password) {
      errs.password = 'La contraseña es obligatoria';
    } else if (password.length < 8) {
      errs.password = 'Mínimo 8 caracteres';
    }
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    setUnverifiedEmail('');
    setResendStatus('');
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    try {
      await login(email, password, rememberMe);
    } catch (err) {
      const data = err.response?.data;
      if (data?.code === 'EMAIL_NOT_VERIFIED') {
        setUnverifiedEmail(data.email || email.trim());
        setApiError(data.error || 'Debes verificar tu correo antes de iniciar sesión.');
      } else {
        setApiError(data?.error || 'Error al iniciar sesión');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!unverifiedEmail) return;
    setResendStatus('sending');
    try {
      await resendVerificationRequest(unverifiedEmail);
      setResendStatus('ok');
    } catch {
      setResendStatus('error');
    }
  };

  return (
    <div className="login">
      <div className="login__left" aria-hidden="true">
        <div className="login__brand">
          <img className="login__logo" src="/pataplan.png" alt="PataPlan logo" width="180" height="60" />
          <p className="login__tagline">La salud de tus animales, bajo control</p>
        </div>
      </div>
      <div className="login__right">
        <form className="login__form" onSubmit={handleSubmit} noValidate aria-labelledby="login-title">
          <div className="login__header">
            <h2 className="login__title" id="login-title">Iniciar sesión</h2>
            <p className="login__subtitle">Introduce tus credenciales para acceder</p>
          </div>

          {apiError && (
            <div className="login__alert" role="alert">
              <span>{apiError}</span>
              {unverifiedEmail && (
                <button
                  type="button"
                  className="login__resend"
                  onClick={handleResend}
                  disabled={resendStatus === 'sending'}
                >
                  {resendStatus === 'sending' ? 'Reenviando…' : 'Reenviar correo de verificación'}
                </button>
              )}
              {resendStatus === 'ok' && (
                <span className="login__resend-status">Correo reenviado. Revisa tu bandeja.</span>
              )}
              {resendStatus === 'error' && (
                <span className="login__resend-status">No se ha podido reenviar.</span>
              )}
            </div>
          )}

          <div className="login__field">
            <label className="login__label" htmlFor="email">
              Correo electrónico <span aria-hidden="true">*</span>
            </label>
            <input
              className={`login__input ${errors.email ? 'login__input--error' : ''}`}
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              aria-required="true"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'login-email-error' : undefined}
              autoComplete="email"
            />
            {errors.email && (
              <span className="login__error" id="login-email-error" role="alert">
                {errors.email}
              </span>
            )}
          </div>

          <div className="login__field">
            <label className="login__label" htmlFor="password">
              Contraseña <span aria-hidden="true">*</span>
            </label>
            <input
              className={`login__input ${errors.password ? 'login__input--error' : ''}`}
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              aria-required="true"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'login-password-error' : undefined}
              autoComplete="current-password"
            />
            {errors.password && (
              <span className="login__error" id="login-password-error" role="alert">
                {errors.password}
              </span>
            )}
          </div>

          <div className="login__options">
            <label className="login__remember" htmlFor="remember-me">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>Mantener sesión iniciada</span>
            </label>
            <Link to="/forgot-password" className="login__forgot">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <button className="login__button" type="submit" disabled={submitting}>
            {submitting ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </button>

          <p className="login__link">
            ¿No tienes cuenta? <Link to="/register">Regístrate</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
