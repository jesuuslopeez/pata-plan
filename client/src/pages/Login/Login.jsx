import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './Login.scss';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
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
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      const msg = err.response?.data?.error || 'Error al iniciar sesión';
      setApiError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login">
      <div className="login__left">
        <div className="login__brand">
          <img className="login__logo" src="/pataplan.png" alt="PataPlan" />
          <p className="login__tagline">La salud de tus animales, bajo control</p>
        </div>
      </div>
      <div className="login__right">
        <form className="login__form" onSubmit={handleSubmit} noValidate>
          <div className="login__header">
            <h2 className="login__title">Iniciar sesión</h2>
            <p className="login__subtitle">Introduce tus credenciales para acceder</p>
          </div>

          {apiError && <div className="login__alert">{apiError}</div>}

          <div className="login__field">
            <label className="login__label" htmlFor="email">Correo electrónico</label>
            <input
              className={`login__input ${errors.email ? 'login__input--error' : ''}`}
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
            />
            {errors.email && <span className="login__error">{errors.email}</span>}
          </div>

          <div className="login__field">
            <label className="login__label" htmlFor="password">Contraseña</label>
            <input
              className={`login__input ${errors.password ? 'login__input--error' : ''}`}
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
            {errors.password && <span className="login__error">{errors.password}</span>}
          </div>

          <div className="login__forgot">
            <span>¿Olvidaste tu contraseña?</span>
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
