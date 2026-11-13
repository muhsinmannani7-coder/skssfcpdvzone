import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Shield, Menu, X, Trophy, PlaySquare, Building2,
  PhoneCall, Bell, CalendarCheck, Lock
} from 'lucide-react'
import { clsx } from 'clsx'

const navLinks = [
  { name: 'Home', path: '/' },
  { name: 'സ്കോർബോർഡ്', path: '/scoreboard', icon: Trophy },
  { name: 'വീഡിയോസ്', path: '/videos', icon: PlaySquare },
  { name: 'ശാഖകൾ (16)', path: '/branches', icon: Building2 },
  { name: 'ഡയറക്ടറി', path: '/directory', icon: PhoneCall },
  { name: 'അറിയിപ്പുകൾ', path: '/announcements', icon: Bell },
]

export default function PublicNavbar() {
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-surface-200 transition-all shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-md">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm sm:text-base tracking-tight text-emerald-800">
                  SKSSF
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded">
                  ZONE
                </span>
              </div>
              <p className="text-xs text-surface-500 font-medium">ചപ്പാരപ്പടവ് മേഖലാ കമ്മിറ്റി</p>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const active = location.pathname === link.path
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={clsx(
                    'px-3 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5',
                    active
                      ? 'bg-emerald-50 text-emerald-700 shadow-sm'
                      : 'text-surface-600 hover:text-surface-900 hover:bg-surface-100'
                  )}
                >
                  {link.icon && <link.icon className="w-3.5 h-3.5" />}
                  {link.name}
                </Link>
              )
            })}
          </nav>

          {/* Action Buttons */}
          <div className="hidden sm:flex items-center gap-2">
            <Link
              to="/attend"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold shadow-sm hover:from-emerald-500 hover:to-teal-500 transition"
            >
              <CalendarCheck className="w-3.5 h-3.5" />
              <span>ഹാജർ രേഖപ്പെടുത്തുക</span>
            </Link>
            <Link
              to="/login"
              className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-surface-900 text-white text-xs font-bold hover:bg-surface-800 transition shadow-xs"
            >
              <Lock className="w-3 h-3 text-emerald-400" />
              <span>📱 App / ലോഗിൻ</span>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center gap-2">
            <Link
              to="/attend"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold"
            >
              <span>ഹാജർ</span>
            </Link>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-xl text-surface-600 hover:bg-surface-100 transition"
              aria-label="Toggle Menu"
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {isOpen && (
        <div className="lg:hidden border-b border-surface-200 bg-white px-4 pt-2 pb-4 space-y-1">
          {navLinks.map((link) => {
            const active = location.pathname === link.path
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={clsx(
                  'flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition',
                  active ? 'bg-emerald-50 text-emerald-700' : 'text-surface-700 hover:bg-surface-50'
                )}
              >
                {link.icon && <link.icon className="w-4 h-4 text-emerald-600" />}
                <span>{link.name}</span>
              </Link>
            )
          })}
          <div className="pt-2 border-t border-surface-100 flex flex-col gap-2">
            <Link
              to="/admin/login"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-surface-200 text-surface-700 text-xs font-semibold hover:bg-surface-50"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Admin Login</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}

