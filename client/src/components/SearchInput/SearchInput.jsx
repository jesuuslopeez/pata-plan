import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import './SearchInput.scss';

export function SearchInput({
  placeholder = 'Buscar...',
  onSearch,
  debounceMs = 300,
  'aria-label': ariaLabel = 'Buscar',
}) {
  const [value, setValue] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(value);
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [value, debounceMs, onSearch]);

  return (
    <div className="search-input">
      <Search className="search-input__icon" size={18} aria-hidden="true" />
      <input
        className="search-input__field"
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        aria-label={ariaLabel}
      />
    </div>
  );
}
