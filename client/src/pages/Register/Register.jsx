import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { resendVerificationRequest } from '../../services/auth.service';
import './Register.scss';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function Register() {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [resendStatus, setResendStatus] = useState('');

  const validate = () => {
    const errs = {};
    if (!name.trim()) {
      errs.name = 'El nombre es obligatorio';
    } else if (name.trim().length < 2) {
      errs.name = 'Mínimo 2 caracteres';
    }
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
    if (!confirmPassword) {
      errs.confirmPassword = 'Confirma tu contraseña';
    } else if (password !== confirmPassword) {
      errs.confirmPassword = 'Las contraseñas no coinciden';
    }
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    try {
      const data = await register(name.trim(), email.trim(), password);
      if (data?.requiresVerification) {
        setRegisteredEmail(email.trim());
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Error al registrarse';
      setApiError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    setResendStatus('sending');
    try {
      await resendVerificationRequest(registeredEmail);
      setResendStatus('ok');
    } catch {
      setResendStatus('error');
    }
  };

  if (registeredEmail) {
    return (
      <div className="register">
        <div className="register__left">
          <div className="register__brand">
            <img className="register__logo" src="/pataplan.png" alt="PataPlan" />
            <p className="register__tagline">La salud de tus animales, bajo control</p>
          </div>
        </div>
        <div className="register__right">
          <div className="register__form">
            <div className="register__header">
              <h2 className="register__title">Revisa tu correo</h2>
              <p className="register__subtitle">
                Hemos enviado un enlace de verificación a <strong>{registeredEmail}</strong>.
                Haz clic en él para activar tu cuenta.
              </p>
            </div>

            <p className="register__hint">
              ¿No te ha llegado? Mira en spam o vuelve a enviarlo.
            </p>

            <button
              type="button"
              className="register__button"
              onClick={handleResend}
              disabled={resendStatus === 'sending'}
            >
              {resendStatus === 'sending' ? 'Reenviando…' : 'Reenviar correo'}
            </button>

            {resendStatus === 'ok' && (
              <p className="register__hint">Correo reenviado.</p>
            )}
            {resendStatus === 'error' && (
              <p className="register__error">No se ha podido reenviar. Inténtalo más tarde.</p>
            )}

            <p className="register__link">
              ¿Ya lo has verificado? <Link to="/login">Inicia sesión</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="register">
      <div className="register__left">
        <div className="register__brand">
          <img className="register__logo" src="/pataplan.png" alt="PataPlan" />
          <p className="register__tagline">La salud de tus animales, bajo control</p>
        </div>
      </div>
      <div className="register__right">
        <form className="register__form" onSubmit={handleSubmit} noValidate>
          <div className="register__header">
            <h2 className="register__title">Crear cuenta</h2>
            <p className="register__subtitle">Completa tus datos para empezar</p>
          </div>

          {apiError && <div className="register__alert">{apiError}</div>}

          <div className="register__field">
            <label className="register__label" htmlFor="name">Nombre completo</label>
            <input
              className={`register__input ${errors.name ? 'register__input--error' : ''}`}
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre completo"
            />
            {errors.name && <span className="register__error">{errors.name}</span>}
          </div>

          <div className="register__field">
            <label className="register__label" htmlFor="email">Correo electrónico</label>
            <input
              className={`register__input ${errors.email ? 'register__input--error' : ''}`}
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
            />
            {errors.email && <span className="register__error">{errors.email}</span>}
          </div>

          <div className="register__field">
            <label className="register__label" htmlFor="password">Contraseña</label>
            <input
              className={`register__input ${errors.password ? 'register__input--error' : ''}`}
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
            {errors.password && <span className="register__error">{errors.password}</span>}
          </div>

          <div className="register__field">
            <label className="register__label" htmlFor="confirmPassword">Confirmar contraseña</label>
            <input
              className={`register__input ${errors.confirmPassword ? 'register__input--error' : ''}`}
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
            />
            {errors.confirmPassword && <span className="register__error">{errors.confirmPassword}</span>}
          </div>

          <button className="register__button" type="submit" disabled={submitting}>
            {submitting ? 'Registrando...' : 'Crear cuenta'}
          </button>

          <p className="register__link">
            ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
