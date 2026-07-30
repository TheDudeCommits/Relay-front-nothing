import { createBrowserRouter, Navigate } from 'react-router';
import { ProtectedRoute } from './ProtectedRoute';
import { Login } from './Login';
import { Dashboard } from './Dashboard';
import { DevicePage } from '../features/device/DevicePage';
import { KycPage } from '../features/kyc/KycPage';
import { AuthorizePage } from '../features/oauth/AuthorizePage';
import { ConfirmPage } from '../features/confirm/ConfirmPage';
import { LinkPage } from '../features/link/LinkPage';

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/dashboard" replace /> },
  { path: '/login', element: <Login /> },
  { path: '/device', element: <DevicePage /> },
  { path: '/authorize', element: <AuthorizePage /> },
  { path: '/confirm', element: <ConfirmPage /> },
  { path: '/link', element: <LinkPage /> },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/kyc',
    element: (
      <ProtectedRoute>
        <KycPage />
      </ProtectedRoute>
    ),
  },
  { path: '*', element: <Navigate to="/dashboard" replace /> },
]);
