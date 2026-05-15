import { useAuth } from '../../hooks/useAuth';
import { ProfileSettings } from '../../components/ProfileSettings/ProfileSettings';
import { GroupSettings } from '../../components/GroupSettings/GroupSettings';
import { GroupCollaboratorsPanel } from '../../components/GroupCollaboratorsPanel/GroupCollaboratorsPanel';
import { JoinGroupPanel } from '../../components/JoinGroupPanel/JoinGroupPanel';
import './Settings.scss';

export function Settings() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="settings">
      <header className="settings__header">
        <h1 className="settings__title">Ajustes</h1>
      </header>

      <div className="settings__content">
        <ProfileSettings />
        <JoinGroupPanel />
        {isAdmin && (
          <>
            <GroupSettings />
            <GroupCollaboratorsPanel />
          </>
        )}
      </div>
    </div>
  );
}
