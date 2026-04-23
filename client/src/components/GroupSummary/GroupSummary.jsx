import './GroupSummary.scss';

const BAR_COLORS = ['group-summary__fill--primary', 'group-summary__fill--light'];

export function GroupSummary({ groups }) {
  const total = groups?.reduce((sum, g) => sum + (g._count?.animals || 0), 0) || 0;

  return (
    <section className="group-summary">
      <p className="group-summary__label">Por grupo</p>

      {(!groups || groups.length === 0) ? (
        <p className="group-summary__empty">Sin grupos</p>
      ) : (
        <ul className="group-summary__list">
          {groups.map((group, idx) => {
            const count = group._count?.animals || 0;
            const percent = total > 0 ? (count / total) * 100 : 0;
            const colorClass = BAR_COLORS[idx % BAR_COLORS.length];
            return (
              <li key={group.id} className="group-summary__item">
                <div className="group-summary__row">
                  <span className="group-summary__name">{group.name}</span>
                  <span className="group-summary__count">
                    {count} {count === 1 ? 'animal' : 'animales'}
                  </span>
                </div>
                <div className="group-summary__bar">
                  <div
                    className={`group-summary__fill ${colorClass}`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
