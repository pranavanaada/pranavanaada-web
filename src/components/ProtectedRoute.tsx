import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, loading, isAdmin, signOut } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-cream/60">Loading…</div>;
  }

  if (!session) {
    return <Navigate to="/admin/login" replace />;
  }

  // Logged in, but this email isn't in the admins table.
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center px-5">
        <div className="max-w-sm text-center bg-emerald-800/50 border border-emerald-700 rounded-xl p-8">
          <h1 className="font-heading text-gold text-xl mb-2">Not an admin account</h1>
          <p className="text-sm text-cream/60 mb-6">
            {session.user.email} is signed in but doesn't have admin access.
          </p>
          <button onClick={signOut} className="text-sm text-gold underline underline-offset-4">
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
