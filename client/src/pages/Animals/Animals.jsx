import { useEffect, useState } from 'react';
import { Plus, PawPrint } from 'lucide-react';
import { getAnimals } from '../../services/animal.service';
import { getGroups } from '../../services/dashboard.service';
import { AnimalCard } from '../../components/AnimalCard/AnimalCard';
import { SearchInput } from '../../components/SearchInput/SearchInput';
import { SelectFilter } from '../../components/SelectFilter/SelectFilter';
import './Animals.scss';

const SPECIES_OPTIONS = [
  { value: '', label: 'Todas las especies' },
  { value: 'DOG', label: 'Perro' },
  { value: 'CAT', label: 'Gato' },
  { value: 'OTHER', label: 'Otro' },
];

export function Animals() {
  const [animals, setAnimals] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [groupId, setGroupId] = useState('');
  const [species, setSpecies] = useState('');

  useEffect(() => {
    getGroups()
      .then((res) => setGroups(res.data?.groups || []))
      .catch(() => setGroups([]));
  }, []);

  useEffect(() => {
    setLoading(true);
    getAnimals({ search, groupId, species })
      .then((res) => setAnimals(res.data?.animals || []))
      .catch(() => setAnimals([]))
      .finally(() => setLoading(false));
  }, [search, groupId, species]);

  const groupOptions = [
    { value: '', label: 'Todos los grupos' },
    ...groups.map((g) => ({ value: String(g.id), label: g.name })),
  ];

  return (
    <div className="animals">
      <header className="animals__header">
        <h1 className="animals__title">Animales</h1>
        <button className="animals__add-button" type="button">
          <Plus size={18} />
          <span>Añadir animal</span>
        </button>
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
          <button className="animals__add-button" type="button">
            <Plus size={18} />
            <span>Añadir animal</span>
          </button>
        </div>
      ) : (
        <div className="animals__grid">
          {animals.map((animal) => (
            <AnimalCard key={animal.id} animal={animal} />
          ))}
        </div>
      )}
    </div>
  );
}
