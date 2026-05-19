import { Link } from 'react-router-dom';
import { PawPrint } from 'lucide-react';
import './NotFound.scss';

export function NotFound() {
  return (
    <div className="not-found">
      <div className="not-found__content">
        <div className="not-found__code" aria-label="Error 404">
          <span className="not-found__digit">4</span>
          <span className="not-found__paw" aria-hidden="true">
            <PawPrint />
          </span>
          <span className="not-found__digit">4</span>
        </div>
        <h1 className="not-found__title">Página no encontrada</h1>
        <p className="not-found__subtitle">
          Esta huella se ha perdido por el camino. Vamos a llevarte de vuelta a casa.
        </p>
        <Link to="/" className="not-found__button">
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
