import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AnimalCard } from './AnimalCard';

const navigateMock = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => navigateMock };
});

function renderCard(animal) {
  return render(
    <MemoryRouter>
      <AnimalCard animal={animal} />
    </MemoryRouter>
  );
}

const baseAnimal = {
  id: 42,
  name: 'Tiffany',
  species: 'CAT',
  breed: 'Europeo común',
  group: { name: 'Casa' },
  _count: { overdueEvents: 0, pendingEvents: 0 },
};

describe('AnimalCard', () => {
  it('renders name, species label and breed', () => {
    renderCard(baseAnimal);
    expect(screen.getByText('Tiffany')).toBeInTheDocument();
    expect(screen.getByText(/Gato/)).toBeInTheDocument();
    expect(screen.getByText(/Europeo común/)).toBeInTheDocument();
  });

  it('shows "Al día" when there are no pending or overdue events', () => {
    renderCard(baseAnimal);
    expect(screen.getByText('Al día')).toBeInTheDocument();
  });

  it('shows "Pendiente" when there are pending events but none overdue', () => {
    renderCard({ ...baseAnimal, _count: { overdueEvents: 0, pendingEvents: 2 } });
    expect(screen.getByText('Pendiente')).toBeInTheDocument();
  });

  it('shows "Vencido" when there are overdue events', () => {
    renderCard({ ...baseAnimal, _count: { overdueEvents: 1, pendingEvents: 0 } });
    expect(screen.getByText('Vencido')).toBeInTheDocument();
  });

  it('falls back to "Sin raza" when breed is missing', () => {
    renderCard({ ...baseAnimal, breed: null });
    expect(screen.getByText(/Sin raza/)).toBeInTheDocument();
  });

  it('navigates to the animal profile on click', async () => {
    const user = userEvent.setup();
    navigateMock.mockClear();
    renderCard(baseAnimal);

    await user.click(screen.getByRole('button', { name: /Tiffany/i }));
    expect(navigateMock).toHaveBeenCalledWith('/animals/42');
  });

  it('is operable with the keyboard (Enter)', async () => {
    const user = userEvent.setup();
    navigateMock.mockClear();
    renderCard(baseAnimal);

    const card = screen.getByRole('button', { name: /Tiffany/i });
    card.focus();
    await user.keyboard('{Enter}');
    expect(navigateMock).toHaveBeenCalledWith('/animals/42');
  });
});
