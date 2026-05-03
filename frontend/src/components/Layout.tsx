import { useEffect, useState, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/useAuthStore';
import { applyTheme } from '../utils/theme';
import {
  LayoutDashboard, FileText, History, CalendarDays, Columns, Users,
  Settings, LogOut, ChevronDown, Menu, X, Home,
  Shield, Bell, Palette, User, Map, ShieldCheck,
  TrendingUp, Zap, BarChart3, Building2, Briefcase, Check,
} from 'lucide-react';
import { APP_NAME } from '../constants';

// ── Navigation groups (grouped dropdown structure) ────────────────────────────
const NAV_GROUPS = [
  {
    id: 'dashboard',
    group: 'Dashboard',
    icon: LayoutDashboard,
    roles: ['employee', 'manager', 'ceo'],
    items: [
      { label: 'My Dashboard',      to: '/employee/dashboard', icon: Home,       roles: ['employee', 'manager', 'ceo'] },
      { label: 'Manager Dashboard', to: '/manager/dashboard',  icon: TrendingUp, roles: ['manager', 'ceo'] },
      { label: 'CEO Dashboard',     to: '/ceo/dashboard',      icon: BarChart3,  roles: ['ceo'] },
    ],
  },
  {
    id: 'workspace',
    group: 'Workspace',
    icon: Briefcase,
    roles: ['employee', 'manager', 'ceo'],
    items: [
      { label: 'Work Report',    to: '/employee/report',   icon: FileText,     roles: ['employee', 'manager', 'ceo'] },
      { label: 'Kanban Board',   to: '/kanban',            icon: Columns,      roles: ['employee', 'manager', 'ceo'] },
      { label: 'Report History', to: '/employee/history',  icon: History,      roles: ['employee', 'manager', 'ceo'] },
      { label: 'Calendar',       to: '/employee/calendar', icon: CalendarDays, roles: ['employee', 'manager', 'ceo'] },
    ],
  },
  {
    id: 'management',
    group: 'Management',
    icon: Building2,
    roles: ['manager', 'ceo'],
    items: [
      { label: 'User Management', to: '/users', icon: Users,       roles: ['manager', 'ceo'] },
      { label: 'Role Management', to: '/roles', icon: ShieldCheck, roles: ['ceo'] },
    ],
  },
] as const;

const SETTINGS_GROUP = {
  id: 'settings',
  group: 'Settings',
  icon: Settings,
  roles: ['employee', 'manager', 'ceo'],
  items: [
    { label: 'Profile',       to: '/settings/profile',       icon: User,    roles: ['employee', 'manager', 'ceo'] },
    { label: 'Appearance',    to: '/settings/appearance',    icon: Palette, roles: ['employee', 'manager', 'ceo'] },
    { label: 'Notifications', to: '/settings/notifications', icon: Bell,    roles: ['employee', 'manager', 'ceo'] },
    { label: 'System Config', to: '/settings/system',        icon: Shield,  roles: ['ceo'] },
    { label: 'Locations',     to: '/settings/locations',     icon: Map,     roles: ['ceo'] },
  ],
} as const;

const ROLE_STYLE: Record<string, { label: string; cls: string }> = {
  ceo:      { label: 'CEO',      cls: 'bg-amber-400/15 text-amber-300 border border-amber-400/30' },
  manager:  { label: 'Manager',  cls: 'bg-blue-400/15 text-blue-300 border border-blue-400/30' },
  employee: { label: 'Employee', cls: 'bg-emerald-400/15 text-emerald-300 border border-emerald-400/30' },
};

type AnyGroup = typeof NAV_GROUPS[number] | typeof SETTINGS_GROUP;

// ── Utility: filter items by role ─────────────────────────────────────────────
function visibleItems(group: AnyGroup, role: string) {
  return group.items.filter(i => (i.roles as readonly string[]).includes(role));
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPACT SIDEBAR — floating group panel
// ═══════════════════════════════════════════════════════════════════════════════
function CompactGroupButton({
  group, items, isRight,
}: {
  group: AnyGroup;
  items: AnyGroup['items'][number][];
  isRight: boolean;
}) {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [panelTop, setPanelTop] = useState(0);
  const btnRef = useRef<HTMLButtonElement>(null);
  const Icon = group.icon;

  const hasActive = items.some(i => location.pathname === i.to);

  const handleOpen = () => {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPanelTop(Math.min(r.top, window.innerHeight - items.length * 52 - 64));
    }
    setOpen(v => !v);
  };

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleOpen}
        title={group.group}
        className={`relative w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 group/btn ${
          open || hasActive
            ? 'bg-white/15 text-white shadow-sm'
            : 'text-white/40 hover:text-white hover:bg-white/8'
        }`}
      >
        <Icon className="w-5 h-5" />
        {/* Active dot */}
        {hasActive && (
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-indigo-400 rounded-full shadow-sm shadow-indigo-400/50" />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Click-outside overlay */}
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

            {/* Floating panel */}
            <motion.div
              initial={{ opacity: 0, x: isRight ? 10 : -10, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: isRight ? 10 : -10, scale: 0.95 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              style={{
                position: 'fixed',
                top: panelTop,
                [isRight ? 'right' : 'left']: 72,
                zIndex: 50,
              }}
              className="w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
            >
              {/* Panel header */}
              <div className="flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-black text-gray-800 uppercase tracking-widest leading-none">
                    {group.group}
                  </p>
                  <p className="text-[9px] text-gray-400 mt-0.5">{items.length} items</p>
                </div>
              </div>

              {/* Items */}
              <div className="py-1.5">
                {items.map((item) => {
                  const isActive = location.pathname === item.to;
                  const ItemIcon = item.icon;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-all duration-150 ${
                        isActive
                          ? 'text-primary bg-primary/5 font-semibold'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 font-medium'
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isActive ? 'bg-primary/10' : 'bg-gray-100 group-hover:bg-gray-200'
                      }`}>
                        <ItemIcon className={`w-3.5 h-3.5 ${isActive ? 'text-primary' : 'text-gray-500'}`} />
                      </div>
                      <span className="flex-1 leading-none">{item.label}</span>
                      {isActive && <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// ── Compact sidebar content (icon grid + floating panels) ─────────────────────
function CompactSidebarContent({ isRight }: { isRight: boolean }) {
  const { user, logout, branding } = useAuthStore();
  const navigate = useNavigate();
  const initials = user?.full_name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() ?? '?';
  const role = user?.role ?? 'employee';

  const groups: AnyGroup[] = [
    ...NAV_GROUPS.filter(g => (g.roles as readonly string[]).includes(role)),
    SETTINGS_GROUP,
  ];

  return (
    <div className="flex flex-col items-center h-full py-4 gap-1.5">
      {/* Brand logo */}
      <div className="mb-2">
        <div className="w-10 h-10 rounded-2xl overflow-hidden shadow-lg ring-1 ring-white/15">
          {branding.logo
            ? <img src={branding.logo} alt="Logo" className="w-full h-full object-contain" />
            : <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
          }
        </div>
      </div>

      <div className="w-7 h-px bg-white/10 mb-1" />

      {/* Group buttons */}
      {groups.map(group => {
        const items = visibleItems(group, role);
        if (!items.length) return null;
        return (
          <CompactGroupButton
            key={group.id}
            group={group}
            items={items as AnyGroup['items'][number][]}
            isRight={isRight}
          />
        );
      })}

      {/* User + logout pinned to bottom */}
      <div className="mt-auto flex flex-col items-center gap-1.5">
        <div className="w-7 h-px bg-white/10 mb-1" />
        <div className="relative">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold shadow-lg">
            {initials}
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 rounded-full"
            style={{ borderColor: 'var(--color-sidebar)' }} />
        </div>
        <button onClick={() => { logout(); navigate('/login'); }} title="Sign out"
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all">
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FULL SIDEBAR — accordion groups
// ═══════════════════════════════════════════════════════════════════════════════
function FullSidebarContent({ onClose }: { onClose?: () => void }) {
  const { user, logout, branding } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const role = user?.role ?? 'employee';

  // Open the group containing the active route by default
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    const init = new Set<string>();
    const all: AnyGroup[] = [...NAV_GROUPS, SETTINGS_GROUP];
    all.forEach(g => {
      if (g.items.some(i => i.to === location.pathname)) init.add(g.id);
    });
    if (!init.size) init.add('workspace');
    return init;
  });

  const toggle = (id: string) =>
    setOpenGroups(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const roleStyle = ROLE_STYLE[role] ?? ROLE_STYLE.employee;
  const initials = user?.full_name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() ?? '?';
  const companyName = branding.name && branding.name !== APP_NAME ? branding.name : '';

  const allGroups: AnyGroup[] = [
    ...NAV_GROUPS.filter(g => (g.roles as readonly string[]).includes(role)),
    SETTINGS_GROUP,
  ];

  return (
    <div className="flex flex-col h-full">

      {/* ── Brand ──────────────────────────────────────────────────────── */}
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center gap-3">
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 rounded-2xl overflow-hidden shadow-lg ring-1 ring-white/15">
              {branding.logo
                ? <img src={branding.logo} alt="Logo" className="w-full h-full object-contain" />
                : <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
              }
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 rounded-full"
              style={{ borderColor: 'var(--color-sidebar)' }} />
          </div>
          <div className="min-w-0">
            <p className="text-white font-extrabold text-sm tracking-tight leading-none">{APP_NAME}</p>
            {companyName
              ? <p className="text-white/35 text-[10px] uppercase tracking-widest mt-1 truncate">{companyName}</p>
              : <p className="text-white/25 text-[10px] mt-1">Workspace Portal</p>
            }
          </div>
        </div>
        <div className="mt-5 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      {/* ── Nav groups (accordion) ─────────────────────────────────────── */}
      <nav className="flex-1 px-3 pb-3 overflow-y-auto scrollbar-none space-y-0.5">
        {allGroups.map(group => {
          const items = visibleItems(group, role);
          if (!items.length) return null;
          const Icon = group.icon;
          const isOpen = openGroups.has(group.id);
          const hasActive = items.some(i => location.pathname === i.to);

          return (
            <div key={group.id}>
              {/* Group header button */}
              <button
                onClick={() => toggle(group.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 select-none ${
                  hasActive && !isOpen
                    ? 'text-white bg-white/10'
                    : hasActive
                    ? 'text-white'
                    : 'text-white/55 hover:text-white hover:bg-white/6'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                  hasActive ? 'bg-white/10 text-indigo-300' : 'text-white/35'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="flex-1 text-left leading-none">{group.group}</span>
                {/* Item count badge */}
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full mr-1 ${
                  hasActive ? 'bg-indigo-500/30 text-indigo-300' : 'bg-white/8 text-white/30'
                }`}>
                  {items.length}
                </span>
                <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown className="w-3.5 h-3.5 text-white/25" />
                </motion.div>
              </button>

              {/* Items */}
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="ml-4 pl-3 border-l border-white/8 mt-1 mb-1 space-y-0.5">
                      {items.map(item => {
                        const ItemIcon = item.icon;
                        const isActive = location.pathname === item.to;
                        return (
                          <Link
                            key={item.to}
                            to={item.to}
                            onClick={onClose}
                            className={`relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 group ${
                              isActive
                                ? 'bg-white/10 text-white'
                                : 'text-white/40 hover:text-white hover:bg-white/6'
                            }`}
                          >
                            {isActive && (
                              <motion.span
                                layoutId={`sidebar-pill-${item.to}`}
                                className="absolute inset-0 rounded-lg bg-gradient-to-r from-indigo-500/20 to-violet-500/10 border border-white/10"
                              />
                            )}
                            {isActive && (
                              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 bg-gradient-to-b from-indigo-400 to-violet-500 rounded-r-full" />
                            )}
                            <div className={`relative z-10 w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${
                              isActive ? 'bg-white/10 text-indigo-300' : 'text-white/30 group-hover:text-white/60'
                            }`}>
                              <ItemIcon className="w-3.5 h-3.5" />
                            </div>
                            <span className="relative z-10 flex-1 leading-none">{item.label}</span>
                            {isActive && <Check className="relative z-10 w-3 h-3 text-indigo-400 flex-shrink-0" />}
                          </Link>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>

      {/* ── User footer ────────────────────────────────────────────────── */}
      <div className="px-3 pb-4 pt-2">
        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-3" />
        <div className="flex items-center gap-3 px-3 py-3 rounded-2xl bg-white/5 border border-white/8">
          <div className="relative flex-shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold shadow-lg">
              {initials}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 rounded-full"
              style={{ borderColor: 'var(--color-sidebar)' }} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white text-xs font-bold truncate leading-tight">{user?.full_name}</p>
            <p className="text-white/35 text-[10px] truncate mt-0.5">{user?.email}</p>
          </div>
          <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full flex-shrink-0 tracking-wide ${roleStyle.cls}`}>
            {roleStyle.label}
          </span>
        </div>
        <button onClick={() => { logout(); navigate('/login'); }}
          className="w-full mt-1 flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all group">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white/30 group-hover:text-red-400 transition-colors">
            <LogOut className="w-4 h-4" />
          </div>
          <span>Sign out</span>
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SIDEBAR LAYOUT (full + compact modes)
// ═══════════════════════════════════════════════════════════════════════════════
function SidebarLayout({ compact, sidebarPosition }: { compact: boolean; sidebarPosition: string }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { branding } = useAuthStore();
  const isRight = sidebarPosition === 'right';

  return (
    <div className={`flex h-screen overflow-hidden ${isRight ? 'flex-row-reverse' : ''}`}
      style={{ background: 'var(--color-background)' }}>

      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 z-30 flex-shrink-0
          ${compact ? 'w-64 lg:w-16' : 'w-64'}
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
        {/* Mobile: always full sidebar */}
        <div className="block lg:hidden h-full">
          <FullSidebarContent onClose={() => setSidebarOpen(false)} />
        </div>

        {/* Desktop: compact or full */}
        <div className="hidden lg:block h-full">
          {compact
            ? <CompactSidebarContent isRight={isRight} />
            : <FullSidebarContent onClose={() => setSidebarOpen(false)} />
          }
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
          <button onClick={() => setSidebarOpen(v => !v)}
            className={`p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors ${isRight ? 'order-last' : ''}`}>
            <AnimatePresence mode="wait">
              {sidebarOpen
                ? <motion.div key="x"    initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}><X className="w-5 h-5" /></motion.div>
                : <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}><Menu className="w-5 h-5" /></motion.div>
              }
            </AnimatePresence>
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl overflow-hidden shadow-sm ring-1 ring-gray-200/60">
              {branding.logo
                ? <img src={branding.logo} alt="Logo" className="w-full h-full object-contain" />
                : <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                    <Zap className="w-3.5 h-3.5 text-white" />
                  </div>
              }
            </div>
            <span className="font-extrabold text-gray-900 text-sm tracking-tight">{APP_NAME}</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TOP NAV — group dropdowns
// ═══════════════════════════════════════════════════════════════════════════════
function TopNavGroupDropdown({
  group, items, isOpen, onToggle, onClose,
}: {
  group: AnyGroup;
  items: AnyGroup['items'][number][];
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}) {
  const location = useLocation();
  const Icon = group.icon;
  const hasActive = items.some(i => location.pathname === i.to);

  return (
    <div className="relative flex-shrink-0">
      <button
        onClick={onToggle}
        className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all duration-150 ${
          hasActive || isOpen ? 'text-white bg-white/15' : 'text-white/60 hover:text-white hover:bg-white/8'
        }`}
      >
        {hasActive && (
          <motion.span layoutId="topnav-active-bg"
            className="absolute inset-0 rounded-lg bg-white/12 border border-white/20" />
        )}
        <Icon className="relative z-10 w-4 h-4" />
        <span className="relative z-10">{group.group}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.18 }}
          className="relative z-10"
        >
          <ChevronDown className="w-3.5 h-3.5 opacity-50" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute top-[calc(100%+8px)] left-0 min-w-[220px] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50"
          >
            {/* Dropdown header */}
            <div className="flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-700 uppercase tracking-widest leading-none">
                  {group.group}
                </p>
                <p className="text-[9px] text-gray-400 mt-0.5">{items.length} pages</p>
              </div>
            </div>

            {/* Dropdown items */}
            <div className="py-1.5">
              {items.map(item => {
                const isActive = location.pathname === item.to;
                const ItemIcon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={onClose}
                    className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-all duration-100 ${
                      isActive
                        ? 'text-primary bg-primary/5 font-semibold'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 font-medium'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                      isActive ? 'bg-primary/12' : 'bg-gray-100'
                    }`}>
                      <ItemIcon className={`w-3.5 h-3.5 ${isActive ? 'text-primary' : 'text-gray-500'}`} />
                    </div>
                    <span className="flex-1">{item.label}</span>
                    {isActive && <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TopNavLayout() {
  const { user, logout, branding } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExpandedGroup, setMobileExpandedGroup] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  const role = user?.role ?? 'employee';
  const roleStyle = ROLE_STYLE[role] ?? ROLE_STYLE.employee;
  const initials = user?.full_name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() ?? '?';

  const allGroups: AnyGroup[] = [
    ...NAV_GROUPS.filter(g => (g.roles as readonly string[]).includes(role)),
    SETTINGS_GROUP,
  ];

  // Close dropdown when clicking outside nav
  const handleGlobalClick = useCallback((e: MouseEvent) => {
    if (navRef.current && !navRef.current.contains(e.target as Node)) {
      setOpenGroup(null);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleGlobalClick);
    return () => document.removeEventListener('mousedown', handleGlobalClick);
  }, [handleGlobalClick]);

  // Close on route change
  useEffect(() => {
    setOpenGroup(null);
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: 'var(--color-background)' }}>

      {/* ── Top Navigation Bar ──────────────────────────────────────── */}
      <header className="flex-shrink-0 border-b border-white/8 z-30"
        style={{ backgroundColor: 'var(--color-sidebar)' }}>
        <div ref={navRef} className="flex items-center gap-2 px-4 h-14">

          {/* Logo + brand */}
          <Link to="/employee/dashboard" className="flex items-center gap-2.5 flex-shrink-0 mr-2">
            <div className="w-8 h-8 rounded-xl overflow-hidden ring-1 ring-white/20 shadow-md">
              {branding.logo
                ? <img src={branding.logo} alt="Logo" className="w-full h-full object-contain" />
                : <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-white" />
                  </div>
              }
            </div>
            <span className="text-white font-extrabold text-sm tracking-tight hidden sm:block">{APP_NAME}</span>
          </Link>

          {/* Divider */}
          <div className="hidden lg:block w-px h-5 bg-white/15 mx-1 flex-shrink-0" />

          {/* Desktop group dropdowns */}
          <nav className="hidden lg:flex items-center gap-0.5 flex-1 min-w-0 overflow-x-auto scrollbar-none">
            {allGroups.map(group => {
              const items = visibleItems(group, role);
              if (!items.length) return null;
              return (
                <TopNavGroupDropdown
                  key={group.id}
                  group={group}
                  items={items as AnyGroup['items'][number][]}
                  isOpen={openGroup === group.id}
                  onToggle={() => setOpenGroup(prev => prev === group.id ? null : group.id)}
                  onClose={() => setOpenGroup(null)}
                />
              );
            })}
          </nav>

          {/* Right side: user menu */}
          <div className="ml-auto flex items-center gap-2 flex-shrink-0">
            {/* Active page breadcrumb — desktop only */}
            {(() => {
              const allItems = allGroups.flatMap(g => visibleItems(g, role));
              const active = allItems.find(i => i.to === location.pathname);
              if (!active) return null;
              return (
                <span className="hidden xl:flex items-center gap-1.5 text-xs text-white/40 bg-white/6 px-3 py-1.5 rounded-lg border border-white/8">
                  <active.icon className="w-3.5 h-3.5" />
                  {active.label}
                </span>
              );
            })()}

            {/* User avatar dropdown — desktop */}
            <div className="hidden lg:block relative group">
              <button
                onClick={() => setOpenGroup(prev => prev === 'user' ? null : 'user')}
                className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-white/8 transition-colors"
              >
                <div className="relative">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold shadow-md">
                    {initials}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-400 border-2 rounded-full"
                    style={{ borderColor: 'var(--color-sidebar)' }} />
                </div>
                <div className="text-left hidden xl:block">
                  <p className="text-white text-xs font-bold leading-none">{user?.full_name?.split(' ')[0]}</p>
                  <p className="text-white/35 text-[10px] mt-0.5">{roleStyle.label}</p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-white/30 hidden xl:block" />
              </button>

              <AnimatePresence>
                {openGroup === 'user' && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-[calc(100%+8px)] w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50"
                  >
                    {/* User info */}
                    <div className="px-4 py-3.5 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-sm font-bold shadow">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate">{user?.full_name}</p>
                          <p className="text-[10px] text-gray-400 truncate">{user?.email}</p>
                        </div>
                      </div>
                      <span className={`inline-block text-[9px] font-bold uppercase px-2 py-0.5 rounded-full mt-2 tracking-wide ${roleStyle.cls}`}>
                        {roleStyle.label}
                      </span>
                    </div>
                    {/* Quick links */}
                    <div className="py-1">
                      {[
                        { label: 'Profile', to: '/settings/profile', icon: User },
                        { label: 'Appearance', to: '/settings/appearance', icon: Palette },
                      ].map(({ label, to, icon: LinkIcon }) => (
                        <Link key={to} to={to} onClick={() => setOpenGroup(null)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 font-medium transition-colors">
                          <LinkIcon className="w-4 h-4 text-gray-400" />
                          {label}
                        </Link>
                      ))}
                    </div>
                    <div className="border-t border-gray-100 py-1">
                      <button onClick={() => { logout(); navigate('/login'); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 font-medium transition-colors">
                        <LogOut className="w-4 h-4" />
                        Sign out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile hamburger */}
            <button onClick={() => setMobileOpen(v => !v)}
              className="lg:hidden p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors">
              <AnimatePresence mode="wait">
                {mobileOpen
                  ? <motion.div key="x"    initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}><X className="w-5 h-5" /></motion.div>
                  : <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}><Menu className="w-5 h-5" /></motion.div>
                }
              </AnimatePresence>
            </button>
          </div>
        </div>

        {/* Mobile dropdown nav — accordion groups */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="overflow-hidden border-t border-white/10 lg:hidden"
            >
              <div className="px-3 py-3 space-y-1 max-h-[70vh] overflow-y-auto">
                {allGroups.map(group => {
                  const items = visibleItems(group, role);
                  if (!items.length) return null;
                  const Icon = group.icon;
                  const isExp = mobileExpandedGroup === group.id;
                  const hasAct = items.some(i => location.pathname === i.to);

                  return (
                    <div key={group.id}>
                      <button
                        onClick={() => setMobileExpandedGroup(prev => prev === group.id ? null : group.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                          hasAct ? 'bg-white/15 text-white' : 'text-white/60 hover:text-white hover:bg-white/8'
                        }`}
                      >
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${hasAct ? 'bg-white/15 text-white' : 'bg-white/8 text-white/50'}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="flex-1 text-left">{group.group}</span>
                        <span className="text-[9px] bg-white/10 px-1.5 py-0.5 rounded-full text-white/40">{items.length}</span>
                        <motion.div animate={{ rotate: isExp ? 180 : 0 }} transition={{ duration: 0.18 }}>
                          <ChevronDown className="w-3.5 h-3.5 text-white/30" />
                        </motion.div>
                      </button>

                      <AnimatePresence initial={false}>
                        {isExp && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.18 }}
                            className="overflow-hidden"
                          >
                            <div className="ml-4 pl-3 border-l border-white/10 mt-1 mb-1 space-y-0.5">
                              {items.map(item => {
                                const isActive = location.pathname === item.to;
                                const ItemIcon = item.icon;
                                return (
                                  <Link
                                    key={item.to}
                                    to={item.to}
                                    onClick={() => setMobileOpen(false)}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                                      isActive ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white hover:bg-white/8'
                                    }`}
                                  >
                                    <ItemIcon className="w-4 h-4 flex-shrink-0" />
                                    <span className="flex-1">{item.label}</span>
                                    {isActive && <Check className="w-3.5 h-3.5 text-indigo-300" />}
                                  </Link>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}

                {/* Mobile user + logout */}
                <div className="border-t border-white/10 pt-2 mt-1">
                  <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white/8 mb-1">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold">
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-white text-sm font-bold truncate">{user?.full_name}</p>
                      <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full tracking-wide ${roleStyle.cls}`}>
                        {roleStyle.label}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => { logout(); navigate('/login'); }}
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

      {/* ── Content ──────────────────────────────────────────────────── */}
      {/* Click outside to close any open dropdown */}
      {openGroup && openGroup !== 'user' && (
        <div className="fixed inset-0 z-20" onClick={() => setOpenGroup(null)} />
      )}
      <main className="flex-1 overflow-y-auto relative z-10">
        <Outlet />
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LAYOUT ROOT
// ═══════════════════════════════════════════════════════════════════════════════
export default function Layout() {
  const { user } = useAuthStore();
  const layoutStyle     = user?.preferences?.layout_style     ?? 'sidebar';
  const sidebarPosition = user?.preferences?.sidebar_position ?? 'left';

  // Apply saved theme on mount and whenever preferences change
  useEffect(() => {
    if (user?.preferences?.primary_color) {
      applyTheme(user.preferences);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.preferences?.primary_color]);

  if (layoutStyle === 'topnav') return <TopNavLayout />;

  return (
    <SidebarLayout
      compact={layoutStyle === 'compact'}
      sidebarPosition={sidebarPosition}
    />
  );
}
