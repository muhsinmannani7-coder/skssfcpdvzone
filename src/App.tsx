import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { ToastProvider, Toaster } from '@/components/shared/Toaster'
import OperatorLogin from '@/components/auth/OperatorLogin'
import AdminLayout from '@/components/admin/AdminLayout'
import OperatorDashboard from '@/components/operator/AttendanceDashboard'
import LoadingScreen from '@/components/shared/LoadingScreen'
import PublicMeetingAttendance from '@/components/public/PublicMeetingAttendance'
import PublicAttendanceBoard from '@/components/public/PublicAttendanceBoard'
import LiveMeetingProjector from '@/components/admin/LiveMeetingProjector'
import HomePage from '@/components/public/HomePage'
import PublicScoreboard from '@/components/public/PublicScoreboard'
import PublicVideos from '@/components/public/PublicVideos'
import PublicBranches from '@/components/public/PublicBranches'
import PublicDirectory from '@/components/public/PublicDirectory'
import PublicAnnouncements from '@/components/public/PublicAnnouncements'
import MobileAppLogin from '@/components/auth/MobileAppLogin'
import MobileAppShell from '@/components/app/MobileAppShell'
import AppHomeScreen from '@/components/app/AppHomeScreen'
import AppBranchesScreen from '@/components/app/AppBranchesScreen'
import AppActivitiesScreen from '@/components/app/AppActivitiesScreen'
import AppReportsScreen from '@/components/app/AppReportsScreen'
import AppProfileScreen from '@/components/app/AppProfileScreen'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      retry: 1,
    },
  },
})

function AppRoutes() {
  const { loading, isAdmin, isSecretary, isOperator } = useAuth()
  const isAuthenticated = isAdmin || isSecretary

  return (
    <Routes>
      {/* 0. Public Portal Pages */}
      <Route path="/" element={<HomePage />} />
      <Route path="/scoreboard" element={<PublicScoreboard />} />
      <Route path="/videos" element={<PublicVideos />} />
      <Route path="/branches" element={<PublicBranches />} />
      <Route path="/directory" element={<PublicDirectory />} />
      <Route path="/announcements" element={<PublicAnnouncements />} />

      {/* 1. Mobile App Shell (WhatsApp/Instagram Style - For Admin & Secretaries) */}
      <Route
        path="/app"
        element={
          isAuthenticated ? <MobileAppShell /> : <Navigate to="/login" replace />
        }
      >
        <Route index element={<AppHomeScreen />} />
        <Route path="branches" element={<AppBranchesScreen />} />
        <Route path="activities" element={<AppActivitiesScreen />} />
        <Route path="reports" element={<AppReportsScreen />} />
        <Route path="profile" element={<AppProfileScreen />} />
      </Route>

      {/* 2. Public Kiosk / WhatsApp Attendance Links (No Login Required) */}
      <Route path="/attend" element={<PublicMeetingAttendance />} />
      <Route path="/attend/:id" element={<PublicMeetingAttendance />} />
      <Route path="/m" element={<PublicMeetingAttendance />} />
      <Route path="/m/:id" element={<PublicMeetingAttendance />} />
      <Route path="/live" element={<PublicMeetingAttendance />} />

      {/* 2b. Public Attendance Board — Shareable read-only attendance list */}
      <Route path="/board/:id" element={<PublicAttendanceBoard />} />

      {/* 3. Fullscreen Live Projector / Display Mode */}
      <Route path="/admin/projector/:id" element={<LiveMeetingProjector />} />

      {/* 4. Unified Mobile App Authentication Pages */}
      <Route path="/login" element={<MobileAppLogin />} />
      <Route path="/admin/login" element={<MobileAppLogin />} />
      <Route path="/operator/login" element={<OperatorLogin />} />

      {/* 5. Authenticated Admin Desktop Console */}
      {isAdmin && <Route path="/admin/*" element={<AdminLayout />} />}

      {/* 6. Authenticated Operator Portal */}
      {isOperator && <Route path="/operator" element={<OperatorDashboard />} />}

      {/* 7. Fallback redirection */}
      {loading ? (
        <Route path="*" element={<LoadingScreen />} />
      ) : (
        <Route path="*" element={<Navigate to="/" replace />} />
      )}
    </Routes>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ToastProvider>
          <AuthProvider>
            <AppRoutes />
            <Toaster />
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
