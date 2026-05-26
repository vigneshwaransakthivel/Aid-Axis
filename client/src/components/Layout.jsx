import { Outlet, NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Apple, 
  Pill, 
  Droplets, 
  FolderHeart,
  Stethoscope
} from 'lucide-react';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/nutrition', icon: Apple, label: 'Nutrition' },
  { path: '/medications', icon: Pill, label: 'Medications' },
  { path: '/blood-donor', icon: Droplets, label: 'Blood Donor' },
  { path: '/health-locker', icon: FolderHeart, label: 'Health Locker' },
];

export default function Layout() {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-56 bg-gradient-to-b from-teal-700 to-teal-800 text-white flex flex-col">
        <div className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-white to-teal-200 drop-shadow-md">Aid-Axis</h1>
            <p className="text-xs text-white/80 font-medium tracking-wide">Your Health Companion</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ path, icon: Icon, label }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `sidebar-item ${isActive ? 'active' : ''}`
              }
              end={path === '/'}
            >
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4">
          <div className="bg-white/10 rounded-lg p-3 text-center text-sm">
            <p className="text-white/80">Stay healthy, stay happy</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
