import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import PasswordFields, { passwordProblem } from './PasswordFields';
import StoreSettingsForm from './StoreSettingsForm';

/** Account settings: who's logged in, and change password. */
export default function AdminSettings() {
  const { session, updatePassword } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaved(false);
    const problem = passwordProblem(password, confirm);
    if (problem) {
      setError(problem);
      return;
    }
    setSaving(true);
    const { error } = await updatePassword(password);
    setSaving(false);
    if (error) setError(error);
    else {
      setError(null);
      setSaved(true);
      setPassword('');
      setConfirm('');
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="font-heading text-gold text-2xl mb-6">Settings</h1>

      <StoreSettingsForm />

      <div className="rounded-xl border border-emerald-700 bg-emerald-800/30 p-5">
        <div className="text-xs text-cream/50">Signed in as</div>
        <div className="text-cream">{session?.user.email}</div>
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl border border-emerald-700 bg-emerald-800/30 p-5">
        <h2 className="text-cream font-medium mb-4">Change password</h2>
        <PasswordFields password={password} confirm={confirm} onPassword={setPassword} onConfirm={setConfirm} />
        {error && <p className="text-xs text-red-400 mb-4">{error}</p>}
        {saved && <p className="text-xs text-emerald-200 mb-4">Password updated.</p>}
        <button
          type="submit"
          disabled={saving}
          className="w-full bg-gold text-emerald-950 py-3 rounded-md text-sm font-semibold uppercase tracking-wide disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Update Password'}
        </button>
      </form>
    </div>
  );
}
