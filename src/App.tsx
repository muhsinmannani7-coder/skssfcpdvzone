import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { ToastProvider, Toaster } from '@/components/shared/Toaster'
import AdminLogin from '@/components/auth/AdminLogin'
import OperatorLogin from '@/components/auth/OperatorLogin'
import AdminLayout from '@/components/admin/AdminLayout'
import OperatorDashboard from '@/components/operator/AttendanceDashboard'
import LoadingScreen from '@/components/shared/LoadingScreen'

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

  if (loading) return <LoadingScreen />

  if (!profile) {
    return (
      <Routes>
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/operator/login" element={<OperatorLogin />} />
        <Route path="*" element={<Navigate to="/admin/login" replace />} />
      </Routes>
    )
  }

  if (isAdmin) {
    return (
      <Routes>
        <Route path="/admin/*" element={<AdminLayout />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    )
  }

  if (isOperator) {
    return (
      <Routes>
        <Route path="/operator" element={<OperatorDashboard />} />
        <Route path="*" element={<Navigate to="/operator" replace />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/operator/login" element={<OperatorLogin />} />
      <Route path="*" element={<Navigate to="/admin/login" replace />} />
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
