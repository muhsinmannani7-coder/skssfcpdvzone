import { useState } from 'react'
import { Routes, Route, NavLink, useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { ToastProvider } from '@/components/shared/Toaster'
import {
  LayoutDashboard, Users, Building2, CalendarCheck,
  ClipboardList, BarChart3, History, Settings, LogOut, Menu, X,
  ChevronRight, Star, Shield, ExternalLink
} from 'lucide-react'
import { clsx } from 'clsx'

// Lazy-loaded admin pages
import AdminDashboard from './Dashboard'
import MemberManagement from './MemberManagement'
import CommitteeManagement from './CommitteeManagement'
import ProgramManagement from './ProgramManagement'
import OperatorManagement from './OperatorManagement'
import SubWingManagement from './SubWingManagement'
import AttendanceReports from './AttendanceReports'
import HistoricalRecords from './HistoricalRecords'
import AdminSettings from './AdminSettings'
import LeaderboardStandings from './LeaderboardStandings'
import { Trophy } from 'lucide-react'

const navItems = [
  { path: '', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { path: 'leaderboard', icon: Trophy, label: 'Leaderboard & Points' },
  { path: 'members', icon: Users, label: 'Members' },
  { path: 'committees', icon: Building2, label: 'Committees & Units' },
  { path: 'programs', icon: CalendarCheck, label: 'Meetings & Attendance' },
  { path: 'operators', icon: ClipboardList, label: 'Operators' },
  { path: 'subwings', icon: Star, label: 'Sub-Wings' },
  { path: 'reports', icon: BarChart3, label: 'Reports' },
  { path: 'history', icon: History, label: 'History' },
  { path: 'settings', icon: Settings, label: 'Settings' },
]

export default function AdminLayout() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/admin/login')
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-surface-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center flex-shrink-0 shadow-glow">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-primary-600 uppercase tracking-wider leading-none">SKSSF</p>
            <p className="text-xs text-surface-500 leading-tight mt-0.5 truncate">Chapparappadavu Zone</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider px-3 mb-2">Menu</p>
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={`/admin/${item.path}`}
            end={item.end}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              clsx('sidebar-item', isActive ? 'sidebar-item-active' : 'sidebar-item-inactive')
            }
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1 text-sm">{item.label}</span>
            <ChevronRight className="w-3 h-3 opacity-40" />
          </NavLink>
        ))}
      </nav>

      {/* Quick Attendance Link in Sidebar */}
      <div className="px-3 pb-3">
        <a
          href="/attend"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white text-xs font-bold shadow-md hover:from-emerald-500 hover:to-teal-600 transition"
        >
          <span className="w-2 h-2 rounded-full bg-white animate-ping" />
          <span className="flex-1">Live Attendance Link</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* User info */}
      <div className="px-3 py-4 border-t border-surface-200">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xs font-bold flex-shrink-0">
            {profile?.full_name?.charAt(0)?.toUpperCase() ?? 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-surface-800 truncate">{profile?.full_name ?? 'Admin'}</p>
            <p className="text-xs text-surface-400">Administrator</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full sidebar-item sidebar-item-inactive text-red-500 hover:bg-red-50 hover:text-red-600 mt-1"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  )

  return (
    <ToastProvider>
      <div className="min-h-screen flex bg-surface-50">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Sidebar - Desktop */}
        <aside className="hidden lg:flex w-60 flex-col bg-white border-r border-surface-200 fixed inset-y-0 left-0 z-30">
          <SidebarContent />
        </aside>

        {/* Sidebar - Mobile */}
        <aside className={clsx(
          'lg:hidden fixed inset-y-0 left-0 w-64 bg-white border-r border-surface-200 z-30 transform transition-transform duration-300',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}>
          <div className="absolute top-4 right-4">
            <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-lg text-surface-500 hover:bg-surface-100">
              <X className="w-4 h-4" />
            </button>
          </div>
          <SidebarContent />
        </aside>

        {/* Main content */}
        <main className="flex-1 lg:ml-60 flex flex-col min-h-screen">
          {/* Top bar */}
          <header className="sticky top-0 z-20 bg-white border-b border-surface-200 px-4 py-3 flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-surface-500 hover:bg-surface-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <p className="text-sm font-semibold text-surface-800 hidden sm:block">SKSSF CHAPPARAPPADAVU ZONE</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="badge badge-blue text-xs hidden sm:flex">Admin Panel</span>
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xs font-bold">
                {profile?.full_name?.charAt(0)?.toUpperCase() ?? 'A'}
              </div>
            </div>
          </header>

          {/* Page content */}
          <div className="flex-1 p-4 lg:p-6">
            <Routes>
              <Route index element={<AdminDashboard />} />
              <Route path="leaderboard" element={<LeaderboardStandings />} />
              <Route path="members" element={<MemberManagement />} />
              <Route path="committees" element={<CommitteeManagement />} />
              <Route path="programs" element={<ProgramManagement />} />
              <Route path="operators" element={<OperatorManagement />} />
              <Route path="subwings" element={<SubWingManagement />} />
              <Route path="reports" element={<AttendanceReports />} />
              <Route path="history" element={<HistoricalRecords />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </ToastProvider>
  )
}
