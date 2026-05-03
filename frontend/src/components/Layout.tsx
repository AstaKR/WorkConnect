import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/useAuthStore';
import { applyTheme } from '../utils/theme';
import {
  LayoutDashboard, FileText, History, CalendarDays, Columns, Users,
  Settings, LogOut, ChevronDown, Menu, X,
  Shield, Bell, Palette, User, Map, ShieldCheck,
  TrendingUp, Zap, BarChart3,
} from 'lucide-react';
import { APP_NAME } from '../constants';

// ── Nav structure ──────────────────────────────────────────────────────────────
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

// ── NavLink ───────────────────────────────────────────────────────────────────
function NavLink({ to, label, icon: Icon, active, onClick, compact }: {
  to: string; label: string; icon: any; active: boolean; onClick?: () => void; compact?: boolean;
}) {
  return (
    <Link to={to} onClick={onClick} title={compact ? label : undefined}
      className={`relative flex items-center ${compact ? 'justify-center px-0' : 'gap-3 px-3'} py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group select-none ${
        active ? 'bg-white/10 text-white' : 'text-white/55 hover:text-white hover:bg-white/6'
      }`}
    >
      {active && (
        <motion.span layoutId="nav-active-pill"
          className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500/20 to-violet-500/10 border border-white/10"
        />
      )}
      {active && !compact && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-gradient-to-b from-indigo-400 to-violet-500 rounded-r-full" />
      )}
      <div className={`relative z-10 w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
        active ? 'bg-white/10 text-indigo-300' : 'bg-transparent text-white/35 group-hover:bg-white/6 group-hover:text-white/70'
      }`}>
        <Icon className="w-4 h-4" />
      </div>
      {!compact && <span className="relative z-10 truncate leading-none">{label}</span>}
    </Link>
  );
}

