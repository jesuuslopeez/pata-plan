import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from './Badge';

describe('Badge', () => {
  it('renders the provided text', () => {
    render(<Badge text="Al día" />);
    expect(screen.getByText('Al día')).toBeInTheDocument();
  });

  it('applies the default neutral variant when none is given', () => {
    render(<Badge text="Etiqueta" />);
    const badge = screen.getByText('Etiqueta');
    expect(badge).toHaveClass('badge', 'badge--neutral');
  });

  it('applies the danger variant when specified', () => {
    render(<Badge text="Vencido" variant="danger" />);
    const badge = screen.getByText('Vencido');
    expect(badge).toHaveClass('badge--danger');
    expect(badge).not.toHaveClass('badge--neutral');
  });

  it('applies the success variant when specified', () => {
    render(<Badge text="OK" variant="success" />);
    expect(screen.getByText('OK')).toHaveClass('badge--success');
  });
});
