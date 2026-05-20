import { ChevronDown } from 'lucide-react';
import './SelectFilter.scss';

export function SelectFilter({ value, onChange, options, 'aria-label': ariaLabel = 'Filtrar' }) {
  return (
    <div className="select-filter">
      <select
        className="select-filter__field"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={ariaLabel}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="select-filter__icon" size={16} aria-hidden="true" />
    </div>
  );
}
