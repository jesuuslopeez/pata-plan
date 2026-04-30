import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { updateMeRequest, changePasswordRequest } from '../../services/auth.service';
import { Input } from '../Input/Input';
import './ProfileSettings.scss';

export function ProfileSettings() {
  const { user, setUser } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState(null);

  useEffect(() => {
    setName(user?.name || '');
    setEmail(user?.email || '');
  }, [user]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileMessage(null);
    if (!name.trim() || !email.trim()) {
      setProfileMessage({ type: 'error', text: 'Nombre y correo son obligatorios' });
      return;
    }
    setProfileSaving(true);
    try {
      const res = await updateMeRequest(name.trim(), email.trim());
      setUser?.(res.data?.user || null);
      setProfileMessage({ type: 'success', text: 'Perfil actualizado' });
    } catch (err) {
      setProfileMessage({
        type: 'error',
        text: err?.response?.data?.error || 'No se ha podido actualizar el perfil',
      });
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordMessage(null);
    if (newPassword.length < 8) {
      setPasswordMessage({
        type: 'error',
        text: 'La nueva contraseña debe tener al menos 8 caracteres',
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Las contraseñas no coinciden' });
      return;
    }
    setPasswordSaving(true);
    try {
      await changePasswordRequest(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordMessage({ type: 'success', text: 'Contraseña actualizada' });
    } catch (err) {
      setPasswordMessage({
        type: 'error',
        text: err?.response?.data?.error || 'No se ha podido cambiar la contraseña',
      });
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <section className="profile-settings">
      <h2 className="profile-settings__title">Perfil</h2>

      <form className="profile-settings__form" onSubmit={handleProfileSubmit}>
        <Input
          label="Nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
          required
        />
        <Input
          label="Correo electrónico"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          maxLength={255}
          required
        />
        <div className="profile-settings__actions">
          <button
            type="submit"
            className="profile-settings__btn profile-settings__btn--primary"
            disabled={profileSaving}
          >
            {profileSaving ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
        {profileMessage && (
          <p className={`profile-settings__message profile-settings__message--${profileMessage.type}`}>
            {profileMessage.text}
          </p>
        )}
      </form>

      <hr className="profile-settings__divider" />

      <h3 className="profile-settings__subtitle">Cambiar contraseña</h3>

      <form className="profile-settings__form" onSubmit={handlePasswordSubmit}>
        <Input
          label="Contraseña actual"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
        <Input
          label="Nueva contraseña"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          autoComplete="new-password"
          minLength={8}
          required
          hint="Mínimo 8 caracteres"
        />
        <Input
          label="Confirmar nueva contraseña"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
          required
        />
        <div className="profile-settings__actions">
          <button
            type="submit"
            className="profile-settings__btn profile-settings__btn--secondary"
            disabled={passwordSaving}
          >
            {passwordSaving ? 'Guardando…' : 'Cambiar contraseña'}
          </button>
        </div>
        {passwordMessage && (
          <p className={`profile-settings__message profile-settings__message--${passwordMessage.type}`}>
            {passwordMessage.text}
          </p>
        )}
      </form>
    </section>
  );
}
