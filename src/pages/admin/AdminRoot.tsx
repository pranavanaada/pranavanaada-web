import { Outlet } from 'react-router-dom';
import { AuthProvider } from '../../hooks/useAuth';

/**
 * Wraps every /admin route in the auth provider. Lives in its own lazily
 * loaded chunk so public visitors never download the Supabase auth code.
 */
export default function AdminRoot() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}
