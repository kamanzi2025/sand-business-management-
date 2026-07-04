import { NavLink, Outlet } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: '📊', end: true },
  { to: '/orders', label: 'Orders', icon: '🧾' },
  { to: '/customers', label: 'Customers', icon: '👥' },
  { to: '/vat', label: 'VAT Summary', icon: '🧮' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
];

function NavItems({ orientation }) {
  const base =
    orientation === 'vertical'
      ? 'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors'
      : 'flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium transition-colors';

  return NAV_ITEMS.map((item) => (
    <NavLink
      key={item.to}
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        `${base} ${isActive ? 'bg-orange-100 text-orange-700' : 'text-slate-600 hover:bg-slate-100'}`
      }
    >
      <span className={orientation === 'vertical' ? 'text-lg' : 'text-xl'}>{item.icon}</span>
      <span>{item.label}</span>
    </NavLink>
  ));
}

export default function Layout() {
  return (
    <div className="min-h-screen bg-slate-50 md:flex">
      <aside className="hidden md:flex md:w-60 md:flex-col md:border-r md:border-slate-200 md:bg-white md:p-4">
        <div className="mb-6 px-2">
          <h1 className="text-lg font-bold text-slate-900">Sand Supply</h1>
          <p className="text-xs text-slate-500">Order &amp; delivery tracker</p>
        </div>
        <nav className="flex flex-col gap-1">
          <NavItems orientation="vertical" />
        </nav>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:hidden">
          <h1 className="text-base font-bold text-slate-900">Sand Supply</h1>
        </header>

        <main className="flex-1 px-4 py-4 pb-20 md:px-8 md:py-6 md:pb-6">
          <Outlet />
        </main>

        <nav className="fixed inset-x-0 bottom-0 z-10 flex border-t border-slate-200 bg-white md:hidden">
          <NavItems orientation="horizontal" />
        </nav>
      </div>
    </div>
  );
}
