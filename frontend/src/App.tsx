import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import axios from 'axios';
import Login from './pages/Login';
import Signup from './pages/Signup';
import EmployeeDashboard from './pages/EmployeeDashboard';
import NewReport from './pages/NewReport';
import ReportHistory from './pages/ReportHistory';
import ManagerDashboard from './pages/ManagerDashboard';
import CEODashboard from './pages/CEODashboard';
import NotificationSettings from './pages/NotificationSettings';
import SystemSettings from './pages/SystemSettings';
import SharedReport from './pages/SharedReport';
import UserManagement from './pages/UserManagement';
import EmployeeDetail from './pages/EmployeeDetail';
import Profile from './pages/Profile';
import AppearanceSettings from './pages/AppearanceSettings';
import CalendarView from './pages/CalendarView';
import KanbanBoard from './pages/KanbanBoard';
import ERPlan from './pages/ERPlan';
import LocationManagement from './pages/LocationManagement';
import RoleManagement from './pages/RoleManagement';
import Layout from './components/Layout';
import { useAuthStore } from './store/useAuthStore';

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) => {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    if (user.role === 'ceo') return <Navigate to="/ceo/dashboard" replace />;
    if (user.role === 'manager') return <Navigate to="/manager/dashboard" replace />;
    return <Navigate to="/employee/dashboard" replace />;
  }
  return <>{children}</>;
};

const ProtectedLayout = () => {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Layout />;
};

function App() {
  const setBranding = useAuthStore(state => state.setBranding);

  React.useEffect(() => {
    const fetchBranding = async () => {
      try {
        const res = await axios.get('/api/settings/public/');
        if (res.data.success) {
          setBranding({
            name: res.data.data.company_name || 'WorkConnect',
            logo: res.data.data.company_logo_url || ''
          });
        }
      } catch (err) { /* silent fail */ }
    };
    fetchBranding();
  }, [setBranding]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/share/:token" element={<SharedReport />} />

        {/* Protected with sidebar layout */}
        <Route element={<ProtectedLayout />}>
          {/* Employee */}
          <Route path="/employee/dashboard" element={<ProtectedRoute allowedRoles={['employee', 'manager', 'ceo']}><EmployeeDashboard /></ProtectedRoute>} />
          <Route path="/employee/report/new" element={<ProtectedRoute allowedRoles={['employee', 'manager', 'ceo']}><NewReport /></ProtectedRoute>} />
          <Route path="/employee/report" element={<ProtectedRoute allowedRoles={['employee', 'manager', 'ceo']}><ERPlan /></ProtectedRoute>} />
          <Route path="/employee/history" element={<ProtectedRoute allowedRoles={['employee', 'manager', 'ceo']}><ReportHistory /></ProtectedRoute>} />
          <Route path="/employee/calendar" element={<ProtectedRoute allowedRoles={['employee', 'manager', 'ceo']}><CalendarView /></ProtectedRoute>} />

          {/* ER Plans / Kanban */}
          <Route path="/kanban" element={<ProtectedRoute allowedRoles={['employee', 'manager', 'ceo']}><KanbanBoard /></ProtectedRoute>} />

          {/* Manager */}
          <Route path="/manager/dashboard" element={<ProtectedRoute allowedRoles={['manager', 'ceo']}><ManagerDashboard /></ProtectedRoute>} />
          <Route path="/manager/employee/:id" element={<ProtectedRoute allowedRoles={['manager', 'ceo']}><EmployeeDetail /></ProtectedRoute>} />

          {/* CEO */}
          <Route path="/ceo/dashboard" element={<ProtectedRoute allowedRoles={['ceo']}><CEODashboard /></ProtectedRoute>} />

          {/* User management */}
          <Route path="/users" element={<ProtectedRoute allowedRoles={['manager', 'ceo']}><UserManagement /></ProtectedRoute>} />
          {/* Role management */}
          <Route path="/roles" element={<ProtectedRoute allowedRoles={['ceo']}><RoleManagement /></ProtectedRoute>} />

          {/* Settings */}
          <Route path="/settings/profile" element={<ProtectedRoute allowedRoles={['employee', 'manager', 'ceo']}><Profile /></ProtectedRoute>} />
          <Route path="/settings/appearance" element={<ProtectedRoute allowedRoles={['employee', 'manager', 'ceo']}><AppearanceSettings /></ProtectedRoute>} />
          <Route path="/settings/notifications" element={<ProtectedRoute allowedRoles={['employee', 'manager', 'ceo']}><NotificationSettings /></ProtectedRoute>} />
          <Route path="/settings/system" element={<ProtectedRoute allowedRoles={['ceo']}><SystemSettings /></ProtectedRoute>} />
          <Route path="/settings/locations" element={<ProtectedRoute allowedRoles={['ceo']}><LocationManagement /></ProtectedRoute>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
