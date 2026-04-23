import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import './SearchInput.scss';

export function SearchInput({ placeholder = 'Buscar...', onSearch, debounceMs = 300 }) {
  const [value, setValue] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(value);
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [value, debounceMs, onSearch]);

  return (
    <div className="search-input">
      <Search className="search-input__icon" size={18} />
      <input
        className="search-input__field"
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    </div>
  );
}
