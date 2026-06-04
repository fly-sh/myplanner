import { Outlet, NavLink } from 'react-router-dom';

const navItems = [
  { to: '/', label: '채팅', icon: '💬' },
  { to: '/calendar', label: '일정', icon: '📅' },
  { to: '/todos', label: '할일', icon: '✅' },
  { to: '/notes', label: '메모', icon: '📝' },
];

export default function Layout() {
  return (
    <div className="flex flex-col min-h-screen max-w-lg mx-auto">
      <header className="bg-indigo-500 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-10 shadow">
        <h1 className="text-lg font-bold">내 플래너</h1>
        <span className="text-sm opacity-80">
          {new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}
        </span>
      </header>

      <main className="flex-1 overflow-y-auto pb-20 px-4 py-4">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around max-w-lg mx-auto z-10">
        {navItems.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center py-2 px-4 text-xs transition-colors ${
                isActive ? 'text-indigo-500 font-semibold' : 'text-gray-400'
              }`
            }
          >
            <span className="text-xl mb-0.5">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
