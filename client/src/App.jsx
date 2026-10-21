import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Layouts & Components
import DashboardLayout from './components/Layout/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import StudentDashboard from './pages/dashboard/StudentDashboard';
import ApproverDashboard from './pages/dashboard/ApproverDashboard';
import AdminDashboard from './pages/dashboard/AdminDashboard';
import NewRequestPage from './pages/requests/NewRequestPage';
import MyRequestsPage from './pages/requests/MyRequestsPage';
import RequestDetailPage from './pages/requests/RequestDetailPage';
import PendingApprovalsPage from './pages/requests/PendingApprovalsPage';
import AllRequestsPage from './pages/requests/AllRequestsPage';
import UsersPage from './pages/admin/UsersPage';
import DocumentTypesPage from './pages/admin/DocumentTypesPage';
import CreateDocumentTypePage from './pages/admin/CreateDocumentTypePage';
import ProfilePage from './pages/profile/ProfilePage';
import VerifyDocumentPage from './pages/verify/VerifyDocumentPage';
import NotFoundPage from './pages/NotFoundPage';
import UnauthorizedPage from './pages/UnauthorizedPage';

const AppRoutes = () => {
  const { user, isAuthenticated } = useAuth();

  const getDashboardByRole = () => {
    if (!user) return <Navigate to="/login" replace />;
    if (user.role === 'student') return <StudentDashboard />;
    if (['class_advisor', 'hod', 'dean'].includes(user.role)) return <ApproverDashboard />;
    if (['admin_staff', 'super_admin'].includes(user.role)) return <AdminDashboard />;
    return <Navigate to="/unauthorized" replace />;
  };

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/dashboard" replace />} />
      <Route path="/register" element={!isAuthenticated ? <RegisterPage /> : <Navigate to="/dashboard" replace />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:resetToken" element={<ResetPasswordPage />} />
      <Route path="/verify/:uid" element={<VerifyDocumentPage />} />
      <Route path="/verify" element={<VerifyDocumentPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={getDashboardByRole()} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/requests/:id" element={<RequestDetailPage />} />
        </Route>
      </Route>

      {/* Student Routes */}
      <Route element={<ProtectedRoute roles={['student']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/requests/new" element={<NewRequestPage />} />
          <Route path="/requests/my" element={<MyRequestsPage />} />
        </Route>
      </Route>

      {/* Approver Routes */}
      <Route element={<ProtectedRoute roles={['class_advisor', 'hod', 'dean', 'admin_staff']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/requests/pending" element={<PendingApprovalsPage />} />
        </Route>
      </Route>

      {/* Admin Routes */}
      <Route element={<ProtectedRoute roles={['admin_staff', 'super_admin']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/requests/all" element={<AllRequestsPage />} />
          <Route path="/admin/document-types" element={<DocumentTypesPage />} />
          <Route path="/admin/document-types/new" element={<CreateDocumentTypePage />} />
          <Route path="/admin/document-types/:id/edit" element={<CreateDocumentTypePage />} />
        </Route>
      </Route>

      {/* Super Admin Routes */}
      <Route element={<ProtectedRoute roles={['super_admin']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/admin/users" element={<UsersPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes;