// ── Sidebar Content ───────────────────────────────────────────────────────────
function SidebarContent({ onClose, compact }: { onClose?: () => void; compact?: boolean }) {
  const { user, logout, branding } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [settingsOpen, setSettingsOpen] = useState(
    SETTINGS_CHILDREN.some(() => location.pathname.startsWith('/settings'))
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
      <div className={`${compact ? 'px-3 pt-5 pb-4' : 'px-5 pt-6 pb-5'}`}>
        <div className={`flex ${compact ? 'justify-center' : 'items-center gap-3'}`}>
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
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 rounded-full"
              style={{ borderColor: 'var(--color-sidebar)' }} />
          </div>
          {!compact && (
            <div className="min-w-0">
              <p className="text-white font-extrabold text-sm tracking-tight leading-none">{APP_NAME}</p>
              {companyName
                ? <p className="text-white/35 text-[10px] uppercase tracking-widest mt-1 truncate">{companyName}</p>
                : <p className="text-white/25 text-[10px] mt-1">Workspace Portal</p>
              }
            </div>
          )}
        </div>
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
              {!compact && (
                <div className="flex items-center gap-2 px-3 mb-2">
                  <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.12em]">{group.group}</p>
                  <div className="flex-1 h-px bg-white/6" />
                </div>
              )}
              <div className="space-y-0.5">
                {visibleItems.map(item => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    label={item.label}
                    icon={item.icon}
                    active={location.pathname === item.to}
                    onClick={onClose}
                    compact={compact}
                  />
                ))}
              </div>
            </div>
          );
        })}

        {/* ── Settings accordion ── */}
        <div>
          {!compact && (
            <div className="flex items-center gap-2 px-3 mb-2">
              <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.12em]">Account</p>
              <div className="flex-1 h-px bg-white/6" />
            </div>
          )}

          <div className="space-y-0.5">
            <button
              onClick={() => setSettingsOpen(v => !v)}
              title={compact ? 'Settings' : undefined}
              className={`w-full flex items-center ${compact ? 'justify-center px-0' : 'gap-3 px-3'} py-2.5 rounded-xl text-sm font-medium transition-all duration-200 select-none ${
                settingsChildActive ? 'bg-white/10 text-white' : 'text-white/55 hover:text-white hover:bg-white/6'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                settingsChildActive ? 'bg-white/10 text-indigo-300' : 'text-white/35'
              }`}>
                <Settings className="w-4 h-4" />
              </div>
              {!compact && (
                <>
                  <span className="flex-1 text-left">Settings</span>
                  <motion.div animate={{ rotate: settingsOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown className="w-3.5 h-3.5 text-white/25" />
                  </motion.div>
                </>
              )}
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
                  <div className={`${compact ? 'mt-1 pb-1 space-y-0.5' : 'ml-11 pl-3 border-l border-white/8 mt-1 pb-1 space-y-0.5'}`}>
                    {SETTINGS_CHILDREN.filter(c => user && c.roles.includes(user.role)).map(child => {
                      const Icon = child.icon;
                      const active = location.pathname === child.to;
                      return compact ? (
                        <NavLink
                          key={child.to}
                          to={child.to}
                          label={child.label}
                          icon={child.icon}
                          active={active}
                          onClick={onClose}
                          compact
                        />
                      ) : (
                        <Link
                          key={child.to}
                          to={child.to}
                          onClick={onClose}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                            active ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/80 hover:bg-white/6'
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

        {compact ? (
          /* Compact: avatar + logout icon */
          <div className="flex flex-col items-center gap-1">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold shadow-lg">
                {initials}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 rounded-full"
                style={{ borderColor: 'var(--color-sidebar)' }} />
            </div>
            <button onClick={handleLogout} title="Sign out"
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* Full: user card + logout */
          <>
            <div className="flex items-center gap-3 px-3 py-3 rounded-2xl bg-white/5 border border-white/8 hover:bg-white/8 transition-colors cursor-default">
              <div className="relative flex-shrink-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold shadow-lg">
                  {initials}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 rounded-full"
                  style={{ borderColor: 'var(--color-sidebar)' }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-white text-xs font-bold truncate leading-tight">{user?.full_name}</p>
                <p className="text-white/35 text-[10px] truncate leading-tight mt-0.5">{user?.email}</p>
              </div>
              <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full flex-shrink-0 tracking-wide ${roleStyle.cls}`}>
                {roleStyle.label}
              </span>
            </div>
            <button onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150 group">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white/30 group-hover:text-red-400 transition-colors">
                <LogOut className="w-4 h-4" />
              </div>
              <span>Sign out</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Top Nav horizontal link ───────────────────────────────────────────────────
function TopNavItem({ to, label, icon: Icon, active, onClick }: {
  to: string; label: string; icon: any; active: boolean; onClick?: () => void;
}) {
  return (
    <Link to={to} onClick={onClick}
      className={`relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
        active ? 'bg-white/15 text-white' : 'text-white/55 hover:text-white hover:bg-white/8'
      }`}
    >
      {active && (
        <motion.span layoutId="topnav-active-pill"
          className="absolute inset-0 rounded-lg bg-white/10 border border-white/15"
        />
      )}
      <Icon className="relative z-10 w-4 h-4 flex-shrink-0" />
      <span className="relative z-10">{label}</span>
    </Link>
  );
}

// ── Top Nav Layout ────────────────────────────────────────────────────────────
function TopNavLayout() {
  const { user, logout, branding } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const role = user?.role ?? 'employee';
  const roleStyle = ROLE_STYLE[role] ?? ROLE_STYLE.employee;
  const initials = user?.full_name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() ?? '?';

  // Flatten all nav items
  const allNavItems = [
    ...NAV_GROUPS.flatMap(g => g.items.filter(i => user && i.roles.includes(user.role))),
    ...SETTINGS_CHILDREN.filter(c => user && c.roles.includes(user.role)),
  ];

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: 'var(--color-background)' }}>

      {/* ── Top Navigation Bar ─────────────────────────────────────────── */}
      <header className="flex-shrink-0 border-b border-white/10 shadow-lg"
        style={{ backgroundColor: 'var(--color-sidebar)' }}>
        <div className="flex items-center gap-3 px-4 h-14">

          {/* Logo + name */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-8 h-8 rounded-xl overflow-hidden ring-1 ring-white/15 shadow">
              {branding.logo ? (
                <img src={branding.logo} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
            <span className="text-white font-extrabold text-sm tracking-tight hidden sm:block">{APP_NAME}</span>
          </div>

          {/* Divider */}
          <div className="hidden lg:block w-px h-5 bg-white/15 flex-shrink-0" />

          {/* Nav items — desktop horizontal scroll */}
          <nav className="hidden lg:flex flex-1 overflow-x-auto scrollbar-none items-center gap-0.5 min-w-0">
            {NAV_GROUPS.map(group =>
              group.items
                .filter(item => user && item.roles.includes(user.role))
                .map(item => (
                  <TopNavItem key={item.to} to={item.to} label={item.label} icon={item.icon}
                    active={location.pathname === item.to} />
                ))
            )}
            <div className="w-px h-4 bg-white/15 mx-1 flex-shrink-0" />
            {SETTINGS_CHILDREN.filter(c => user && c.roles.includes(user.role)).map(child => (
              <TopNavItem key={child.to} to={child.to} label={child.label} icon={child.icon}
                active={location.pathname === child.to} />
            ))}
          </nav>

          {/* Mobile hamburger */}
          <button onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors ml-auto">
            <AnimatePresence mode="wait">
              {mobileOpen
                ? <motion.div key="x"    initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}><X className="w-5 h-5" /></motion.div>
                : <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}><Menu className="w-5 h-5" /></motion.div>
              }
            </AnimatePresence>
          </button>

          {/* User menu — desktop */}
          <div className="hidden lg:flex items-center gap-2 flex-shrink-0 ml-auto relative">
            <button onClick={() => setUserMenuOpen(v => !v)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-white/8 transition-colors">
              <div className="relative">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold shadow">
                  {initials}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-400 border-2 rounded-full"
                  style={{ borderColor: 'var(--color-sidebar)' }} />
              </div>
              <div className="text-left hidden xl:block">
                <p className="text-white text-xs font-bold leading-none">{user?.full_name?.split(' ')[0]}</p>
                <p className="text-white/35 text-[10px] leading-tight mt-0.5">{roleStyle.label}</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-white/30" />
            </button>

            <AnimatePresence>
              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-20"
                  >
                    <div className="px-4 py-3 border-b border-gray-50">
                      <p className="text-xs font-bold text-gray-900">{user?.full_name}</p>
                      <p className="text-[10px] text-gray-400 truncate">{user?.email}</p>
                      <span className={`inline-block text-[9px] font-bold uppercase px-2 py-0.5 rounded-full mt-1 ${roleStyle.cls.replace('border-amber-400/25', 'border-amber-200').replace('border-blue-400/25', 'border-blue-200').replace('border-emerald-400/25', 'border-emerald-200')}`}>
                        {roleStyle.label}
                      </span>
                    </div>
                    <button onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Mobile dropdown nav */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="overflow-hidden border-t border-white/10 lg:hidden"
            >
              <div className="px-3 py-3 space-y-1 max-h-[60vh] overflow-y-auto">
                {allNavItems.map(item => (
                  <Link key={item.to} to={item.to}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      location.pathname === item.to
                        ? 'bg-white/15 text-white'
                        : 'text-white/55 hover:text-white hover:bg-white/8'
                    }`}
                  >
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    {item.label}
                  </Link>
                ))}
                <div className="pt-2 border-t border-white/10">
                  <button onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all">
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}

// ── Sidebar Layout (full or compact) ─────────────────────────────────────────
function SidebarLayout({ compact, sidebarPosition }: { compact: boolean; sidebarPosition: string }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { branding } = useAuthStore();
  const isRight = sidebarPosition === 'right';

  const sidebarWidth = compact ? 'w-16' : 'w-64';

  return (
    <div className={`flex h-screen overflow-hidden ${isRight ? 'flex-row-reverse' : ''}`}
      style={{ background: 'var(--color-background)' }}>

      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 z-30 ${sidebarWidth} flex-shrink-0
          transition-transform duration-300 ease-in-out
          ${isRight ? 'right-0' : 'left-0'}
          ${sidebarOpen
            ? 'translate-x-0'
            : isRight
              ? 'translate-x-full lg:translate-x-0'
              : '-translate-x-full lg:translate-x-0'}
        `}
        style={{ backgroundColor: 'var(--color-sidebar)' }}
      >
        <SidebarContent onClose={() => setSidebarOpen(false)} compact={compact} />
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
          <button onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors ${isRight ? 'ml-auto' : ''}`}>
            <AnimatePresence mode="wait">
              {sidebarOpen
                ? <motion.div key="x"    initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}><X className="w-5 h-5" /></motion.div>
                : <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}><Menu className="w-5 h-5" /></motion.div>
              }
            </AnimatePresence>
          </button>

          <div className={`flex items-center gap-2.5 ${isRight ? 'mr-auto' : ''}`}>
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

// ── Layout shell (router) ─────────────────────────────────────────────────────
export default function Layout() {
  const { user } = useAuthStore();

  const layoutStyle    = user?.preferences?.layout_style    ?? 'sidebar';
  const sidebarPosition = user?.preferences?.sidebar_position ?? 'left';

  // Apply user's saved theme on every mount / preference change
  useEffect(() => {
    if (user?.preferences) applyTheme(user.preferences);
  }, [user?.preferences]);

  if (layoutStyle === 'topnav') return <TopNavLayout />;

  return (
    <SidebarLayout
      compact={layoutStyle === 'compact'}
      sidebarPosition={sidebarPosition}
    />
  );
}
