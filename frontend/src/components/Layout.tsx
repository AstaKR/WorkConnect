import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import {
  LayoutDashboard, FileText, Clock, CalendarDays, Columns, Users,
  Settings, LogOut, Briefcase, ChevronDown, ChevronRight, Menu, X,
  Shield, Bell, Palette, User, Building2, Map, ShieldCheck
} from 'lucide-react';
import { APP_NAME, COMPANY_NAME } from '../constants';

interface NavItem {
  label: string;
  to?: string;
  icon: React.ReactNode;
  roles: string[];
  children?: { label: string; to: string; icon: React.ReactNode }[];
}

const navItems: NavItem[] = [
  { label: 'My Dashboard', to: '/employee/dashboard', icon: <LayoutDashboard className="w-5 h-5" />, roles: ['employee', 'manager', 'ceo'] },
  { label: 'Work Report', to: '/employee/report', icon: <FileText className="w-5 h-5" />, roles: ['employee', 'manager', 'ceo'] },
  { label: 'Kanban Board', to: '/kanban', icon: <Columns className="w-5 h-5" />, roles: ['employee', 'manager', 'ceo'] },
  { label: 'Report History', to: '/employee/history', icon: <Clock className="w-5 h-5" />, roles: ['employee', 'manager', 'ceo'] },
  { label: 'Calendar', to: '/employee/calendar', icon: <CalendarDays className="w-5 h-5" />, roles: ['employee', 'manager', 'ceo'] },
  { label: 'Manager Dashboard', to: '/manager/dashboard', icon: <LayoutDashboard className="w-5 h-5" />, roles: ['manager', 'ceo'] },
  { label: 'CEO Dashboard', to: '/ceo/dashboard', icon: <Building2 className="w-5 h-5" />, roles: ['ceo'] },
  { label: 'User Management', to: '/users', icon: <Users className="w-5 h-5" />, roles: ['manager', 'ceo'] },
  { label: 'Role Management', to: '/roles', icon: <ShieldCheck className="w-5 h-5" />, roles: ['ceo'] },
  {
    label: 'Settings', icon: <Settings className="w-5 h-5" />, roles: ['employee', 'manager', 'ceo'],
    children: [
      { label: 'Profile', to: '/settings/profile', icon: <User className="w-4 h-4" /> },
      { label: 'Appearance', to: '/settings/appearance', icon: <Palette className="w-4 h-4" /> },
      { label: 'Notifications', to: '/settings/notifications', icon: <Bell className="w-4 h-4" /> },
      { label: 'System Config', to: '/settings/system', icon: <Shield className="w-4 h-4" /> },
      { label: 'Locations', to: '/settings/locations', icon: <Map className="w-4 h-4" /> },
    ],
  },
];

export default function Layout() {
  const { user, logout, branding } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const visibleItems = navItems.filter(item => user && item.roles.includes(user.role));

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-lg overflow-hidden p-0.5">
            {branding.logo ? (
              <img src={branding.logo} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <div className="w-full h-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-white font-bold text-sm leading-tight truncate">{APP_NAME}</p>
            <p className="text-white/40 text-[9px] uppercase tracking-widest mt-0.5 truncate">{COMPANY_NAME}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {visibleItems.map((item) => {
          if (item.children) {
            const isChildActive = item.children.some(c => location.pathname === c.to);
            return (
              <div key={item.label}>
                <button
                  onClick={() => setSettingsOpen(!settingsOpen)}
                  className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isChildActive ? 'bg-white/15 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-3">{item.icon}{item.label}</span>
                  {settingsOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
                {settingsOpen && (
                  <div className="ml-4 mt-0.5 space-y-0.5 border-l border-white/10 pl-3">
                    {item.children
                      .filter(child => !['/settings/system', '/settings/locations'].includes(child.to) || user?.role === 'ceo')
                      .map(child => (
                        <Link
                          key={child.to}
                          to={child.to}
                          onClick={() => setSidebarOpen(false)}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                            location.pathname === child.to ? 'bg-white/15 text-white' : 'text-white/60 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          {child.icon}{child.label}
                        </Link>
                      ))}
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link
              key={item.to}
              to={item.to!}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                location.pathname === item.to ? 'bg-white/15 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="px-3 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {user?.full_name?.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-white text-xs font-semibold truncate">{user?.full_name}</p>
            <p className="text-white/50 text-xs truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        style={{ backgroundColor: 'var(--color-sidebar)' }}
        className={`fixed lg:static inset-y-0 left-0 z-30 w-64 flex-shrink-0 transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <SidebarContent />
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center gap-4 px-4 py-3 bg-white border-b border-gray-200">
          <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              {branding.logo ? (
                <img src={branding.logo} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <Briefcase className="w-4 h-4 text-primary" />
              )}
            </div>
            <span className="font-bold text-gray-900 truncate">{APP_NAME}</span>
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
