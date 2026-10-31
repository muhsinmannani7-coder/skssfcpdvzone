import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { ToastProvider, Toaster } from '@/components/shared/Toaster'
import AdminLogin from '@/components/auth/AdminLogin'
import OperatorLogin from '@/components/auth/OperatorLogin'
import AdminLayout from '@/components/admin/AdminLayout'
import OperatorDashboard from '@/components/operator/AttendanceDashboard'
import LoadingScreen from '@/components/shared/LoadingScreen'
import PublicMeetingAttendance from '@/components/public/PublicMeetingAttendance'
import PublicAttendanceBoard from '@/components/public/PublicAttendanceBoard'
import LiveMeetingProjector from '@/components/admin/LiveMeetingProjector'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      retry: 1,
    },
  },
})

function AppRoutes() {
  const { loading, profile, isAdmin, isOperator } = useAuth()

  return (
    <Routes>
      {/* 1. Public Kiosk / WhatsApp Attendance Links (No Login Required) */}
      <Route path="/attend" element={<PublicMeetingAttendance />} />
      <Route path="/attend/:id" element={<PublicMeetingAttendance />} />
      <Route path="/m" element={<PublicMeetingAttendance />} />
      <Route path="/m/:id" element={<PublicMeetingAttendance />} />
      <Route path="/live" element={<PublicMeetingAttendance />} />

      {/* 1b. Public Attendance Board — Shareable read-only attendance list */}
      <Route path="/board/:id" element={<PublicAttendanceBoard />} />

      {/* 2. Fullscreen Live Projector / Display Mode */}
      <Route path="/admin/projector/:id" element={<LiveMeetingProjector />} />

      {/* 3. Authentication Pages */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/operator/login" element={<OperatorLogin />} />

      {/* 4. Authenticated Admin Portal */}
      {isAdmin && <Route path="/admin/*" element={<AdminLayout />} />}

      {/* 5. Authenticated Operator Portal */}
      {isOperator && <Route path="/operator" element={<OperatorDashboard />} />}

      {/* 6. Fallback redirection */}
      {loading ? (
        <Route path="*" element={<LoadingScreen />} />
      ) : profile ? (
        <Route path="*" element={<Navigate to={isAdmin ? "/admin" : "/operator"} replace />} />
      ) : (
        <Route path="*" element={<Navigate to="/admin/login" replace />} />
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
