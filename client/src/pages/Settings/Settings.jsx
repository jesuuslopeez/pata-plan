import { useAuth } from '../../hooks/useAuth';
import { usePageTitle } from '../../hooks/usePageTitle';
import { ProfileSettings } from '../../components/ProfileSettings/ProfileSettings';
import { GroupSettings } from '../../components/GroupSettings/GroupSettings';
import { GroupCollaboratorsPanel } from '../../components/GroupCollaboratorsPanel/GroupCollaboratorsPanel';
import { JoinGroupPanel } from '../../components/JoinGroupPanel/JoinGroupPanel';
import './Settings.scss';

export function Settings() {
  usePageTitle('Ajustes');
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="settings">
      <header className="settings__masthead">
        <span className="settings__eyebrow">
          <span className="settings__eyebrow-dot" aria-hidden="true" />
          Mi cuenta · {new Date().getFullYear()}
        </span>
        <h1 className="settings__title">
          Ajustes <em>&amp; preferencias</em>
        </h1>
        <p className="settings__lead">
          Tu cuenta, tus grupos y tus colaboradores. <em>Tu manera.</em>
        </p>
      </header>

      <div className="settings__rule" aria-hidden="true" />

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
