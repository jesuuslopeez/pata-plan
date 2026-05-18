import { useEffect, useState } from 'react';
import { Plus, PawPrint } from 'lucide-react';
import { getAnimals } from '../../services/animal.service';
import { getGroups } from '../../services/dashboard.service';
import { useAuth } from '../../hooks/useAuth';
import { AnimalCard } from '../../components/AnimalCard/AnimalCard';
import { SearchInput } from '../../components/SearchInput/SearchInput';
import { SelectFilter } from '../../components/SelectFilter/SelectFilter';
import { AddAnimalModal } from '../../components/AddAnimalModal/AddAnimalModal';
import './Animals.scss';

const SPECIES_OPTIONS = [
  { value: '', label: 'Todas las especies' },
  { value: 'DOG', label: 'Perro' },
  { value: 'CAT', label: 'Gato' },
  { value: 'OTHER', label: 'Otro' },
];

export function Animals() {
  const { isAdmin } = useAuth();
  const [animals, setAnimals] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [groupId, setGroupId] = useState('');
  const [species, setSpecies] = useState('');
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    getGroups()
      .then((res) => setGroups(res.data?.groups || []))
      .catch(() => setGroups([]));
  }, []);

  const loadAnimals = () => {
    setLoading(true);
    getAnimals({ search, groupId, species })
      .then((res) => setAnimals(res.data?.animals || []))
      .catch(() => setAnimals([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAnimals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, groupId, species]);

  const groupLabel = (g) =>
    g.role && g.role !== 'OWNER' && g.owner?.name
      ? `${g.name} (de ${g.owner.name})`
      : g.name;
  const groupOptions = [
    { value: '', label: 'Todos los grupos' },
    ...groups.map((g) => ({ value: String(g.id), label: groupLabel(g) })),
  ];
  const editableGroups = groups.filter((g) => !g.role || g.role === 'OWNER' || g.role === 'EDITOR');

  return (
    <div className="animals">
      <header className="animals__header">
        <h1 className="animals__title">Animales</h1>
        {isAdmin && (
          <button
            className="animals__add-button"
            type="button"
            onClick={() => setAddOpen(true)}
          >
            <Plus size={18} />
            <span>Añadir animal</span>
          </button>
        )}
      </header>

      <div className="animals__filters">
        <SearchInput placeholder="Buscar por nombre..." onSearch={setSearch} />
        <SelectFilter value={groupId} onChange={setGroupId} options={groupOptions} />
        <SelectFilter value={species} onChange={setSpecies} options={SPECIES_OPTIONS} />
      </div>

      {loading ? (
        <div className="animals__grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animals__skeleton" />
          ))}
        </div>
      ) : animals.length === 0 ? (
        <div className="animals__empty">
          <PawPrint className="animals__empty-icon" size={48} />
          <p className="animals__empty-text">No se encontraron animales</p>
          {isAdmin && (
            <button
              className="animals__add-button"
              type="button"
              onClick={() => setAddOpen(true)}
            >
              <Plus size={18} />
              <span>Añadir animal</span>
            </button>
          )}
        </div>
      ) : (
        <div className="animals__grid">
          {animals.map((animal) => (
            <AnimalCard key={animal.id} animal={animal} />
          ))}
        </div>
      )}

      <AddAnimalModal
        open={addOpen}
        groups={editableGroups}
        onClose={() => setAddOpen(false)}
        onSaved={() => loadAnimals()}
      />
    </div>
  );
}
