import { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/useAuthStore';
import {
  LayoutDashboard, FileText, History, CalendarDays, Columns, Users,
  Settings, LogOut, ChevronDown, Menu, X,
  Shield, Bell, Palette, User, Building2, Map, ShieldCheck,
  TrendingUp, Zap, BarChart3,
} from 'lucide-react';
import { APP_NAME } from '../constants';

// ── Nav structure ─────────────────────────────────────────────────────────────
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
      { label: 'CEO Dashboard',     to: '/ceo/dashboard',     icon: BarChart3,   roles: ['ceo'] },
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

const ROLE_STYLE: Record<string, { label: string; cls: string }> = {
  ceo:      { label: 'CEO',      cls: 'bg-amber-400/15 text-amber-300 border border-amber-400/25' },
  manager:  { label: 'Manager',  cls: 'bg-blue-400/15 text-blue-300 border border-blue-400/25' },
  employee: { label: 'Employee', cls: 'bg-emerald-400/15 text-emerald-300 border border-emerald-400/25' },
};

// ── Nav Link ──────────────────────────────────────────────────────────────────
function NavLink({ to, label, icon: Icon, active, onClick }: {
  to: string; label: string; icon: any; active: boolean; onClick?: () => void;
}) {
  return (
    <Link to={to} onClick={onClick}
      className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group select-none ${
        active
          ? 'bg-white/10 text-white'
          : 'text-white/55 hover:text-white hover:bg-white/6'
      }`}
    >
      {/* Active gradient pill indicator */}
      {active && (
        <motion.span
          layoutId="nav-active-pill"
          className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500/20 to-violet-500/10 border border-white/10"
        />
      )}
      {/* Left accent bar */}
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-gradient-to-b from-indigo-400 to-violet-500 rounded-r-full" />
      )}

      <div className={`relative z-10 w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
        active
          ? 'bg-white/10 text-indigo-300'
          : 'bg-transparent text-white/35 group-hover:bg-white/6 group-hover:text-white/70'
      }`}>
        <Icon className="w-4 h-4" />
      </div>

      <span className="relative z-10 truncate leading-none">{label}</span>
    </Link>
  );
}

// ── Sidebar Content ───────────────────────────────────────────────────────────
function SidebarContent({ onClose }: { onClose?: () => void }) {
  const { user, logout, branding } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [settingsOpen, setSettingsOpen] = useState(
    SETTINGS_CHILDREN.some(c => location.pathname.startsWith('/settings'))
  );

  const handleLogout = () => { logout(); navigate('/login'); };

  const role = user?.role ?? 'employee';
  const roleStyle = ROLE_STYLE[role] ?? ROLE_STYLE.employee;
  const initials = user?.full_name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() ?? '?';
  const companyName = branding.name && branding.name !== APP_NAME ? branding.name : '';
  const settingsChildActive = SETTINGS_CHILDREN.some(s => location.pathname === s.to);

  return (
    <div className="flex flex-col h-full">

      {/* ── Brand ─────────────────────────────────────────────────────────── */}
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center gap-3">
          {/* Logo */}
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 rounded-2xl overflow-hidden shadow-lg ring-1 ring-white/15">
              {branding.logo ? (
                <img src={branding.logo} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
              )}
            </div>
            {/* Glow dot */}
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-sidebar rounded-full" />
          </div>

          {/* Name + company */}
          <div className="min-w-0">
            <p className="text-white font-extrabold text-sm tracking-tight leading-none">{APP_NAME}</p>
            {companyName ? (
              <p className="text-white/35 text-[10px] uppercase tracking-widest mt-1 truncate">{companyName}</p>
            ) : (
              <p className="text-white/25 text-[10px] mt-1">Workspace Portal</p>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="mt-5 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      {/* ── Navigation ────────────────────────────────────────────────────── */}
      <nav className="flex-1 px-3 pb-3 overflow-y-auto space-y-5 scrollbar-none">
        {NAV_GROUPS.map(group => {
          if (!user || !group.roles.includes(user.role)) return null;
          const visibleItems = group.items.filter(item => user && item.roles.includes(user.role));
          if (!visibleItems.length) return null;

          return (
            <div key={group.group}>
              <div className="flex items-center gap-2 px-3 mb-2">
                <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.12em]">
                  {group.group}
                </p>
                <div className="flex-1 h-px bg-white/6" />
              </div>
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

        {/* ── Settings accordion ── */}
        <div>
          <div className="flex items-center gap-2 px-3 mb-2">
            <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.12em]">Account</p>
            <div className="flex-1 h-px bg-white/6" />
          </div>

          <div className="space-y-0.5">
            <button
              onClick={() => setSettingsOpen(v => !v)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 select-none ${
                settingsChildActive
                  ? 'bg-white/10 text-white'
                  : 'text-white/55 hover:text-white hover:bg-white/6'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                settingsChildActive ? 'bg-white/10 text-indigo-300' : 'text-white/35'
              }`}>
                <Settings className="w-4 h-4" />
              </div>
              <span className="flex-1 text-left">Settings</span>
              <motion.div animate={{ rotate: settingsOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown className="w-3.5 h-3.5 text-white/25" />
              </motion.div>
            </button>

            <AnimatePresence initial={false}>
              {settingsOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="ml-11 pl-3 border-l border-white/8 mt-1 pb-1 space-y-0.5">
                    {SETTINGS_CHILDREN.filter(c => user && c.roles.includes(user.role)).map(child => {
                      const Icon = child.icon;
                      const active = location.pathname === child.to;
                      return (
                        <Link
                          key={child.to}
                          to={child.to}
                          onClick={onClose}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                            active
                              ? 'bg-white/10 text-white'
                              : 'text-white/40 hover:text-white/80 hover:bg-white/6'
                          }`}
                        >
                          <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${active ? 'text-indigo-300' : 'text-white/30'}`} />
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
      <div className="px-3 pb-4 pt-2 space-y-1">
        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-3" />

        {/* User card */}
        <div className="flex items-center gap-3 px-3 py-3 rounded-2xl bg-white/5 border border-white/8 hover:bg-white/8 transition-colors cursor-default">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold shadow-lg">
              {initials}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-[#1a1f2e] rounded-full" />
          </div>

          {/* Name + email */}
          <div className="min-w-0 flex-1">
            <p className="text-white text-xs font-bold truncate leading-tight">{user?.full_name}</p>
            <p className="text-white/35 text-[10px] truncate leading-tight mt-0.5">{user?.email}</p>
          </div>

          {/* Role badge */}
          <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full flex-shrink-0 tracking-wide ${roleStyle.cls}`}>
            {roleStyle.label}
          </span>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150 group"
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white/30 group-hover:text-red-400 transition-colors">
            <LogOut className="w-4 h-4" />
          </div>
          <span>Sign out</span>
        </button>
      </div>
    </div>
  );
}

// ── Layout shell ─────────────────────────────────────────────────────────────
export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { branding } = useAuthStore();

  return (
    <div className="flex h-screen bg-background overflow-hidden">

      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-30 w-64 flex-shrink-0
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        style={{
          background: 'linear-gradient(160deg, #0f1523 0%, #141927 60%, #111520 100%)',
        }}
      >
        <SidebarContent onClose={() => setSidebarOpen(false)} />
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <AnimatePresence mode="wait">
              {sidebarOpen
                ? <motion.div key="x"    initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}><X className="w-5 h-5" /></motion.div>
                : <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }}  animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}><Menu className="w-5 h-5" /></motion.div>
              }
            </AnimatePresence>
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl overflow-hidden shadow-sm ring-1 ring-gray-200/60">
              {branding.logo ? (
                <img src={branding.logo} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                  <Zap className="w-3.5 h-3.5 text-white" />
                </div>
              )}
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
