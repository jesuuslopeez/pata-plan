import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { getDashboard, getGroups } from '../../services/dashboard.service';
import { AnimalAlertCard } from '../../components/AnimalAlertCard/AnimalAlertCard';
import { UpcomingEvents } from '../../components/UpcomingEvents/UpcomingEvents';
import { SpendSummary } from '../../components/SpendSummary/SpendSummary';
import { GroupSummary } from '../../components/GroupSummary/GroupSummary';
import { usePageTitle } from '../../hooks/usePageTitle';
import './Dashboard.scss';

function groupAlertsByAnimal(alerts) {
  const grouped = new Map();
  for (const alert of alerts || []) {
    const id = alert.animal?.id;
    if (!id) continue;
    if (!grouped.has(id)) {
      grouped.set(id, {
        animal: alert.animal,
        group: alert.group,
        alerts: [],
      });
    }
    grouped.get(id).alerts.push(alert);
  }
  return Array.from(grouped.values());
}

export function Dashboard() {
  usePageTitle('Panel');
  const [summary, setSummary] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [dashboardRes, groupsRes] = await Promise.all([
          getDashboard().catch(() => ({ data: null })),
          getGroups().catch(() => ({ data: { groups: [] } })),
        ]);

        if (dashboardRes.data) {
          setSummary(dashboardRes.data.summary);
          setAlerts(dashboardRes.data.topAlerts || []);
          setUpcoming(dashboardRes.data.upcomingEvents || []);
        }
        setGroups(groupsRes.data?.groups || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const groupedAlerts = groupAlertsByAnimal(alerts).slice(0, 3);

  return (
    <div className="dashboard" aria-busy={loading}>
      <section className="dashboard__section" aria-label="Animales que necesitan atención">
        <div className="dashboard__section-header">
          <AlertTriangle className="dashboard__section-icon" size={18} aria-hidden="true" />
          <h2 className="dashboard__section-title">Necesitan atención</h2>
        </div>

        {loading ? (
          <div className="dashboard__loading" role="status" aria-live="polite">Cargando...</div>
        ) : groupedAlerts.length === 0 ? (
          <div className="dashboard__empty" role="status">
            <CheckCircle className="dashboard__empty-icon" size={20} aria-hidden="true" />
            <span>Todo al día</span>
          </div>
        ) : (
          <div className="dashboard__alerts-grid" aria-live="polite">
            {groupedAlerts.map((item) => (
              <AnimalAlertCard
                key={item.animal.id}
                animal={item.animal}
                group={item.group}
                alerts={item.alerts}
              />
            ))}
          </div>
        )}
      </section>

      <section className="dashboard__bottom" aria-label="Resumen económico y de grupos">
        <div className="dashboard__bottom-left">
          <UpcomingEvents events={upcoming} />
        </div>
        <div className="dashboard__bottom-right">
          <SpendSummary amount={summary?.monthlySpend || 0} changePercent={null} />
          <GroupSummary groups={groups} />
        </div>
      </section>
    </div>
  );
}
