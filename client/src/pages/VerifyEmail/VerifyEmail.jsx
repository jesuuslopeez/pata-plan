import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { verifyEmailRequest } from '../../services/auth.service';
import { usePageTitle } from '../../hooks/usePageTitle';
import './VerifyEmail.scss';

export function VerifyEmail() {
  usePageTitle('Verificar correo');
  const [params] = useSearchParams();
  const { completeVerification } = useAuth();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = params.get('token');
    if (!token) {
      setStatus('error');
      setMessage('Falta el token de verificación.');
      return;
    }
    verifyEmailRequest(token)
      .then((res) => {
        setStatus('ok');
        if (res.data?.user && res.data?.token) {
          completeVerification(res.data.user, res.data.token);
        }
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err?.response?.data?.error || 'No se ha podido verificar el correo.');
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="verify-email">
      <div className="verify-email__left">
        <div className="verify-email__brand">
          <img className="verify-email__logo" src="/pataplan.png" alt="PataPlan logo" />
          <p className="verify-email__tagline">La salud de tus animales, bajo control</p>
        </div>
      </div>
      <div className="verify-email__right">
        <div className="verify-email__content">
          {status === 'loading' && (
            <div role="status" aria-live="polite">
              <h2 className="verify-email__title">Verificando tu correo…</h2>
              <p className="verify-email__subtitle">Espera un momento.</p>
            </div>
          )}
          {status === 'ok' && (
            <div role="status">
              <h2 className="verify-email__title">¡Correo verificado!</h2>
              <p className="verify-email__subtitle">Entrando a tu cuenta…</p>
            </div>
          )}
          {status === 'error' && (
            <div role="alert">
              <h2 className="verify-email__title">No se ha podido verificar</h2>
              <p className="verify-email__subtitle">{message}</p>
              <p className="verify-email__link">
                <Link to="/login">Volver al inicio de sesión</Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
