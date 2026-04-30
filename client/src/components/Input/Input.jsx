import './Input.scss';

let nextId = 0;
const generateId = () => `input-${++nextId}`;

export function Input({
  label,
  id,
  type = 'text',
  error,
  hint,
  className = '',
  ...rest
}) {
  const inputId = id || generateId();

  return (
    <div className={`input ${className}`.trim()}>
      {label && (
        <label className="input__label" htmlFor={inputId}>
          {label}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        className={`input__field${error ? ' input__field--error' : ''}`}
        aria-invalid={!!error}
        {...rest}
      />
      {hint && !error && <p className="input__hint">{hint}</p>}
      {error && <p className="input__error">{error}</p>}
    </div>
  );
}
