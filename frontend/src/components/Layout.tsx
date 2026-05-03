import { useEffect, useState, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/useAuthStore';
import { applyTheme } from '../utils/theme';
import api from '../api/axios';
import {
  LayoutDashboard, FileText, History, CalendarDays, Columns, Users,
  Settings, LogOut, ChevronDown, Menu, X, Home,
  Shield, Bell, Palette, User, Map, ShieldCheck,
  TrendingUp, Zap, BarChart3, Building2, Briefcase, Check, RotateCcw,
} from 'lucide-react';
import { APP_NAME } from '../constants';

// ── Ocean-blue defaults (source of truth for "unset" theme) ──────────────────
const OCEAN_BLUE = {
  primary_color: '#2563EB',
  accent_color:  '#7C3AED',
  sidebar_color: '#1E293B',
  background_color: '#F8FAFC',
  font_size: 'md',
};

// ── Nav groups ────────────────────────────────────────────────────────────────
const NAV_GROUPS = [
  {
    id: 'dashboard', group: 'Dashboard', icon: LayoutDashboard,
    accent: { bg: 'bg-blue-100', text: 'text-blue-600', from: 'from-blue-50', active: 'bg-blue-50 border-blue-200' },
    roles: ['employee', 'manager', 'ceo'],
    items: [
      { label: 'My Dashboard',      desc: 'Personal overview & daily metrics',     to: '/employee/dashboard', icon: Home,       roles: ['employee','manager','ceo'] },
      { label: 'Manager Dashboard', desc: 'Team performance & pending approvals',   to: '/manager/dashboard',  icon: TrendingUp, roles: ['manager','ceo'] },
      { label: 'CEO Dashboard',     desc: 'Company-wide analytics & insights',      to: '/ceo/dashboard',      icon: BarChart3,  roles: ['ceo'] },
    ],
  },
  {
    id: 'workspace', group: 'Workspace', icon: Briefcase,
    accent: { bg: 'bg-violet-100', text: 'text-violet-600', from: 'from-violet-50', active: 'bg-violet-50 border-violet-200' },
    roles: ['employee', 'manager', 'ceo'],
    items: [
      { label: 'Work Report',    desc: 'Log & submit daily work activities',  to: '/employee/report',   icon: FileText,     roles: ['employee','manager','ceo'] },
      { label: 'Kanban Board',   desc: 'Visual task & project tracking',      to: '/kanban',            icon: Columns,      roles: ['employee','manager','ceo'] },
      { label: 'Report History', desc: 'Browse & export past work reports',   to: '/employee/history',  icon: History,      roles: ['employee','manager','ceo'] },
      { label: 'Calendar',       desc: 'Schedule, events & planning view',    to: '/employee/calendar', icon: CalendarDays, roles: ['employee','manager','ceo'] },
    ],
  },
  {
    id: 'management', group: 'Management', icon: Building2,
    accent: { bg: 'bg-emerald-100', text: 'text-emerald-600', from: 'from-emerald-50', active: 'bg-emerald-50 border-emerald-200' },
    roles: ['manager', 'ceo'],
    items: [
      { label: 'User Management', desc: 'Add, edit & manage team members',         to: '/users', icon: Users,       roles: ['manager','ceo'] },
      { label: 'Role Management', desc: 'Configure access control & permissions',  to: '/roles', icon: ShieldCheck, roles: ['ceo'] },
    ],
  },
] as const;

const SETTINGS_GROUP = {
  id: 'settings', group: 'Settings', icon: Settings,
  accent: { bg: 'bg-slate-100', text: 'text-slate-600', from: 'from-slate-50', active: 'bg-slate-50 border-slate-200' },
  roles: ['employee', 'manager', 'ceo'],
  items: [
    { label: 'Profile',       desc: 'Personal info & photo',              to: '/settings/profile',       icon: User,    roles: ['employee','manager','ceo'] },
    { label: 'Appearance',    desc: 'Themes, layout & colors',            to: '/settings/appearance',    icon: Palette, roles: ['employee','manager','ceo'] },
    { label: 'Notifications', desc: 'Alert & notification preferences',   to: '/settings/notifications', icon: Bell,    roles: ['employee','manager','ceo'] },
    { label: 'System Config', desc: 'Global platform settings',           to: '/settings/system',        icon: Shield,  roles: ['ceo'] },
    { label: 'Locations',     desc: 'Office & remote work locations',     to: '/settings/locations',     icon: Map,     roles: ['ceo'] },
  ],
} as const;

const ROLE_BADGE: Record<string,{ label:string; cls:string }> = {
  ceo:      { label:'CEO',      cls:'bg-amber-400/20 text-amber-300 border border-amber-400/30' },
  manager:  { label:'Manager',  cls:'bg-blue-400/20 text-blue-300 border border-blue-400/30' },
  employee: { label:'Employee', cls:'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30' },
};

type AnyGroup = typeof NAV_GROUPS[number] | typeof SETTINGS_GROUP;
function visibleItems(g: AnyGroup, role: string) {
  return g.items.filter(i => (i.roles as readonly string[]).includes(role));
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPACT SIDEBAR
// ═══════════════════════════════════════════════════════════════════════════════
function CompactGroupButton({ group, items, isRight }: {
  group: AnyGroup; items: AnyGroup['items'][number][]; isRight: boolean;
}) {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [top, setTop] = useState(0);
  const btnRef = useRef<HTMLButtonElement>(null);
  const Icon = group.icon;
  const hasActive = items.some(i => location.pathname === i.to);

  const handleClick = () => {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setTop(Math.min(r.top, window.innerHeight - items.length * 58 - 64));
    }
    setOpen(v => !v);
  };

  return (
    <>
      <button ref={btnRef} onClick={handleClick} title={group.group}
        className={`relative w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 ${
          open || hasActive ? 'bg-white/15 text-white shadow-sm' : 'text-white/40 hover:text-white hover:bg-white/10'
        }`}
      >
        <Icon className="w-5 h-5" />
        {hasActive && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-sky-400 rounded-full" />}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, x: isRight ? 8 : -8, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: isRight ? 8 : -8, scale: 0.95 }}
              transition={{ duration: 0.14 }}
              style={{ position:'fixed', top, [isRight?'right':'left']:72, zIndex:50 }}
              className="w-64 bg-white rounded-2xl shadow-2xl border border-gray-100/80 overflow-hidden"
            >
              <div className={`flex items-center gap-2.5 px-4 py-3.5 bg-gradient-to-r ${group.accent.from} to-white border-b border-gray-100`}>
                <div className={`w-8 h-8 rounded-xl ${group.accent.bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-4 h-4 ${group.accent.text}`} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-700 uppercase tracking-[0.12em]">{group.group}</p>
                  <p className="text-[9px] text-gray-400 mt-0.5">{items.length} pages</p>
                </div>
              </div>
              <div className="py-1.5">
                {items.map(item => {
                  const active = location.pathname === item.to;
                  const IIcon = item.icon;
                  return (
                    <Link key={item.to} to={item.to} onClick={() => setOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 mx-1.5 rounded-xl transition-all ${
                        active ? `${group.accent.active} border font-semibold` : 'text-gray-700 hover:bg-gray-50 border border-transparent'
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${active ? group.accent.bg : 'bg-gray-100'}`}>
                        <IIcon className={`w-3.5 h-3.5 ${active ? group.accent.text : 'text-gray-500'}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs font-semibold ${active ? group.accent.text : 'text-gray-800'}`}>{item.label}</p>
                        <p className="text-[10px] text-gray-400 truncate">{(item as any).desc}</p>
                      </div>
                      {active && <Check className={`w-3.5 h-3.5 ${group.accent.text} flex-shrink-0`} />}
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
  const initials = user?.full_name?.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase() ?? '?';
  const role = user?.role ?? 'employee';
  const groups: AnyGroup[] = [...NAV_GROUPS.filter(g=>(g.roles as readonly string[]).includes(role)), SETTINGS_GROUP];

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
      <div className="w-8 h-px bg-white/10 mb-1" />
      {groups.map(group => {
        const items = visibleItems(group, role);
        if (!items.length) return null;
        return <CompactGroupButton key={group.id} group={group} items={items as AnyGroup['items'][number][]} isRight={isRight} />;
      })}
      <div className="mt-auto flex flex-col items-center gap-1.5">
        <div className="w-8 h-px bg-white/10 mb-1" />
        <div className="relative">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold">{initials}</div>
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 rounded-full" style={{ borderColor:'var(--color-sidebar)' }} />
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
// FULL SIDEBAR
// ═══════════════════════════════════════════════════════════════════════════════
function FullSidebarContent({ onClose }: { onClose?: () => void }) {
  const { user, logout, branding } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const role = user?.role ?? 'employee';
  const rb = ROLE_BADGE[role] ?? ROLE_BADGE.employee;
  const initials = user?.full_name?.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase() ?? '?';
  const companyName = branding.name && branding.name !== APP_NAME ? branding.name : '';

  const allGroups: AnyGroup[] = [...NAV_GROUPS.filter(g=>(g.roles as readonly string[]).includes(role)), SETTINGS_GROUP];
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    const s = new Set<string>();
    allGroups.forEach(g => { if (g.items.some(i=>i.to===location.pathname)) s.add(g.id); });
    if (!s.size) s.add('workspace');
    return s;
  });
  const toggle = (id: string) => setOpenGroups(prev => {
    const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n;
  });

  return (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 rounded-2xl overflow-hidden shadow-lg ring-1 ring-white/15">
              {branding.logo
                ? <img src={branding.logo} alt="Logo" className="w-full h-full object-contain" />
                : <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center"><Zap className="w-5 h-5 text-white" /></div>
              }
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 rounded-full" style={{ borderColor:'var(--color-sidebar)' }} />
          </div>
          <div className="min-w-0">
            <p className="text-white font-extrabold text-sm tracking-tight">{APP_NAME}</p>
            {companyName
              ? <p className="text-white/35 text-[10px] uppercase tracking-widest mt-0.5 truncate">{companyName}</p>
              : <p className="text-white/25 text-[10px] mt-0.5">Workspace Portal</p>
            }
          </div>
        </div>
        <div className="mt-4 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 pb-3 overflow-y-auto space-y-0.5 scrollbar-none">
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
                  hasActive ? 'text-white bg-white/10' : 'text-white/50 hover:text-white hover:bg-white/6'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${hasActive ? 'bg-white/12 text-indigo-300' : 'text-white/30'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="flex-1 text-left leading-none">{group.group}</span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${hasActive ? 'bg-indigo-500/30 text-indigo-300' : 'bg-white/8 text-white/20'}`}>
                  {items.length}
                </span>
                <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown className="w-3.5 h-3.5 text-white/20" />
                </motion.div>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }} animate={{ height:'auto', opacity:1 }}
                    exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="ml-4 pl-3 border-l border-white/8 mt-1 mb-1 space-y-0.5">
                      {items.map(item => {
                        const IIcon = item.icon;
                        const active = location.pathname === item.to;
                        return (
                          <Link key={item.to} to={item.to} onClick={onClose}
                            className={`relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all group ${
                              active ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white hover:bg-white/6'
                            }`}
                          >
                            {active && (
                              <>
                                <motion.span layoutId={`pill-${item.to}`}
                                  className="absolute inset-0 rounded-lg bg-gradient-to-r from-indigo-500/20 to-violet-500/10 border border-white/10" />
                                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 bg-gradient-to-b from-indigo-400 to-violet-500 rounded-r-full" />
                              </>
                            )}
                            <div className={`relative z-10 w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${active ? 'bg-white/10 text-indigo-300' : 'text-white/30 group-hover:text-white/60'}`}>
                              <IIcon className="w-3.5 h-3.5" />
                            </div>
                            <span className="relative z-10 flex-1 leading-none">{item.label}</span>
                            {active && <Check className="relative z-10 w-3 h-3 text-indigo-400 flex-shrink-0" />}
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
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold">{initials}</div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 rounded-full" style={{ borderColor:'var(--color-sidebar)' }} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white text-xs font-bold truncate">{user?.full_name}</p>
            <p className="text-white/35 text-[10px] truncate">{user?.email}</p>
          </div>
          <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full flex-shrink-0 ${rb.cls}`}>{rb.label}</span>
        </div>
        <button onClick={() => { logout(); navigate('/login'); }}
          className="w-full mt-1 flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all group">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white/30 group-hover:text-red-400"><LogOut className="w-4 h-4" /></div>
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
      style={{ background:'var(--color-background)' }}>
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)} />
        )}
      </AnimatePresence>

      <aside
        className={`fixed lg:static inset-y-0 z-30 flex-shrink-0 ${compact ? 'w-64 lg:w-16' : 'w-64'}
          transition-transform duration-300
          ${isRight ? 'right-0' : 'left-0'}
          ${sidebarOpen ? 'translate-x-0' : isRight ? 'translate-x-full lg:translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        style={{ backgroundColor:'var(--color-sidebar)' }}
      >
        <div className="block lg:hidden h-full"><FullSidebarContent onClose={() => setSidebarOpen(false)} /></div>
        <div className="hidden lg:block h-full">
          {compact ? <CompactSidebarContent isRight={isRight} /> : <FullSidebarContent onClose={() => setSidebarOpen(false)} />}
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
          <button onClick={() => setSidebarOpen(v=>!v)}
            className={`p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors ${isRight ? 'order-last' : ''}`}>
            <AnimatePresence mode="wait">
              {sidebarOpen
                ? <motion.div key="x"    initial={{ rotate:-90,opacity:0 }} animate={{ rotate:0,opacity:1 }} exit={{ rotate:90,opacity:0 }} transition={{ duration:.15 }}><X className="w-5 h-5" /></motion.div>
                : <motion.div key="menu" initial={{ rotate:90,opacity:0 }} animate={{ rotate:0,opacity:1 }} exit={{ rotate:-90,opacity:0 }} transition={{ duration:.15 }}><Menu className="w-5 h-5" /></motion.div>
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
            <span className="font-extrabold text-gray-900 text-sm">{APP_NAME}</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto"><Outlet /></main>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TOP NAV — professional dropdown nav
// ═══════════════════════════════════════════════════════════════════════════════

// Single nav group dropdown — rendered as a PORTAL child of <header> via state
function NavDropdownMenu({ group, items, alignRight, onClose }: {
  group: AnyGroup;
  items: AnyGroup['items'][number][];
  alignRight: boolean;
  onClose: () => void;
}) {
  const location = useLocation();
  const Icon = group.icon;
  const useGrid = items.length >= 4;

  return (
    <motion.div
      initial={{ opacity:0, y:-8, scale:0.97 }}
      animate={{ opacity:1, y:0, scale:1 }}
      exit={{ opacity:0, y:-8, scale:0.97 }}
      transition={{ duration:0.15, ease:[0.16,1,0.3,1] }}
      className={`absolute top-full mt-2 bg-white rounded-2xl border border-gray-200/70 overflow-hidden z-[9999] shadow-[0_20px_60px_-10px_rgba(0,0,0,0.20),0_4px_20px_-4px_rgba(0,0,0,0.10)] ${
        useGrid ? 'w-[460px]' : 'w-[280px]'
      } ${alignRight ? 'right-0' : 'left-0'}`}
    >
      {/* Thin accent top bar — no redundant group name, button already shows it */}
      <div className={`h-1 bg-gradient-to-r ${group.accent.from} ${group.accent.bg}`} />

      {/* Items */}
      <div className={`p-2.5 ${useGrid ? 'grid grid-cols-2 gap-1.5' : 'space-y-0.5'}`}>
        {items.map(item => {
          const active = location.pathname === item.to;
          const IIcon = item.icon;
          return (
            <Link key={item.to} to={item.to} onClick={onClose}
              className={`group flex items-center gap-3 px-3 py-3 rounded-xl border transition-all duration-150 ${
                active
                  ? `${group.accent.active} shadow-sm`
                  : 'border-transparent hover:border-gray-100 hover:bg-gray-50'
              }`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                active ? group.accent.bg : 'bg-gray-100 group-hover:bg-gray-200'
              }`}>
                <IIcon className={`w-4 h-4 ${active ? group.accent.text : 'text-gray-500'}`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-bold leading-none ${active ? group.accent.text : 'text-gray-800'}`}>{item.label}</p>
                <p className="text-[11px] text-gray-400 mt-1 leading-tight line-clamp-1">{(item as any).desc}</p>
              </div>
              {active && (
                <div className={`w-5 h-5 rounded-full ${group.accent.bg} flex items-center justify-center flex-shrink-0`}>
                  <Check className={`w-3 h-3 ${group.accent.text}`} strokeWidth={3} />
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </motion.div>
  );
}

function TopNavLayout() {
  const { user, setUser, logout, branding } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [openGroup, setOpenGroup] = useState<string|null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string|null>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const role = user?.role ?? 'employee';
  const rb = ROLE_BADGE[role] ?? ROLE_BADGE.employee;
  const initials = user?.full_name?.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase() ?? '?';

  const allGroups: AnyGroup[] = [...NAV_GROUPS.filter(g=>(g.roles as readonly string[]).includes(role)), SETTINGS_GROUP];

  // Close on click outside header
  const onGlobalClick = useCallback((e: MouseEvent) => {
    if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
      setOpenGroup(null);
    }
  }, []);
  useEffect(() => {
    document.addEventListener('mousedown', onGlobalClick);
    return () => document.removeEventListener('mousedown', onGlobalClick);
  }, [onGlobalClick]);

  // Close on route change
  useEffect(() => { setOpenGroup(null); setMobileOpen(false); }, [location.pathname]);

  const toggle = (id: string) => setOpenGroup(p => p === id ? null : id);
  const close = () => setOpenGroup(null);

  // Active page label for breadcrumb
  const activeItem = allGroups.flatMap(g => visibleItems(g, role)).find(i => i.to === location.pathname);

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background:'var(--color-background)' }}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header ref={headerRef} className="flex-shrink-0 relative z-50"
        style={{ backgroundColor:'var(--color-sidebar)' }}>

        <div className="flex items-center h-14 px-4 gap-3 border-b border-white/8">

          {/* Logo */}
          <Link to="/employee/dashboard" className="flex items-center gap-2.5 flex-shrink-0 mr-2">
            <div className="w-8 h-8 rounded-xl overflow-hidden ring-1 ring-white/20 shadow-md flex-shrink-0">
              {branding.logo
                ? <img src={branding.logo} alt="Logo" className="w-full h-full object-contain" />
                : <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center"><Zap className="w-4 h-4 text-white" /></div>
              }
            </div>
            <span className="text-white font-extrabold text-sm tracking-tight hidden sm:block">{APP_NAME}</span>
          </Link>

          {/* Divider */}
          <div className="hidden lg:block w-px h-5 bg-white/15 flex-shrink-0" />

          {/* Desktop nav — NO overflow:auto so dropdowns aren't clipped */}
          <nav className="hidden lg:flex items-center gap-0.5 flex-1">
            {allGroups.map((group, idx) => {
              const items = visibleItems(group, role);
              if (!items.length) return null;
              const Icon = group.icon;
              const isOpen = openGroup === group.id;
              const hasActive = items.some(i => location.pathname === i.to);
              const alignRight = idx === allGroups.filter(g => visibleItems(g,role).length>0).length - 1;

              return (
                <div key={group.id} className="relative flex-shrink-0">
                  <button onClick={() => toggle(group.id)}
                    className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all duration-150 ${
                      hasActive || isOpen
                        ? 'text-white bg-white/15'
                        : 'text-white/65 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{group.group}</span>
                    <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration:0.18 }}>
                      <ChevronDown className="w-3.5 h-3.5 opacity-50" />
                    </motion.div>
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <NavDropdownMenu
                        group={group}
                        items={items as AnyGroup['items'][number][]}
                        alignRight={alignRight}
                        onClose={close}
                      />
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="ml-auto flex items-center gap-2 flex-shrink-0">

            {/* Active page chip */}
            {activeItem && (
              <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/8 border border-white/10 text-[11px] text-white/50 font-medium">
                <activeItem.icon className="w-3.5 h-3.5" />
                {activeItem.label}
              </div>
            )}

            {/* User menu */}
            <div className="hidden lg:block relative">
              <button onClick={() => toggle('__user')}
                className={`flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-xl border transition-all ${
                  openGroup === '__user' ? 'bg-white/15 border-white/20' : 'border-white/10 hover:bg-white/8'
                }`}
              >
                <div className="relative">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold shadow">{initials}</div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-400 border-2 rounded-full" style={{ borderColor:'var(--color-sidebar)' }} />
                </div>
                <div className="text-left hidden xl:block">
                  <p className="text-white text-xs font-bold leading-none">{user?.full_name?.split(' ')[0]}</p>
                  <p className="text-white/40 text-[10px] mt-0.5">{rb.label}</p>
                </div>
                <motion.div animate={{ rotate: openGroup==='__user' ? 180 : 0 }} transition={{ duration:0.18 }}>
                  <ChevronDown className="w-3 h-3 text-white/30 hidden xl:block" />
                </motion.div>
              </button>

              <AnimatePresence>
                {openGroup === '__user' && (
                  <motion.div
                    initial={{ opacity:0, y:-8, scale:0.97 }}
                    animate={{ opacity:1, y:0, scale:1 }}
                    exit={{ opacity:0, y:-8, scale:0.97 }}
                    transition={{ duration:.15 }}
                    className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl border border-gray-200/70 overflow-hidden z-[9999] shadow-[0_20px_60px_-10px_rgba(0,0,0,0.20)]"
                  >
                    {/* User header */}
                    <div className="px-5 py-4 bg-gradient-to-br from-indigo-50 via-violet-50/40 to-white border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white font-extrabold text-base shadow-md">{initials}</div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-extrabold text-gray-900 truncate leading-tight">{user?.full_name}</p>
                          <p className="text-[11px] text-gray-400 truncate mt-0.5">{user?.email}</p>
                          <span className={`inline-flex mt-1.5 items-center text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-wide ${rb.cls}`}>{rb.label}</span>
                        </div>
                      </div>
                    </div>

                    {/* Quick links */}
                    <div className="py-2 px-2">
                      {([
                        { label:'View Profile',  desc:'Personal info & settings',  to:'/settings/profile',     icon:User,    color:'bg-blue-100 text-blue-600' },
                        { label:'Appearance',    desc:'Themes & layout options',   to:'/settings/appearance',  icon:Palette, color:'bg-violet-100 text-violet-600' },
                        { label:'Notifications', desc:'Alert preferences',         to:'/settings/notifications', icon:Bell,  color:'bg-amber-100 text-amber-600' },
                      ] as const).map(item => (
                        <Link key={item.to} to={item.to} onClick={close}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors group">
                          <div className={`w-9 h-9 rounded-xl ${item.color} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                            <item.icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-800 leading-none">{item.label}</p>
                            <p className="text-[11px] text-gray-400 mt-0.5">{item.desc}</p>
                          </div>
                        </Link>
                      ))}
                    </div>

                    {/* Reset theme + Sign out */}
                    <div className="border-t border-gray-100 p-2 space-y-0.5">
                      <button onClick={async () => {
                          applyTheme(OCEAN_BLUE);
                          try {
                            await api.patch('/settings/appearance/', { ...OCEAN_BLUE, theme:'ocean', layout_density:'comfortable' });
                            if (user) setUser({ ...user, preferences: { ...user.preferences, ...OCEAN_BLUE, theme:'ocean' } });
                          } catch { /* applied locally at least */ }
                          setOpenGroup(null);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-blue-600 hover:bg-blue-50 transition-colors">
                        <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <RotateCcw className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-left">Reset to Ocean Blue</p>
                          <p className="text-[10px] text-blue-400 text-left">Restore default theme</p>
                        </div>
                      </button>
                      <button onClick={() => { logout(); navigate('/login'); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-600 hover:bg-red-50 transition-colors">
                        <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                          <LogOut className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-left">Sign out</p>
                          <p className="text-[10px] text-red-400 text-left">End your session</p>
                        </div>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile hamburger */}
            <button onClick={() => setMobileOpen(v=>!v)}
              className="lg:hidden p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors">
              <AnimatePresence mode="wait">
                {mobileOpen
                  ? <motion.div key="x"    initial={{ rotate:-90,opacity:0 }} animate={{ rotate:0,opacity:1 }} exit={{ rotate:90,opacity:0 }} transition={{ duration:.15 }}><X className="w-5 h-5" /></motion.div>
                  : <motion.div key="menu" initial={{ rotate:90,opacity:0 }} animate={{ rotate:0,opacity:1 }} exit={{ rotate:-90,opacity:0 }} transition={{ duration:.15 }}><Menu className="w-5 h-5" /></motion.div>
                }
              </AnimatePresence>
            </button>
          </div>
        </div>

        {/* Mobile accordion */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }}
              exit={{ height:0, opacity:0 }} transition={{ duration:0.22 }}
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
                      <button onClick={() => setMobileExpanded(p => p===group.id ? null : group.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                          hasAct ? 'bg-white/15 text-white' : 'text-white/55 hover:text-white hover:bg-white/8'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${hasAct ? group.accent.bg : 'bg-white/8'}`}>
                          <Icon className={`w-4 h-4 ${hasAct ? group.accent.text : 'text-white/50'}`} />
                        </div>
                        <span className="flex-1 text-left">{group.group}</span>
                        <span className="text-[9px] bg-white/10 px-1.5 py-0.5 rounded-full text-white/30">{items.length}</span>
                        <motion.div animate={{ rotate: isExp ? 180 : 0 }} transition={{ duration:0.18 }}>
                          <ChevronDown className="w-3.5 h-3.5 text-white/25" />
                        </motion.div>
                      </button>

                      <AnimatePresence initial={false}>
                        {isExp && (
                          <motion.div initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }}
                            exit={{ height:0, opacity:0 }} transition={{ duration:0.18 }} className="overflow-hidden">
                            <div className="ml-4 pl-3 border-l border-white/10 mt-1 mb-1 space-y-0.5">
                              {items.map(item => {
                                const active = location.pathname === item.to;
                                const IIcon = item.icon;
                                return (
                                  <Link key={item.to} to={item.to} onClick={() => setMobileOpen(false)}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                                      active ? 'bg-white/15 text-white' : 'text-white/45 hover:text-white hover:bg-white/8'
                                    }`}
                                  >
                                    <IIcon className="w-4 h-4 flex-shrink-0" />
                                    <div className="min-w-0 flex-1">
                                      <p className="text-sm font-semibold">{item.label}</p>
                                      <p className="text-[10px] text-white/30">{(item as any).desc}</p>
                                    </div>
                                    {active && <Check className="w-3.5 h-3.5 text-indigo-300 flex-shrink-0" />}
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

                {/* Mobile user */}
                <div className="border-t border-white/10 pt-2">
                  <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white/8 mb-1">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold">{initials}</div>
                    <div className="min-w-0 flex-1">
                      <p className="text-white text-sm font-bold truncate">{user?.full_name}</p>
                      <p className="text-white/40 text-[10px] truncate">{user?.email}</p>
                    </div>
                    <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${rb.cls}`}>{rb.label}</span>
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

      <main className="flex-1 overflow-y-auto"><Outlet /></main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LAYOUT ROOT  — always fetches fresh theme from API
// ═══════════════════════════════════════════════════════════════════════════════
export default function Layout() {
  const { user, setUser } = useAuthStore();
  const layoutStyle     = user?.preferences?.layout_style     ?? 'sidebar';
  const sidebarPosition = user?.preferences?.sidebar_position ?? 'left';

  useEffect(() => {
    // 1. Apply stored prefs immediately (no flash)
    if (user?.preferences?.primary_color) {
      applyTheme(user.preferences);
    } else {
      applyTheme(OCEAN_BLUE);
    }

    // 2. Fetch fresh from API — API is the source of truth
    api.get('/settings/appearance/').then(res => {
      const fresh = res.data?.data;
      if (!fresh) return;
      applyTheme(fresh);
      if (user) {
        setUser({ ...user, preferences: { ...user.preferences, ...fresh } });
      }
    }).catch(() => {
      // Silently fall back to stored/default already applied above
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (layoutStyle === 'topnav') return <TopNavLayout />;
  return <SidebarLayout compact={layoutStyle === 'compact'} sidebarPosition={sidebarPosition} />;
}
