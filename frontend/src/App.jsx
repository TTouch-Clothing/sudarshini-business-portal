import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AppLayout from './layout/AppLayout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import OrdersPage from './pages/OrdersPage';
import CustomersPage from './pages/CustomersPage';
import VipCustomersPage from './pages/VipCustomersPage';
import PeriodPage from './pages/PeriodPage';
import PredictionPage from './pages/PredictionPage';
import UserLogsPage from './pages/UserLogsPage';
import ProfilePage from './pages/ProfilePage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import AdminUsersPage from './pages/AdminUsersPage';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="center-screen">Loading...</div>;

  return user ? children : <Navigate to="/login" replace />;
}

function RoleRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="center-screen">Loading...</div>;

  if (!user) return <Navigate to="/login" replace />;

  return allowedRoles.includes(user.role)
    ? children
    : <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <AppLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="vip-customers" element={<VipCustomersPage />} />
        <Route
          path="daily-sell"
          element={
            <RoleRoute allowedRoles={['ADMIN']}>
              <PeriodPage type="day" title="Daily Sell" />
            </RoleRoute>
          }
        />
        <Route
          path="monthly-sell"
          element={
            <RoleRoute allowedRoles={['ADMIN']}>
              <PeriodPage type="month" title="Monthly Sell" />
            </RoleRoute>
          }
        />
        <Route
          path="yearly-sell"
          element={
            <RoleRoute allowedRoles={['ADMIN']}>
              <PeriodPage type="year" title="Yearly Sell" />
            </RoleRoute>
          }
        />
        <Route path="prediction" element={<PredictionPage />} />
        <Route path="user-logs" element={<UserLogsPage />} />
        <Route path="change-profile" element={<ProfilePage />} />
        <Route path="change-password" element={<ChangePasswordPage />} />
        <Route
          path="admin-users"
          element={
            <RoleRoute allowedRoles={['ADMIN']}>
              <AdminUsersPage />
            </RoleRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}