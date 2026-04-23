import './VetVisitsList.scss';

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatCost(cost) {
  if (cost === null || cost === undefined || cost === '') return null;
  const value = Number(cost);
  if (isNaN(value)) return null;
  return `${value.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EUR`;
}

export function VetVisitsList({ visits }) {
  if (!visits || visits.length === 0) {
    return null;
  }

  return (
    <div className="vet-visits-list">
      {visits.map((visit) => {
        const cost = formatCost(visit.cost);
        return (
          <article key={visit.id} className="vet-visits-list__card">
            <div className="vet-visits-list__header">
              <span className="vet-visits-list__date">{formatDate(visit.visitDate)}</span>
              {cost && <span className="vet-visits-list__cost">{cost}</span>}
            </div>
            <p className="vet-visits-list__reason">{visit.reason}</p>
            {visit.diagnosis && (
              <p className="vet-visits-list__field">
                <strong>Diagnóstico:</strong> {visit.diagnosis}
              </p>
            )}
            {visit.treatment && (
              <p className="vet-visits-list__field">
                <strong>Tratamiento:</strong> {visit.treatment}
              </p>
            )}
            {visit.vetName && <p className="vet-visits-list__vet">Dr. {visit.vetName}</p>}
          </article>
        );
      })}
    </div>
  );
}
