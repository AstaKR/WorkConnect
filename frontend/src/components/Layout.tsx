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

// ── Nav groups with descriptions & accent colours ─────────────────────────────
const NAV_GROUPS = [
  {
    id: 'dashboard',
    group: 'Dashboard',
    icon: LayoutDashboard,
    accent: { bg: 'bg-blue-100', text: 'text-blue-600', headerFrom: 'from-blue-50', active: 'bg-blue-50 border-blue-200/70' },
    roles: ['employee', 'manager', 'ceo'],
    items: [
      { label: 'My Dashboard',      desc: 'Personal overview & daily metrics',        to: '/employee/dashboard', icon: Home,       roles: ['employee', 'manager', 'ceo'] },
      { label: 'Manager Dashboard', desc: 'Team performance & pending approvals',      to: '/manager/dashboard',  icon: TrendingUp, roles: ['manager', 'ceo'] },
      { label: 'CEO Dashboard',     desc: 'Company-wide analytics & insights',         to: '/ceo/dashboard',      icon: BarChart3,  roles: ['ceo'] },
    ],
  },
  {
    id: 'workspace',
    group: 'Workspace',
    icon: Briefcase,
    accent: { bg: 'bg-violet-100', text: 'text-violet-600', headerFrom: 'from-violet-50', active: 'bg-violet-50 border-violet-200/70' },
    roles: ['employee', 'manager', 'ceo'],
    items: [
      { label: 'Work Report',    desc: 'Log & submit daily work activities',   to: '/employee/report',   icon: FileText,     roles: ['employee', 'manager', 'ceo'] },
      { label: 'Kanban Board',   desc: 'Visual task management & tracking',    to: '/kanban',            icon: Columns,      roles: ['employee', 'manager', 'ceo'] },
      { label: 'Report History', desc: 'Browse & export past work reports',    to: '/employee/history',  icon: History,      roles: ['employee', 'manager', 'ceo'] },
      { label: 'Calendar',       desc: 'Schedule, events & planning view',     to: '/employee/calendar', icon: CalendarDays, roles: ['employee', 'manager', 'ceo'] },
    ],
  },
  {
    id: 'management',
    group: 'Management',
    icon: Building2,
    accent: { bg: 'bg-emerald-100', text: 'text-emerald-600', headerFrom: 'from-emerald-50', active: 'bg-emerald-50 border-emerald-200/70' },
    roles: ['manager', 'ceo'],
    items: [
      { label: 'User Management', desc: 'Add, edit & manage team members',        to: '/users', icon: Users,       roles: ['manager', 'ceo'] },
      { label: 'Role Management', desc: 'Configure access control & permissions', to: '/roles', icon: ShieldCheck, roles: ['ceo'] },
    ],
  },
] as const;

const SETTINGS_GROUP = {
  id: 'settings',
  group: 'Settings',
  icon: Settings,
  accent: { bg: 'bg-slate-100', text: 'text-slate-600', headerFrom: 'from-slate-50', active: 'bg-slate-50 border-slate-200/70' },
  roles: ['employee', 'manager', 'ceo'],
  items: [
    { label: 'Profile',       desc: 'Personal info, photo & preferences',  to: '/settings/profile',       icon: User,    roles: ['employee', 'manager', 'ceo'] },
    { label: 'Appearance',    desc: 'Themes, layout & color customization', to: '/settings/appearance',    icon: Palette, roles: ['employee', 'manager', 'ceo'] },
    { label: 'Notifications', desc: 'Alert & notification preferences',     to: '/settings/notifications', icon: Bell,    roles: ['employee', 'manager', 'ceo'] },
    { label: 'System Config', desc: 'Global platform settings & API keys',  to: '/settings/system',        icon: Shield,  roles: ['ceo'] },
    { label: 'Locations',     desc: 'Office & remote work locations',       to: '/settings/locations',     icon: Map,     roles: ['ceo'] },
  ],
} as const;

