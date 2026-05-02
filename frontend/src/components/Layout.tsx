import { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/useAuthStore';
import {
  LayoutDashboard, FileText, History, CalendarDays, Columns, Users,
  Settings, LogOut, ChevronDown, Menu,
  Shield, Bell, Palette, User, Building2, Map, ShieldCheck,
  TrendingUp, Zap,
} from 'lucide-react';
import { APP_NAME } from '../constants';

// ── Nav structure with groups ─────────────────────────────────────────────────
const NAV_GROUPS = [
  {
    group: 'Workspace',
    roles: ['employee', 'manager', 'ceo'],
    items: [
      { label: 'My Dashboard',   to: '/employee/dashboard', icon: LayoutDashboard, roles: ['employee', 'manager', 'ceo'] },
      { label: 'Work Report',    to: '/employee/report',    icon: FileText,         roles: ['employee', 'manager', 'ceo'] },
      { label: 'Kanban Board',   to: '/kanban',             icon: Columns,          roles: ['employee', 'manager', 'ceo'] },
      { label: 'Report History', to: '/employee/history',   icon: History,          roles: ['employee', 'manager', 'ceo'] },
      { label: 'Calendar',       to: '/employee/calendar',  icon: CalendarDays,     roles: ['employee', 'manager', 'ceo'] },
    ],
  },
  {
    group: 'Management',
    roles: ['manager', 'ceo'],
    items: [
      { label: 'Manager Dashboard', to: '/manager/dashboard', icon: TrendingUp,  roles: ['manager', 'ceo'] },
      { label: 'CEO Dashboard',     to: '/ceo/dashboard',     icon: Building2,   roles: ['ceo'] },
      { label: 'User Management',   to: '/users',             icon: Users,       roles: ['manager', 'ceo'] },
      { label: 'Role Management',   to: '/roles',             icon: ShieldCheck, roles: ['ceo'] },
    ],
  },
];

const SETTINGS_CHILDREN = [
  { label: 'Profile',       to: '/settings/profile',       icon: User,    roles: ['employee', 'manager', 'ceo'] },
  { label: 'Appearance',    to: '/settings/appearance',    icon: Palette, roles: ['employee', 'manager', 'ceo'] },
  { label: 'Notifications', to: '/settings/notifications', icon: Bell,    roles: ['employee', 'manager', 'ceo'] },
  { label: 'System Config', to: '/settings/system',        icon: Shield,  roles: ['ceo'] },
  { label: 'Locations',     to: '/settings/locations',     icon: Map,     roles: ['ceo'] },
];

const ROLE_META: Record<string, { label: string; color: string }> = {
  ceo:      { label: 'CEO',      color: 'bg-amber-400/20 text-amber-300 border-amber-400/30' },
  manager:  { label: 'Manager',  color: 'bg-blue-400/20 text-blue-300 border-blue-400/30' },
  employee: { label: 'Employee', color: 'bg-green-400/20 text-green-300 border-green-400/30' },
};

// ── Single nav link ───────────────────────────────────────────────────────────
function NavLink({
  to, label, icon: Icon, active, onClick,
}: { to: string; label: string; icon: any; active: boolean; onClick?: () => void }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`
        group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
        transition-all duration-150 select-none
        ${active
          ? 'bg-white/15 text-white shadow-sm'
          : 'text-white/60 hover:bg-white/8 hover:text-white/90'
        }
      `}
    >
      {/* Active left accent */}
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-blue-400 rounded-r-full" />
      )}
      <Icon className={`w-4 h-4 flex-shrink-0 transition-colors ${active ? 'text-blue-400' : 'text-white/40 group-hover:text-white/70'}`} />
      <span className="truncate">{label}</span>
    </Link>
  );
}

