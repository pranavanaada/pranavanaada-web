import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import PasswordFields, { passwordProblem } from './PasswordFields';

/**
 * Landing page for the "reset password" email link. Supabase signs the admin
 * in from the link, then they choose a new password here.
 */
export default function AdminResetPassword() {
  const { session, loading, updatePassword } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const problem = passwordProblem(password, confirm);
    if (problem) {
      setError(problem);
      return;
    }
    setSaving(true);
    const { error } = await updatePassword(password);
    setSaving(false);
    if (error) setError(error);
    else navigate('/admin', { replace: true });
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-5">
      <div className="w-full max-w-sm bg-emerald-800/50 border border-emerald-700 rounded-xl p-8">
        <h1 className="font-heading text-gold text-2xl mb-1 text-center">Choose a New Password</h1>

        {loading ? (
          <p className="text-center text-cream/60 text-sm mt-6">Checking your reset link…</p>
        ) : !session ? (
          <div className="text-center mt-6">
            <p className="text-sm text-cream/60 mb-4">
              This reset link is invalid or has expired. Request a new one from the login page.
            </p>
            <Link to="/admin/login" className="text-gold text-sm underline underline-offset-4">
              Go to login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6">
            <p className="text-xs text-cream/50 text-center mb-5">For {session.user.email}</p>
            <PasswordFields password={password} confirm={confirm} onPassword={setPassword} onConfirm={setConfirm} />
            {error && <p className="text-xs text-red-400 mb-4">{error}</p>}
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-gold text-emerald-950 py-3 rounded-md text-sm font-semibold uppercase tracking-wide disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save New Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
