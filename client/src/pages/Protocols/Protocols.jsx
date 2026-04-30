import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash, ClipboardList } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getProtocols, deleteProtocol } from '../../services/protocol.service';
import { Badge } from '../../components/Badge/Badge';
import './Protocols.scss';

const CATEGORY_LABEL = {
  VACCINE: 'Vacuna',
  DEWORMING_INTERNAL: 'Desp. interna',
  DEWORMING_EXTERNAL: 'Desp. externa',
  TREATMENT: 'Tratamiento',
  CHECKUP: 'Revisión',
};

const CATEGORY_VARIANT = {
  VACCINE: 'info',
  DEWORMING_INTERNAL: 'warning',
  DEWORMING_EXTERNAL: 'warning',
  TREATMENT: 'danger',
  CHECKUP: 'neutral',
};

export function Protocols() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const [protocols, setProtocols] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    getProtocols()
      .then((res) => setProtocols(res.data?.protocols || res.data || []))
      .catch(() => setProtocols([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (protocol) => {
    if (
      !window.confirm(
        `¿Eliminar el protocolo "${protocol.name}"? Esta acción no se puede deshacer.`
      )
    ) {
      return;
    }
    try {
      await deleteProtocol(protocol.id);
      load();
    } catch (err) {
      const msg = err?.response?.data?.error || 'No se ha podido eliminar el protocolo';
      window.alert(msg);
    }
  };

  return (
    <div className="protocols">
      <header className="protocols__header">
        <div>
          <h1 className="protocols__title">Protocolos sanitarios</h1>
          <p className="protocols__subtitle">
            Define secuencias de eventos sanitarios reutilizables para tus animales
          </p>
        </div>
        {isAdmin && (
          <button
            className="protocols__add-button"
            type="button"
            onClick={() => navigate('/protocols/new')}
          >
            <Plus size={18} />
            <span>Crear protocolo</span>
          </button>
        )}
      </header>

      {loading ? (
        <div className="protocols__grid">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="protocols__skeleton" />
          ))}
        </div>
      ) : protocols.length === 0 ? (
        <div className="protocols__empty">
          <ClipboardList size={48} className="protocols__empty-icon" />
          <p className="protocols__empty-text">Aún no hay protocolos definidos</p>
          {isAdmin && (
            <button
              className="protocols__add-button"
              type="button"
              onClick={() => navigate('/protocols/new')}
            >
              <Plus size={18} />
              <span>Crear el primero</span>
            </button>
          )}
        </div>
      ) : (
        <div className="protocols__grid">
          {protocols.map((protocol) => (
            <article key={protocol.id} className="protocol-card">
              <header className="protocol-card__head">
                <h2 className="protocol-card__name">{protocol.name}</h2>
                <Badge
                  text={`${protocol._count?.assignments || 0} activas`}
                  variant={protocol._count?.assignments > 0 ? 'success' : 'neutral'}
                />
              </header>

              {protocol.description && (
                <p className="protocol-card__desc">{protocol.description}</p>
              )}

              <ol className="protocol-card__steps">
                {(protocol.steps || []).slice(0, 4).map((step) => (
                  <li key={step.id} className="protocol-card__step">
                    <span className="protocol-card__step-day">Día {step.dayOffset}</span>
                    <Badge
                      text={CATEGORY_LABEL[step.eventType?.category] || step.eventType?.category}
                      variant={CATEGORY_VARIANT[step.eventType?.category] || 'neutral'}
                    />
                    <span className="protocol-card__step-name">{step.eventType?.name}</span>
                  </li>
                ))}
                {(protocol.steps || []).length > 4 && (
                  <li className="protocol-card__step protocol-card__step--more">
                    + {protocol.steps.length - 4} pasos más
                  </li>
                )}
                {(protocol.steps || []).length === 0 && (
                  <li className="protocol-card__step protocol-card__step--empty">
                    Sin pasos definidos
                  </li>
                )}
              </ol>

              <footer className="protocol-card__actions">
                <button
                  className="protocol-card__btn protocol-card__btn--secondary"
                  type="button"
                  onClick={() => navigate(`/protocols/${protocol.id}/edit`)}
                >
                  <Pencil size={14} />
                  <span>{isAdmin ? 'Editar' : 'Ver detalle'}</span>
                </button>
                {isAdmin && (
                  <button
                    className="protocol-card__btn protocol-card__btn--danger"
                    type="button"
                    onClick={() => handleDelete(protocol)}
                  >
                    <Trash size={14} />
                    <span>Eliminar</span>
                  </button>
                )}
              </footer>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