// ── Sidebar content ───────────────────────────────────────────────────────────
function SidebarContent({ onClose }: { onClose?: () => void }) {
  const { user, logout, branding } = useAuthStore();
  const companyName = branding.name && branding.name !== APP_NAME ? branding.name : '';
  const location = useLocation();
  const navigate = useNavigate();
  const [settingsOpen, setSettingsOpen] = useState(
    SETTINGS_CHILDREN.some(c => location.pathname.startsWith('/settings'))
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const role = user?.role ?? 'employee';
  const roleMeta = ROLE_META[role] ?? ROLE_META.employee;
  const initials = user?.full_name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() ?? '?';

  const settingsChildActive = SETTINGS_CHILDREN.some(s => location.pathname === s.to);

  return (
    <div className="flex flex-col h-full">

      {/* ── Brand header ──────────────────────────────────────────────────── */}
      <div className="px-4 pt-5 pb-4 border-b border-white/8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shadow-lg overflow-hidden p-0.5 flex-shrink-0">
            {branding.logo ? (
              <img src={branding.logo} alt="Logo" className="w-full h-full object-contain rounded-xl" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-400 to-indigo-600 rounded-xl flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white font-extrabold text-sm leading-tight tracking-tight">{APP_NAME}</p>
            {companyName && (
              <p className="text-white/35 text-[9px] uppercase tracking-widest mt-0.5 truncate">{companyName}</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Navigation ────────────────────────────────────────────────────── */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
        {NAV_GROUPS.map(group => {
          // Only show group if user has any role that matches
          if (!user || !group.roles.includes(user.role)) return null;

          const visibleItems = group.items.filter(item => user && item.roles.includes(user.role));
          if (!visibleItems.length) return null;

          return (
            <div key={group.group}>
              <p className="px-3 mb-2 text-[10px] font-bold text-white/25 uppercase tracking-widest">
                {group.group}
              </p>
              <div className="space-y-0.5">
                {visibleItems.map(item => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    label={item.label}
                    icon={item.icon}
                    active={location.pathname === item.to}
                    onClick={onClose}
                  />
                ))}
              </div>
            </div>
          );
        })}

        {/* ── Settings accordion ────────────────────────────────────────── */}
        <div>
          <p className="px-3 mb-2 text-[10px] font-bold text-white/25 uppercase tracking-widest">
            Account
          </p>
          <div className="space-y-0.5">
            <button
              onClick={() => setSettingsOpen(v => !v)}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                transition-all duration-150 select-none
                ${settingsChildActive
                  ? 'bg-white/15 text-white'
                  : 'text-white/60 hover:bg-white/8 hover:text-white/90'
                }
              `}
            >
              <Settings className={`w-4 h-4 flex-shrink-0 ${settingsChildActive ? 'text-blue-400' : 'text-white/40'}`} />
              <span className="flex-1 text-left truncate">Settings</span>
              <motion.span animate={{ rotate: settingsOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown className="w-3.5 h-3.5 text-white/30" />
              </motion.span>
            </button>

            <AnimatePresence initial={false}>
              {settingsOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="ml-3 pl-3 border-l border-white/10 mt-0.5 space-y-0.5 pb-1">
                    {SETTINGS_CHILDREN
                      .filter(c => user && c.roles.includes(user.role))
                      .map(child => {
                        const Icon = child.icon;
                        const active = location.pathname === child.to;
                        return (
                          <Link
                            key={child.to}
                            to={child.to}
                            onClick={onClose}
                            className={`
                              flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium
                              transition-all duration-150
                              ${active
                                ? 'bg-white/15 text-white'
                                : 'text-white/50 hover:bg-white/8 hover:text-white/80'
                              }
                            `}
                          >
                            <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${active ? 'text-blue-400' : 'text-white/30'}`} />
                            {child.label}
                          </Link>
                        );
                      })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </nav>

      {/* ── User footer ───────────────────────────────────────────────────── */}
      <div className="px-3 pb-4 pt-3 border-t border-white/8 space-y-1">
        {/* User card */}
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/6 border border-white/8 mb-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-md">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white text-xs font-semibold truncate leading-tight">{user?.full_name}</p>
            <p className="text-white/40 text-[10px] truncate leading-tight mt-0.5">{user?.email}</p>
          </div>
          <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${roleMeta.color} flex-shrink-0 tracking-wide`}>
            {roleMeta.label}
          </span>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-white/50 hover:bg-red-500/15 hover:text-red-400 transition-all duration-150 group"
        >
          <LogOut className="w-4 h-4 group-hover:text-red-400 transition-colors" />
          <span>Sign out</span>
        </button>
      </div>
    </div>
  );
}

// ── Layout shell ─────────────────────────────────────────────────────────────
export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background overflow-hidden">

      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        style={{ backgroundColor: 'var(--color-sidebar)' }}
        className={`
          fixed lg:static inset-y-0 left-0 z-30 w-60 flex-shrink-0
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <SidebarContent onClose={() => setSidebarOpen(false)} />
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-extrabold text-gray-900 text-sm tracking-tight">{APP_NAME}</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
