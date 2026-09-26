import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { isSupabaseConfigured } from '../../lib/supabaseConfig';

const inputClass =
  'w-full bg-emerald-950 border border-emerald-700 rounded-md px-3 py-2.5 text-sm outline-none focus:border-gold';

export default function AdminLogin() {
  const { session, signIn, sendPasswordReset } = useAuth();
  const [mode, setMode] = useState<'login' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (session) return <Navigate to="/admin" replace />;

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await signIn(email.trim(), password);
    setLoading(false);
    if (error) setError(error === 'Invalid login credentials' ? 'Wrong email or password.' : error);
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await sendPasswordReset(email.trim());
    setLoading(false);
    if (error) setError(error);
    // Same message whether or not the email exists, so it can't be used to probe accounts.
    else setNotice('If that email has an admin account, a reset link is on its way. Check your inbox (and spam).');
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-5">
      <form
        onSubmit={mode === 'login' ? handleLogin : handleForgot}
        className="w-full max-w-sm bg-emerald-800/50 border border-emerald-700 rounded-xl p-8"
      >
        <h1 className="font-heading text-gold text-2xl mb-1 text-center">
          {mode === 'login' ? 'Admin Login' : 'Reset Password'}
        </h1>
        <p className="text-cream/50 text-xs text-center mb-6">
          {mode === 'login' ? 'Pranavanaada Admin Panel' : "Enter your admin email and we'll send a reset link."}
        </p>

        {!isSupabaseConfigured && (
          <p className="text-xs text-amber-300 bg-amber-300/10 border border-amber-300/30 rounded-md p-3 mb-4">
            Supabase isn't connected yet, so login won't work. Add your keys to .env.local — see README.md.
          </p>
        )}

        <label className="block text-xs text-cream/50 mb-1">Email</label>
        <input
          required
          type="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`${inputClass} mb-4`}
        />

        {mode === 'login' && (
          <>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs text-cream/50">Password</label>
              <button
                type="button"
                onClick={() => {
                  setMode('forgot');
                  setError(null);
                }}
                className="text-xs text-gold hover:underline"
              >
                Forgot password?
              </button>
            </div>
            <input
              required
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${inputClass} mb-5`}
            />
          </>
        )}

        {error && <p className="text-xs text-red-400 mb-4">{error}</p>}
        {notice && <p className="text-xs text-emerald-200 bg-emerald-950/60 rounded-md p-3 mb-4">{notice}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gold text-emerald-950 py-3 rounded-md text-sm font-semibold uppercase tracking-wide disabled:opacity-60"
        >
          {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Send Reset Link'}
        </button>

        {mode === 'forgot' && (
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setNotice(null);
              setError(null);
            }}
            className="w-full text-xs text-cream/60 hover:text-gold mt-4"
          >
            ← Back to login
          </button>
        )}

        <p className="text-[11px] text-cream/40 mt-5 text-center">
          <Link to="/" className="hover:text-gold">
            ← Back to website
          </Link>
        </p>
      </form>
    </div>
  );
}
