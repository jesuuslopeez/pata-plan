import './Tabs.scss';

export function Tabs({ tabs, activeTab, onTabChange }) {
  return (
    <div className="tabs">
      <div className="tabs__list" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`tabs__item ${activeTab === tab.id ? 'tabs__item--active' : ''}`}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
