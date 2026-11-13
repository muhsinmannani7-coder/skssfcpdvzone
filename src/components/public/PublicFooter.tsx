import { Shield, Heart } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function PublicFooter() {
  return (
    <footer className="bg-surface-900 text-surface-200 mt-20 border-t border-surface-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Organization info */}
          <div className="space-y-4 md:col-span-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-lg">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-lg text-white">SKSSF CHAPPARAPPADAVU ZONE</span>
                <p className="text-xs text-surface-400">സമസ്ത കേരള സുന്നി സ്റ്റുഡന്റ്സ് ഫെഡറേഷൻ</p>
              </div>
            </div>
            <p className="text-xs text-surface-400 max-w-md leading-relaxed">
              ചപ്പാരപ്പടവ് മേഖലയിലെ 16 ശാഖകൾ, 3 ക്ലസ്റ്ററുകൾ, സംഘടന പ്രവർത്തനങ്ങൾ, മീറ്റിംഗുകൾ, വീഡിയോകൾ,
              പദ്ധതികൾ എന്നിവ സമഗ്രമായി ഏകോപിപ്പിക്കുന്ന ഡിജിറ്റൽ മാനേജ്മെന്റ് പ്ലാറ്റ്‌ഫോം.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3">
              പ്രധാന ലിങ്കുകൾ
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/scoreboard" className="hover:text-white transition">
                  ശാഖാ സ്കോർബോർഡ് (100 Marks)
                </Link>
              </li>
              <li>
                <Link to="/branches" className="hover:text-white transition">
                  16 ശാഖകൾ & ഭാരവാഹികൾ
                </Link>
              </li>
              <li>
                <Link to="/videos" className="hover:text-white transition">
                  വീഡിയോ ലൈബ്രറി
                </Link>
              </li>
              <li>
                <Link to="/directory" className="hover:text-white transition">
                  ഉലമാ & ഡോക്ടേഴ്സ് ഡയറക്ടറി
                </Link>
              </li>
              <li>
                <Link to="/announcements" className="hover:text-white transition">
                  അറിയിപ്പുകൾ & സർക്കുലറുകൾ
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Attendance & Admin */}
          <div>
            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3">
              പോർട്ടലുകൾ
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/attend" className="text-emerald-400 hover:text-emerald-300 font-semibold transition">
                  ⚡ ലൈവ് മീറ്റിംഗ് ഹാജർ
                </Link>
              </li>
              <li>
                <Link to="/operator/login" className="hover:text-white transition">
                  ഓപ്പറേറ്റർ ലോഗിൻ
                </Link>
              </li>
              <li>
                <Link to="/admin/login" className="hover:text-white transition">
                  അഡ്മിൻ പാനൽ
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-surface-800 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-surface-400 gap-4">
          <p>© {new Date().getFullYear()} SKSSF Chapparappadavu Zone. All rights reserved.</p>
          <p className="flex items-center gap-1">
            <span>Designed for SKSSF Chapparappadavu Zone</span>
            <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
          </p>
        </div>
      </div>
    </footer>
  )
}

