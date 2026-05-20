import './Badge.scss';

export function Badge({ text, variant = 'neutral' }) {
  return (
    <span className={`badge badge--${variant}`} role="status">
      {text}
    </span>
  );
}
