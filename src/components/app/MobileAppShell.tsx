import { useState } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import ForceChangePasswordModal from '@/components/auth/ForceChangePasswordModal'
import {
  Home, Building2, Flame, BarChart3, User,
  Bell, Shield, CalendarCheck
} from 'lucide-react'
import { clsx } from 'clsx'

const navTabs = [
  { path: '/app', icon: Home, label: 'Home', end: true },
  { path: '/app/branches', icon: Building2, label: 'ശാഖകൾ' },
  { path: '/app/activities', icon: Flame, label: 'പ്രവർത്തനങ്ങൾ' },
  { path: '/app/reports', icon: BarChart3, label: 'റിപ്പോർട്ടുകൾ' },
  { path: '/app/profile', icon: User, label: 'പ്രൊഫൈൽ' },
]

export default function MobileAppShell() {
  const { secretaryAccount, isAdmin, mustChangePassword } = useAuth()
  const location = useLocation()
  const [showNotifications, setShowNotifications] = useState(false)

  const activeBranchName = secretaryAccount?.unit?.name || (isAdmin ? 'ചപ്പാരപ്പടവ് മേഖല' : 'SKSSF App')

  return (
    <div className="min-h-screen bg-surface-50 text-surface-900 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Forced Password Change Modal */}
      {mustChangePassword && <ForceChangePasswordModal />}

      {/* ── Mobile-First Header / Top App Bar ── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-surface-200 shadow-xs px-4 py-3">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-xs">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xs tracking-tight text-emerald-800">
                  SKSSF ZONE
                </span>
                <span className="text-[9px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-md">
                  {isAdmin ? 'ADMIN' : 'SECRETARY'}
                </span>
              </div>
              <p className="text-[11px] font-bold text-surface-700 truncate max-w-[180px]">
                {activeBranchName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Live Attendance Quick Pill */}
            <NavLink
              to="/attend"
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[11px] font-bold shadow-xs hover:bg-emerald-700 transition"
            >
              <CalendarCheck className="w-3 h-3" />
              <span>ഹാജർ</span>
            </NavLink>

            {/* Notification Bell */}
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-xl text-surface-600 hover:bg-surface-100 transition relative"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white animate-pulse" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Screen View Area ── */}
      <main className="flex-1 max-w-md w-full mx-auto pb-24 px-4 pt-4">
        <Outlet />
      </main>

      {/* ── Fixed Bottom Navigation Bar (App Shell) ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-surface-200 py-1.5 px-3 shadow-lg">
        <div className="max-w-md mx-auto flex items-center justify-around">
          {navTabs.map((tab) => {
            const isActive = tab.end
              ? location.pathname === tab.path
              : location.pathname.startsWith(tab.path)
            return (
              <NavLink
                key={tab.path}
                to={tab.path}
                className={clsx(
                  'flex flex-col items-center justify-center py-1 px-2 rounded-xl transition duration-200 relative group',
                  isActive
                    ? 'text-emerald-700 font-bold scale-105'
                    : 'text-surface-400 hover:text-surface-700 font-medium'
                )}
              >
                {isActive && (
                  <span className="absolute -top-1 w-6 h-0.5 rounded-full bg-emerald-600 shadow-glow" />
                )}
                <tab.icon className={clsx('w-5 h-5 mb-0.5 transition-transform group-active:scale-90', isActive && 'text-emerald-600')} />
                <span className="text-[10px] tracking-tight">{tab.label}</span>
              </NavLink>
            )
          })}
        </div>
      </nav>

      {/* ── Quick Notification Drawer / Modal ── */}
      {showNotifications && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full p-5 max-h-[80vh] overflow-y-auto space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-surface-100 pb-3">
              <h3 className="font-extrabold text-sm text-surface-900 flex items-center gap-2">
                <Bell className="w-4 h-4 text-emerald-600" />
                <span>അറിയിപ്പുകൾ (Notifications)</span>
              </h3>
              <button
                onClick={() => setShowNotifications(false)}
                className="text-xs font-bold text-surface-500 hover:text-surface-800"
              >
                Close
              </button>
            </div>

            <div className="space-y-2.5">
              <div className="bg-emerald-50/70 p-3 rounded-2xl border border-emerald-100 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider bg-emerald-200/60 px-1.5 py-0.2 rounded">
                    Zone Circular
                  </span>
                  <span className="text-[10px] text-surface-400">ഇന്ന്</span>
                </div>
                <h4 className="font-bold text-xs text-surface-900">
                  ശാഖാ വിവര ശേഖരണം പൂർത്തിയാക്കുക
                </h4>
                <p className="text-[11px] text-surface-600 leading-relaxed">
                  മേഖലാ പരിധിയിലെ 16 ശാഖകളുടെയും മഹല്ല്, കമ്മിറ്റി വിവരങ്ങൾ ആപ്പിൽ കൃത്യമായി അപ്‌ഡേറ്റ് ചെയ്യുക.
                </p>
              </div>

              <div className="bg-surface-50 p-3 rounded-2xl border border-surface-100 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-surface-600 uppercase tracking-wider bg-surface-200 px-1.5 py-0.2 rounded">
                    Scoreboard
                  </span>
                  <span className="text-[10px] text-surface-400">അപ്‌ഡേറ്റ്</span>
                </div>
                <h4 className="font-bold text-xs text-surface-900">
                  100 മാർക്ക് സ്കോർബോർഡ് ലൈവായി
                </h4>
                <p className="text-[11px] text-surface-600 leading-relaxed">
                  7 പ്രോജക്റ്റുകളുടെ മൂല്യനിർണ്ണയ മാർക്കുകൾ റിപ്പോർട്ട്സ് ടാബിൽ കാണാം.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