const ROLE_STYLE: Record<string, { label: string; cls: string }> = {
  ceo:      { label: 'CEO',      cls: 'bg-amber-400/15 text-amber-300 border border-amber-400/30' },
  manager:  { label: 'Manager',  cls: 'bg-blue-400/15 text-blue-300 border border-blue-400/30' },
  employee: { label: 'Employee', cls: 'bg-emerald-400/15 text-emerald-300 border border-emerald-400/30' },
};

type AnyGroup = typeof NAV_GROUPS[number] | typeof SETTINGS_GROUP;

function visibleItems(group: AnyGroup, role: string) {
  return group.items.filter(i => (i.roles as readonly string[]).includes(role));
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPACT SIDEBAR — floating panels
// ═══════════════════════════════════════════════════════════════════════════════
function CompactGroupButton({ group, items, isRight }: {
  group: AnyGroup; items: AnyGroup['items'][number][]; isRight: boolean;
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
      setPanelTop(Math.min(r.top, window.innerHeight - items.length * 60 - 72));
    }
    setOpen(v => !v);
  };

  return (
    <>
      <button ref={btnRef} onClick={handleOpen} title={group.group}
        className={`relative w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 ${
          open || hasActive ? 'bg-white/15 text-white shadow-sm' : 'text-white/40 hover:text-white hover:bg-white/8'
        }`}
      >
        <Icon className="w-5 h-5" />
        {hasActive && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-indigo-400 rounded-full" />}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, x: isRight ? 10 : -10, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: isRight ? 10 : -10, scale: 0.95 }}
              transition={{ duration: 0.14, ease: 'easeOut' }}
              style={{ position: 'fixed', top: panelTop, [isRight ? 'right' : 'left']: 72, zIndex: 50 }}
              className="w-60 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
            >
              <div className={`flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r ${group.accent.headerFrom} to-white border-b border-gray-100`}>
                <div className={`w-7 h-7 rounded-lg ${group.accent.bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-4 h-4 ${group.accent.text}`} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-700 uppercase tracking-widest">{group.group}</p>
                  <p className="text-[9px] text-gray-400 mt-0.5">{items.length} pages</p>
                </div>
              </div>
              <div className="py-1.5">
                {items.map(item => {
                  const isActive = location.pathname === item.to;
                  const ItemIcon = item.icon;
                  return (
                    <Link key={item.to} to={item.to} onClick={() => setOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 mx-1.5 rounded-xl text-sm transition-all ${
                        isActive ? `${group.accent.active} border font-semibold` : 'text-gray-700 hover:bg-gray-50 border border-transparent font-medium'
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${isActive ? group.accent.bg : 'bg-gray-100'}`}>
                        <ItemIcon className={`w-3.5 h-3.5 ${isActive ? group.accent.text : 'text-gray-500'}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs font-semibold leading-none ${isActive ? group.accent.text : 'text-gray-800'}`}>{item.label}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5 truncate">{(item as any).desc ?? ''}</p>
                      </div>
                      {isActive && <Check className={`w-3.5 h-3.5 flex-shrink-0 ${group.accent.text}`} />}
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

function CompactSidebarContent({ isRight }: { isRight: boolean }) {
  const { user, logout, branding } = useAuthStore();
  const navigate = useNavigate();
  const initials = user?.full_name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() ?? '?';
  const role = user?.role ?? 'employee';
  const groups: AnyGroup[] = [...NAV_GROUPS.filter(g => (g.roles as readonly string[]).includes(role)), SETTINGS_GROUP];

  return (
    <div className="flex flex-col items-center h-full py-4 gap-1.5">
      <div className="mb-2">
        <div className="w-10 h-10 rounded-2xl overflow-hidden shadow-lg ring-1 ring-white/15">
          {branding.logo
            ? <img src={branding.logo} alt="Logo" className="w-full h-full object-contain" />
            : <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center"><Zap className="w-5 h-5 text-white" /></div>
          }
        </div>
      </div>
      <div className="w-7 h-px bg-white/10 mb-1" />
      {groups.map(group => {
        const items = visibleItems(group, role);
        if (!items.length) return null;
        return <CompactGroupButton key={group.id} group={group} items={items as AnyGroup['items'][number][]} isRight={isRight} />;
      })}
      <div className="mt-auto flex flex-col items-center gap-1.5">
        <div className="w-7 h-px bg-white/10 mb-1" />
        <div className="relative">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold shadow-lg">{initials}</div>
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 rounded-full" style={{ borderColor: 'var(--color-sidebar)' }} />
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
  const roleStyle = ROLE_STYLE[role] ?? ROLE_STYLE.employee;
  const initials = user?.full_name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() ?? '?';
  const companyName = branding.name && branding.name !== APP_NAME ? branding.name : '';

  const allGroups: AnyGroup[] = [...NAV_GROUPS.filter(g => (g.roles as readonly string[]).includes(role)), SETTINGS_GROUP];

  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    const init = new Set<string>();
    allGroups.forEach(g => { if (g.items.some(i => i.to === location.pathname)) init.add(g.id); });
    if (!init.size) init.add('workspace');
    return init;
  });

  const toggle = (id: string) => setOpenGroups(prev => {
    const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n;
  });

  return (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center gap-3">
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 rounded-2xl overflow-hidden shadow-lg ring-1 ring-white/15">
              {branding.logo
                ? <img src={branding.logo} alt="Logo" className="w-full h-full object-contain" />
                : <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center"><Zap className="w-5 h-5 text-white" /></div>
              }
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 rounded-full" style={{ borderColor: 'var(--color-sidebar)' }} />
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

      {/* Accordion nav */}
      <nav className="flex-1 px-3 pb-3 overflow-y-auto scrollbar-none space-y-0.5">
        {allGroups.map(group => {
          const items = visibleItems(group, role);
          if (!items.length) return null;
          const Icon = group.icon;
          const isOpen = openGroups.has(group.id);
          const hasActive = items.some(i => location.pathname === i.to);

          return (
            <div key={group.id}>
              <button onClick={() => toggle(group.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 select-none ${
                  hasActive && !isOpen ? 'text-white bg-white/10' : hasActive ? 'text-white' : 'text-white/55 hover:text-white hover:bg-white/6'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${hasActive ? 'bg-white/10 text-indigo-300' : 'text-white/35'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="flex-1 text-left leading-none">{group.group}</span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full mr-0.5 ${hasActive ? 'bg-indigo-500/30 text-indigo-300' : 'bg-white/8 text-white/25'}`}>
                  {items.length}
                </span>
                <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown className="w-3.5 h-3.5 text-white/25" />
                </motion.div>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="ml-4 pl-3 border-l border-white/8 mt-1 mb-1 space-y-0.5">
                      {items.map(item => {
                        const ItemIcon = item.icon;
                        const isActive = location.pathname === item.to;
                        return (
                          <Link key={item.to} to={item.to} onClick={onClose}
                            className={`relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 group ${
                              isActive ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white hover:bg-white/6'
                            }`}
                          >
                            {isActive && (
                              <>
                                <motion.span layoutId={`pill-${item.to}`}
                                  className="absolute inset-0 rounded-lg bg-gradient-to-r from-indigo-500/20 to-violet-500/10 border border-white/10" />
                                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 bg-gradient-to-b from-indigo-400 to-violet-500 rounded-r-full" />
                              </>
                            )}
                            <div className={`relative z-10 w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${isActive ? 'bg-white/10 text-indigo-300' : 'text-white/30 group-hover:text-white/60'}`}>
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

      {/* User footer */}
      <div className="px-3 pb-4 pt-2">
        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-3" />
        <div className="flex items-center gap-3 px-3 py-3 rounded-2xl bg-white/5 border border-white/8">
          <div className="relative flex-shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold shadow-lg">{initials}</div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 rounded-full" style={{ borderColor: 'var(--color-sidebar)' }} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white text-xs font-bold truncate leading-tight">{user?.full_name}</p>
            <p className="text-white/35 text-[10px] truncate mt-0.5">{user?.email}</p>
          </div>
          <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full flex-shrink-0 tracking-wide ${roleStyle.cls}`}>{roleStyle.label}</span>
        </div>
        <button onClick={() => { logout(); navigate('/login'); }}
          className="w-full mt-1 flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all group">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white/30 group-hover:text-red-400 transition-colors"><LogOut className="w-4 h-4" /></div>
          <span>Sign out</span>
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SIDEBAR LAYOUT
// ═══════════════════════════════════════════════════════════════════════════════
function SidebarLayout({ compact, sidebarPosition }: { compact: boolean; sidebarPosition: string }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { branding } = useAuthStore();
  const isRight = sidebarPosition === 'right';

  return (
    <div className={`flex h-screen overflow-hidden ${isRight ? 'flex-row-reverse' : ''}`}
      style={{ background: 'var(--color-background)' }}>
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)} />
        )}
      </AnimatePresence>

      <aside
        className={`fixed lg:static inset-y-0 z-30 flex-shrink-0 ${compact ? 'w-64 lg:w-16' : 'w-64'}
          transition-transform duration-300 ease-in-out
          ${isRight ? 'right-0' : 'left-0'}
          ${sidebarOpen ? 'translate-x-0' : isRight ? 'translate-x-full lg:translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        style={{ backgroundColor: 'var(--color-sidebar)' }}
      >
        <div className="block lg:hidden h-full"><FullSidebarContent onClose={() => setSidebarOpen(false)} /></div>
        <div className="hidden lg:block h-full">
          {compact ? <CompactSidebarContent isRight={isRight} /> : <FullSidebarContent onClose={() => setSidebarOpen(false)} />}
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
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
                : <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center"><Zap className="w-3.5 h-3.5 text-white" /></div>
              }
            </div>
            <span className="font-extrabold text-gray-900 text-sm tracking-tight">{APP_NAME}</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto"><Outlet /></main>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TOP NAV — professional group dropdowns
// ═══════════════════════════════════════════════════════════════════════════════
function TopNavDropdown({ group, items, isOpen, onToggle, onClose }: {
  group: AnyGroup; items: AnyGroup['items'][number][];
  isOpen: boolean; onToggle: () => void; onClose: () => void;
}) {
  const location = useLocation();
  const Icon = group.icon;
  const hasActive = items.some(i => location.pathname === i.to);
  const useGrid = items.length >= 4;

  return (
    <div className="relative flex-shrink-0">
      <button onClick={onToggle}
        className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all duration-150 ${
          hasActive || isOpen ? 'text-white bg-white/15' : 'text-white/65 hover:text-white hover:bg-white/10'
        }`}
      >
        {hasActive && (
          <motion.span layoutId="topnav-pill"
            className="absolute inset-0 rounded-lg border border-white/20 bg-white/12" />
        )}
        <Icon className="relative z-10 w-4 h-4 flex-shrink-0" />
        <span className="relative z-10">{group.group}</span>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.18 }} className="relative z-10">
          <ChevronDown className="w-3.5 h-3.5 opacity-60" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.96 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className={`absolute top-[calc(100%+10px)] left-0 bg-white rounded-2xl shadow-2xl border border-gray-200/60 overflow-hidden z-50 ${useGrid ? 'w-[440px]' : 'w-[280px]'}`}
            style={{ boxShadow: '0 20px 60px -10px rgba(0,0,0,0.18), 0 4px 16px -4px rgba(0,0,0,0.08)' }}
          >
            {/* Dropdown header */}
            <div className={`flex items-center gap-3 px-5 py-3.5 bg-gradient-to-r ${group.accent.headerFrom} to-white border-b border-gray-100`}>
              <div className={`w-9 h-9 rounded-xl ${group.accent.bg} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                <Icon className={`w-5 h-5 ${group.accent.text}`} />
              </div>
              <div>
                <p className="text-xs font-black text-gray-800 uppercase tracking-widest leading-none">{group.group}</p>
                <p className="text-[10px] text-gray-400 mt-1">{items.length} {items.length === 1 ? 'page' : 'pages'} available</p>
              </div>
            </div>

            {/* Dropdown items */}
            <div className={`p-2.5 ${useGrid ? 'grid grid-cols-2 gap-1.5' : 'flex flex-col gap-1'}`}>
              {items.map(item => {
                const isActive = location.pathname === item.to;
                const ItemIcon = item.icon;
                return (
                  <Link key={item.to} to={item.to} onClick={onClose}
                    className={`group flex items-center gap-3 px-3 py-3 rounded-xl border transition-all duration-150 ${
                      isActive
                        ? `${group.accent.active} shadow-sm`
                        : 'border-transparent hover:border-gray-100 hover:bg-gray-50/80'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm transition-colors ${
                      isActive ? group.accent.bg : 'bg-gray-100 group-hover:bg-gray-200'
                    }`}>
                      <ItemIcon className={`w-4.5 h-4.5 ${isActive ? group.accent.text : 'text-gray-500'}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-bold leading-none ${isActive ? group.accent.text : 'text-gray-800'}`}>{item.label}</p>
                      <p className="text-[11px] text-gray-400 mt-1 leading-tight">{(item as any).desc ?? ''}</p>
                    </div>
                    {isActive && (
                      <div className={`w-5 h-5 rounded-full ${group.accent.bg} flex items-center justify-center flex-shrink-0`}>
                        <Check className={`w-3 h-3 ${group.accent.text}`} strokeWidth={3} />
                      </div>
                    )}
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
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const role = user?.role ?? 'employee';
  const roleStyle = ROLE_STYLE[role] ?? ROLE_STYLE.employee;
  const initials = user?.full_name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() ?? '?';

  const allGroups: AnyGroup[] = [...NAV_GROUPS.filter(g => (g.roles as readonly string[]).includes(role)), SETTINGS_GROUP];

  const handleGlobalClick = useCallback((e: MouseEvent) => {
    if (navRef.current && !navRef.current.contains(e.target as Node)) setOpenGroup(null);
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleGlobalClick);
    return () => document.removeEventListener('mousedown', handleGlobalClick);
  }, [handleGlobalClick]);

  useEffect(() => { setOpenGroup(null); setMobileOpen(false); }, [location.pathname]);

  // Find active page info
  const activeItem = allGroups.flatMap(g => visibleItems(g, role)).find(i => i.to === location.pathname);

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: 'var(--color-background)' }}>

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <header className="flex-shrink-0 z-30" style={{ backgroundColor: 'var(--color-sidebar)' }}>
        {/* Main bar */}
        <div ref={navRef} className="flex items-center gap-2 px-4 h-14 border-b border-white/8">

          {/* Logo */}
          <Link to="/employee/dashboard" className="flex items-center gap-2.5 flex-shrink-0 mr-3">
            <div className="w-8 h-8 rounded-xl overflow-hidden ring-1 ring-white/20 shadow-md">
              {branding.logo
                ? <img src={branding.logo} alt="Logo" className="w-full h-full object-contain" />
                : <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center"><Zap className="w-4 h-4 text-white" /></div>
              }
            </div>
            <span className="text-white font-extrabold text-sm tracking-tight hidden sm:block">{APP_NAME}</span>
          </Link>

          <div className="w-px h-5 bg-white/15 flex-shrink-0 hidden lg:block" />

          {/* Desktop nav groups */}
          <nav className="hidden lg:flex items-center gap-0.5 flex-1 min-w-0 overflow-x-auto scrollbar-none">
            {allGroups.map(group => {
              const items = visibleItems(group, role);
              if (!items.length) return null;
              return (
                <TopNavDropdown
                  key={group.id} group={group} items={items as AnyGroup['items'][number][]}
                  isOpen={openGroup === group.id}
                  onToggle={() => setOpenGroup(p => p === group.id ? null : group.id)}
                  onClose={() => setOpenGroup(null)}
                />
              );
            })}
          </nav>

          {/* Right: active breadcrumb + user */}
          <div className="ml-auto flex items-center gap-2 flex-shrink-0">

            {/* Active page chip */}
            {activeItem && (
              <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/8 border border-white/10 text-xs text-white/50">
                <activeItem.icon className="w-3.5 h-3.5" />
                <span className="font-medium">{activeItem.label}</span>
              </div>
            )}

            {/* User button */}
            <div className="hidden lg:block relative">
              <button onClick={() => setOpenGroup(p => p === '__user' ? null : '__user')}
                className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-xl hover:bg-white/8 transition-colors border border-white/10">
                <div className="relative">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold shadow">{initials}</div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-400 border-2 rounded-full" style={{ borderColor: 'var(--color-sidebar)' }} />
                </div>
                <div className="text-left hidden xl:block">
                  <p className="text-white text-xs font-bold leading-none">{user?.full_name?.split(' ')[0]}</p>
                  <p className="text-white/40 text-[10px] mt-0.5">{roleStyle.label}</p>
                </div>
                <ChevronDown className="w-3 h-3 text-white/30 hidden xl:block" />
              </button>

              <AnimatePresence>
                {openGroup === '__user' && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-[calc(100%+10px)] w-64 bg-white rounded-2xl shadow-2xl border border-gray-200/60 overflow-hidden z-50"
                    style={{ boxShadow: '0 20px 60px -10px rgba(0,0,0,0.18)' }}
                  >
                    {/* User info header */}
                    <div className="px-4 py-4 bg-gradient-to-br from-indigo-50 to-violet-50 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white font-bold shadow-md">{initials}</div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate">{user?.full_name}</p>
                          <p className="text-[10px] text-gray-400 truncate">{user?.email}</p>
                        </div>
                      </div>
                      <div className="mt-2.5">
                        <span className={`inline-flex items-center text-[10px] font-bold uppercase px-2.5 py-1 rounded-full tracking-wide ${roleStyle.cls}`}>{roleStyle.label}</span>
                      </div>
                    </div>
                    {/* Quick links */}
                    <div className="py-1.5 px-1.5">
                      {[
                        { label: 'View Profile',  desc: 'Personal info & settings', to: '/settings/profile',    icon: User,    color: 'bg-blue-100 text-blue-600' },
                        { label: 'Appearance',    desc: 'Themes & layout options',  to: '/settings/appearance', icon: Palette, color: 'bg-violet-100 text-violet-600' },
                      ].map(item => (
                        <Link key={item.to} to={item.to} onClick={() => setOpenGroup(null)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                          <div className={`w-8 h-8 rounded-lg ${item.color} flex items-center justify-center flex-shrink-0`}>
                            <item.icon className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{item.label}</p>
                            <p className="text-[10px] text-gray-400">{item.desc}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                    <div className="border-t border-gray-100 px-1.5 py-1.5">
                      <button onClick={() => { logout(); navigate('/login'); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-600 hover:bg-red-50 transition-colors">
                        <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                          <LogOut className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">Sign out</p>
                          <p className="text-[10px] text-red-400">End your session</p>
                        </div>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile hamburger */}
            <button onClick={() => setMobileOpen(v => !v)}
              className="lg:hidden p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors">
              <AnimatePresence mode="wait">
                {mobileOpen
                  ? <motion.div key="x"    initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}><X className="w-5 h-5" /></motion.div>
                  : <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}><Menu className="w-5 h-5" /></motion.div>
                }
              </AnimatePresence>
            </button>
          </div>
        </div>

        {/* Mobile accordion nav */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }}
              className="overflow-hidden border-t border-white/8 lg:hidden"
            >
              <div className="px-3 py-3 max-h-[70vh] overflow-y-auto space-y-1">
                {allGroups.map(group => {
                  const items = visibleItems(group, role);
                  if (!items.length) return null;
                  const Icon = group.icon;
                  const isExp = mobileExpanded === group.id;
                  const hasAct = items.some(i => location.pathname === i.to);

                  return (
                    <div key={group.id}>
                      <button onClick={() => setMobileExpanded(p => p === group.id ? null : group.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${hasAct ? 'bg-white/15 text-white' : 'text-white/60 hover:text-white hover:bg-white/8'}`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${hasAct ? group.accent.bg : 'bg-white/8'}`}>
                          <Icon className={`w-4 h-4 ${hasAct ? group.accent.text : 'text-white/50'}`} />
                        </div>
                        <span className="flex-1 text-left">{group.group}</span>
                        <span className="text-[9px] bg-white/10 px-1.5 py-0.5 rounded-full text-white/35">{items.length}</span>
                        <motion.div animate={{ rotate: isExp ? 180 : 0 }} transition={{ duration: 0.18 }}>
                          <ChevronDown className="w-3.5 h-3.5 text-white/30" />
                        </motion.div>
                      </button>

                      <AnimatePresence initial={false}>
                        {isExp && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }} className="overflow-hidden">
                            <div className="ml-4 pl-3 border-l border-white/10 mt-1 mb-1 space-y-0.5">
                              {items.map(item => {
                                const isActive = location.pathname === item.to;
                                const ItemIcon = item.icon;
                                return (
                                  <Link key={item.to} to={item.to} onClick={() => setMobileOpen(false)}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${isActive ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white hover:bg-white/8'}`}
                                  >
                                    <ItemIcon className="w-4 h-4 flex-shrink-0" />
                                    <div className="min-w-0 flex-1">
                                      <p className="text-sm font-semibold leading-none">{item.label}</p>
                                      <p className="text-[10px] text-white/35 mt-0.5">{(item as any).desc ?? ''}</p>
                                    </div>
                                    {isActive && <Check className="w-3.5 h-3.5 text-indigo-300 flex-shrink-0" />}
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

                {/* Mobile user footer */}
                <div className="border-t border-white/10 pt-2">
                  <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white/8 mb-1">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold">{initials}</div>
                    <div className="min-w-0 flex-1">
                      <p className="text-white text-sm font-bold truncate">{user?.full_name}</p>
                      <p className="text-white/40 text-[10px] truncate">{user?.email}</p>
                    </div>
                    <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${roleStyle.cls}`}>{roleStyle.label}</span>
                  </div>
                  <button onClick={() => { logout(); navigate('/login'); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 transition-all text-sm font-medium">
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {openGroup && openGroup !== '__user' && <div className="fixed inset-0 z-20" onClick={() => setOpenGroup(null)} />}
      <main className="flex-1 overflow-y-auto relative z-10"><Outlet /></main>
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

  useEffect(() => {
    // Only apply if the user has explicitly saved a non-default theme
    if (user?.preferences?.primary_color && user.preferences.primary_color !== '#2563EB') {
      applyTheme(user.preferences);
    } else if (user?.preferences?.primary_color === '#2563EB') {
      // Explicitly reset to ocean blue defaults
      applyTheme({
        primary_color: '#2563EB', accent_color: '#7C3AED',
        sidebar_color: '#1E293B', background_color: '#F8FAFC', font_size: 'md',
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.preferences?.primary_color]);

  if (layoutStyle === 'topnav') return <TopNavLayout />;
  return <SidebarLayout compact={layoutStyle === 'compact'} sidebarPosition={sidebarPosition} />;
}
