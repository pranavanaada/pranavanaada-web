import { Suspense, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabaseClient';

export default function AdminLayout() {
  const { signOut, session } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [newCount, setNewCount] = useState(0);
  const [newOrders, setNewOrders] = useState(0);
  const [openReturns, setOpenReturns] = useState(0);

  // Unread enquiries badge — refreshed when moving between admin pages.
  useEffect(() => {
    supabase
      .from('inquiries')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'new')
      .then(({ count }) => setNewCount(count ?? 0));
    supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'placed')
      .then(({ count }) => setNewOrders(count ?? 0));
    // Return requests waiting for a decision or for the item to be checked
    supabase
      .from('return_requests')
      .select('id', { count: 'exact', head: true })
      .in('status', ['requested', 'received'])
      .then(({ count }) => setOpenReturns(count ?? 0));
  }, [pathname]);

  async function handleSignOut() {
    await signOut();
    navigate('/admin/login');
  }

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center justify-between gap-2 px-4 py-2.5 rounded-md text-sm whitespace-nowrap ${
      isActive ? 'bg-gold text-emerald-950 font-semibold' : 'text-cream/70 hover:bg-emerald-800'
    }`;

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <aside className="md:w-60 border-b md:border-b-0 md:border-r border-emerald-800 p-4 flex md:flex-col gap-2">
        <div className="hidden md:block px-2 mb-3">
          <div className="font-heading text-gold text-lg">Pranavanaada</div>
          <div className="text-[11px] text-cream/40 truncate">{session?.user.email}</div>
        </div>
        <nav className="flex md:flex-col gap-2 flex-1 overflow-x-auto">
          <NavLink to="/admin/orders" className={linkClass}>
            Orders
            {newOrders > 0 && (
              <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-red-400 text-emerald-950 text-[11px] font-bold flex items-center justify-center">
                {newOrders}
              </span>
            )}
          </NavLink>
          <NavLink to="/admin/returns" className={linkClass}>
            Returns
            {openReturns > 0 && (
              <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-red-400 text-emerald-950 text-[11px] font-bold flex items-center justify-center">
                {openReturns}
              </span>
            )}
          </NavLink>
          <NavLink to="/admin" end className={linkClass}>
            Products
          </NavLink>
          <NavLink to="/admin/combos" className={linkClass}>
            Combo Offers
          </NavLink>
          <NavLink to="/admin/inquiries" className={linkClass}>
            Inquiries
            {newCount > 0 && (
              <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-red-400 text-emerald-950 text-[11px] font-bold flex items-center justify-center">
                {newCount}
              </span>
            )}
          </NavLink>
          <NavLink to="/admin/settings" className={linkClass}>
            Settings
          </NavLink>
        </nav>
        <div className="flex md:flex-col gap-1">
          <Link
            to="/"
            target="_blank"
            className="px-4 py-2.5 rounded-md text-sm text-cream/50 hover:bg-emerald-800 hover:text-cream whitespace-nowrap"
          >
            View website ↗
          </Link>
          <button
            onClick={handleSignOut}
            className="text-left px-4 py-2.5 rounded-md text-sm text-cream/50 hover:bg-emerald-800 hover:text-cream whitespace-nowrap"
          >
            Sign Out
          </button>
        </div>
      </aside>
      <main className="flex-1 p-5 md:p-8 min-w-0">
        {/* Each admin page loads on demand; keep the sidebar in place while it does */}
        <Suspense fallback={<p className="text-cream/50">Loading…</p>}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}
