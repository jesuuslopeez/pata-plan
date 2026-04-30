import { ShieldOff } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { ProfileSettings } from '../../components/ProfileSettings/ProfileSettings';
import { GroupSettings } from '../../components/GroupSettings/GroupSettings';
import { CollaboratorSettings } from '../../components/CollaboratorSettings/CollaboratorSettings';
import './Settings.scss';

export function Settings() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  if (!isAdmin) {
    return (
      <div className="settings settings--denied">
        <ShieldOff size={32} className="settings__denied-icon" />
        <h1 className="settings__denied-title">Sin permisos</h1>
        <p className="settings__denied-text">
          Solo los administradores pueden acceder a los ajustes.
        </p>
      </div>
    );
  }

  return (
    <div className="settings">
      <header className="settings__header">
        <h1 className="settings__title">Ajustes</h1>
      </header>

      <div className="settings__content">
        <ProfileSettings />
        <GroupSettings />
        <CollaboratorSettings />
      </div>
    </div>
  );
}
