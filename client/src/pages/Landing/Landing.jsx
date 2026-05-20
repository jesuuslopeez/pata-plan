import { Link } from 'react-router-dom';
import {
  PawPrint,
  Calendar,
  ClipboardList,
  Bell,
  Wallet,
  FileText,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import { usePageTitle } from '../../hooks/usePageTitle';
import './Landing.scss';

const FEATURES = [
  {
    icon: Calendar,
    title: 'Calendario inteligente',
    body: 'Vacunas, desparasitaciones y revisiones con próxima dosis calculada automáticamente.',
  },
  {
    icon: ClipboardList,
    title: 'Protocolos encadenados',
    body: 'Crea secuencias clínicas con dependencias temporales. Si una acción se retrasa, todo recalcula en cascada.',
  },
  {
    icon: Bell,
    title: 'Alertas priorizadas',
    body: 'Un sistema de puntuación ordena lo urgente: días vencidos, severidad del evento y estado del animal.',
  },
  {
    icon: Wallet,
    title: 'Gastos sin spreadsheets',
    body: 'Registra cada visita y tratamiento. KPIs y gráficas por animal, categoría y mes.',
  },
  {
    icon: FileText,
    title: 'Documentos en su sitio',
    body: 'Cartillas, analíticas, informes. Subida y descarga, todo asociado al animal correcto.',
  },
  {
    icon: TrendingUp,
    title: 'Detección de anomalías',
    body: 'Cambios bruscos de peso se marcan automáticamente. Estadística pura, sin caja negra.',
  },
];

export function Landing() {
  usePageTitle();
  return (
    <div className="landing">
      <div className="landing__grain" aria-hidden="true" />
      <PawDecorations />

      <header className="landing__topbar">
        <Link to="/" className="landing__brand-link" aria-label="PataPlan">
          <img src="/pataplan-wordmark.png" alt="PataPlan logo" className="landing__brand-logo" />
        </Link>
        <nav className="landing__topnav" aria-label="Acciones de cuenta">
          <Link to="/login" className="landing__topnav-link">
            Iniciar sesión
          </Link>
          <Link to="/register" className="landing__topnav-cta">
            Crear cuenta
          </Link>
        </nav>
      </header>

      <main className="landing__main">
        <section className="landing__hero" aria-labelledby="hero-title">
          <div className="landing__hero-text">
            <span className="landing__eyebrow">
              <span className="landing__eyebrow-dot" aria-hidden="true" />
              Salud animal · 2026
            </span>
            <h1 id="hero-title" className="landing__hero-title">
              Cuidar a <em>quien quieres</em>
              <br />
              no debería ser un <span className="landing__hero-mark">papeleo</span>.
            </h1>
            <p className="landing__hero-sub">
              PataPlan es la libreta de salud de tus animales hecha software. Para hogares con
              varias mascotas y para refugios que llevan decenas. Sin ataduras a una clínica.
            </p>
            <div className="landing__cta-row">
              <Link to="/register" className="landing__btn landing__btn--primary">
                Empezar gratis
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <Link to="/login" className="landing__btn landing__btn--ghost">
                Ya tengo cuenta
              </Link>
            </div>
            <p className="landing__fineprint">
              Sin tarjeta. Sin clínica intermediaria. Tus datos, tuyos.
            </p>
          </div>

          <aside className="landing__hero-card" aria-hidden="true">
            <div className="landing__card-tape" />
            <div className="landing__card-header">
              <span className="landing__card-badge">Próximo evento</span>
              <span className="landing__card-date">14 mar</span>
            </div>
            <div className="landing__card-body">
              <div className="landing__card-icon" aria-hidden="true">
                <PawPrint size={28} />
              </div>
              <div>
                <p className="landing__card-animal">Jimbo</p>
                <p className="landing__card-meta">Gato · 3 años</p>
              </div>
            </div>
            <div className="landing__card-event">
              <div className="landing__card-event-bar" />
              <div>
                <p className="landing__card-event-type">Vacuna trivalente</p>
                <p className="landing__card-event-sub">Refuerzo anual · en 6 días</p>
              </div>
            </div>
            <div className="landing__card-foot">
              <span className="landing__card-dot landing__card-dot--ok" aria-hidden="true" />
              <span>Programado automáticamente por protocolo</span>
            </div>
          </aside>
        </section>

        <section className="landing__story" aria-labelledby="story-title">
          <div className="landing__story-stat">
            <span className="landing__story-big">30+</span>
            <span className="landing__story-cap">
              animales cuidados por una sola persona, en papeles, hojas a mano, recordatorios
              improvisados.
            </span>
          </div>
          <div className="landing__story-text">
            <h2 id="story-title" className="landing__story-title">
              Lo construí porque <em>no existía.</em>
            </h2>
            <p>
              Llevar la salud de 1 perro, 6 gatos en casa y 25 más en un refugio con cuadernos y
              spreadsheets es un trabajo en sí mismo. Las soluciones que hay están atadas a una
              clínica concreta o son tan genéricas que no sirven.
            </p>
            <p>
              PataPlan asume que el cuidador es el centro: tú decides qué animales, qué grupos,
              qué protocolos. Las fechas se calculan solas; lo urgente se ordena solo.
            </p>
          </div>
        </section>

        <section className="landing__features" aria-labelledby="features-title">
          <header className="landing__section-head">
            <span className="landing__section-tag">Lo que hace</span>
            <h2 id="features-title" className="landing__section-title">
              Seis cosas, <em>bien hechas.</em>
            </h2>
          </header>
          <ul className="landing__features-grid">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <li key={title} className="landing__feature">
                <div className="landing__feature-icon" aria-hidden="true">
                  <Icon size={24} />
                </div>
                <h3 className="landing__feature-title">{title}</h3>
                <p className="landing__feature-body">{body}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="landing__audience" aria-labelledby="audience-title">
          <header className="landing__section-head landing__section-head--center">
            <span className="landing__section-tag">Para quién</span>
            <h2 id="audience-title" className="landing__section-title">
              Pensado para <em>dos mundos.</em>
            </h2>
          </header>
          <div className="landing__audience-cols">
            <article className="landing__audience-col">
              <span className="landing__audience-label">Hogares</span>
              <p className="landing__audience-body">
                Una o varias mascotas en casa. Vacunas al día, gastos controlados, cartillas en un
                sólo sitio. Compartido con tu pareja o familia.
              </p>
            </article>
            <span className="landing__audience-sep" aria-hidden="true">
              <PawPrint size={18} />
            </span>
            <article className="landing__audience-col">
              <span className="landing__audience-label">Refugios</span>
              <p className="landing__audience-body">
                Decenas de animales, rotaciones, colaboradores con permisos. Protocolos para los
                nuevos ingresos. Informes PDF para adopciones.
              </p>
            </article>
          </div>
        </section>

        <section className="landing__final" aria-labelledby="final-title">
          <div className="landing__final-inner">
            <h2 id="final-title" className="landing__final-title">
              Tu manada, <em>al día.</em>
            </h2>
            <p className="landing__final-sub">
              Crea tu cuenta en menos de un minuto y empieza a cuidar mejor.
            </p>
            <Link to="/register" className="landing__btn landing__btn--amber">
              Crear cuenta gratis
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <p className="landing__final-foot">
              ¿Ya estabas dentro?{' '}
              <Link to="/login" className="landing__final-link">
                Inicia sesión aquí
              </Link>
            </p>
          </div>
        </section>
      </main>

      <footer className="landing__footer">
        <span>PataPlan · 2026 · Hecho con cariño para nuestros peludos</span>
      </footer>
    </div>
  );
}

function PawDecorations() {
  const paws = [
    { top: '12%', left: '4%', rotate: -22, size: 64, opacity: 0.07 },
    { top: '28%', left: '88%', rotate: 18, size: 48, opacity: 0.09 },
    { top: '58%', left: '2%', rotate: 14, size: 80, opacity: 0.06 },
    { top: '72%', left: '92%', rotate: -28, size: 56, opacity: 0.08 },
    { top: '88%', left: '12%', rotate: 8, size: 40, opacity: 0.07 },
    { top: '40%', left: '50%', rotate: -8, size: 36, opacity: 0.05 },
  ];
  return (
    <div className="landing__paws" aria-hidden="true">
      {paws.map((p, i) => (
        <span
          key={i}
          className="landing__paw"
          style={{
            top: p.top,
            left: p.left,
            transform: `rotate(${p.rotate}deg)`,
            opacity: p.opacity,
            width: p.size,
            height: p.size,
          }}
        >
          <PawPrint size={p.size} strokeWidth={1.2} />
        </span>
      ))}
    </div>
  );
}
