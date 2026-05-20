import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { SearchInput } from './SearchInput';

describe('SearchInput', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders with the provided placeholder', () => {
    render(<SearchInput placeholder="Buscar animal" onSearch={() => {}} />);
    expect(screen.getByPlaceholderText('Buscar animal')).toBeInTheDocument();
  });

  it('debounces the onSearch callback until the configured delay elapses', () => {
    const onSearch = vi.fn();
    render(<SearchInput onSearch={onSearch} debounceMs={300} />);

    onSearch.mockClear();
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'gato' } });

    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(onSearch).not.toHaveBeenCalledWith('gato');

    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(onSearch).toHaveBeenLastCalledWith('gato');
  });

  it('only fires once after several rapid keystrokes within the debounce window', () => {
    const onSearch = vi.fn();
    render(<SearchInput onSearch={onSearch} debounceMs={300} />);
    onSearch.mockClear();

    const input = screen.getByRole('searchbox');
    fireEvent.change(input, { target: { value: 'g' } });
    fireEvent.change(input, { target: { value: 'ga' } });
    fireEvent.change(input, { target: { value: 'gat' } });
    fireEvent.change(input, { target: { value: 'gato' } });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(onSearch).toHaveBeenCalledWith('gato');
    expect(onSearch).toHaveBeenCalledTimes(1);
  });
});
