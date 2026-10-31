import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase, type Program, type AuditLog } from '@/lib/supabase'
import {
  History, Calendar, MapPin, CheckCircle,
  Search, Activity,
  Clock, Shield, Loader2, ArrowRight
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { clsx } from 'clsx'

export default function HistoricalRecords() {
  const [activeTab, setActiveTab] = useState<'programs' | 'audit'>('programs')
  const [search, setSearch] = useState('')

  // 1. Fetch closed / past programs
  const { data: pastPrograms = [], isLoading: loadingPrograms } = useQuery<Program[]>({
    queryKey: ['past-programs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('programs')
        .select('*')
        .eq('status', 'closed')
        .order('program_date', { ascending: false })
      if (error) throw error
      return (data ?? []) as Program[]
    },
  })

  // 2. Fetch audit logs
  const { data: auditLogs = [], isLoading: loadingLogs } = useQuery<AuditLog[]>({
    queryKey: ['audit-logs'],
    enabled: activeTab === 'audit',
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) throw error
      return (data ?? []) as AuditLog[]
    },
  })

  const filteredPrograms = pastPrograms.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.venue.toLowerCase().includes(search.toLowerCase()) ||
    p.program_date.includes(search)
  )

  const filteredLogs = auditLogs.filter(l =>
    l.action.toLowerCase().includes(search.toLowerCase()) ||
    (l.table_name || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 page-transition">
      <div>
        <h1 className="page-title">Historical Records & Audit</h1>
        <p className="page-subtitle">Access archives of completed programs and security audit logs</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-surface-200 pb-3">
        <button
          onClick={() => setActiveTab('programs')}
          className={clsx(
            'px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2',
            activeTab === 'programs'
              ? 'bg-primary-600 text-white shadow-sm'
              : 'text-surface-600 hover:bg-surface-100'
          )}
        >
          <History className="w-4 h-4" />
          <span>Past Programs Archive ({pastPrograms.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={clsx(
            'px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2',
            activeTab === 'audit'
              ? 'bg-primary-600 text-white shadow-sm'
              : 'text-surface-600 hover:bg-surface-100'
          )}
        >
          <Activity className="w-4 h-4" />
          <span>Security Audit Trail</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input
            type="text"
            className="input pl-9"
            placeholder={activeTab === 'programs' ? 'Search past programs by title, venue, or date...' : 'Search audit events...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Tab 1: Past Programs */}
      {activeTab === 'programs' && (
        <div>
          {loadingPrograms ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary-600 mb-2" />
              <p className="text-sm text-surface-500">Loading historical archives...</p>
            </div>
          ) : filteredPrograms.length === 0 ? (
            <div className="card p-8 text-center">
              <History className="w-12 h-12 text-surface-300 mx-auto mb-2" />
              <p className="font-semibold text-surface-700">No Past Programs Found</p>
              <p className="text-xs text-surface-400 mt-1">
                Completed programs that have been closed will automatically be archived here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPrograms.map((p) => (
                <div key={p.id} className="card p-5 border border-surface-200 hover:border-primary-300 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="badge badge-gray text-xs mb-1.5">Archived / Closed</span>
                      <h3 className="text-base font-bold text-surface-900 leading-snug">{p.name}</h3>
                    </div>
                    <CheckCircle className="w-5 h-5 text-teal-600 flex-shrink-0" />
                  </div>

                  <div className="mt-3 space-y-1.5 text-xs text-surface-500">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-surface-400" />
                      <span>{new Date(p.program_date).toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-surface-400" />
                      <span>{p.venue}</span>
                    </div>
                    {p.closed_at && (
                      <div className="flex items-center gap-2 text-surface-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Closed at: {new Date(p.closed_at).toLocaleTimeString('en-IN')}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-surface-100 flex items-center justify-between">
                    <Link
                      to="/admin/reports"
                      className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1"
                    >
                      <span>View Full Report & Standings</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Security Audit Trail */}
      {activeTab === 'audit' && (
        <div className="card overflow-hidden">
          {loadingLogs ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary-600 mb-2" />
              <p className="text-sm text-surface-500">Loading audit trail...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-8 text-center">
              <Shield className="w-12 h-12 text-surface-300 mx-auto mb-2" />
              <p className="font-semibold text-surface-700">No Audit Events Logged</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Action</th>
                    <th>Target Table</th>
                    <th>Actor ID</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="text-xs text-surface-500 whitespace-nowrap font-mono">
                        {new Date(log.created_at).toLocaleString('en-IN')}
                      </td>
                      <td>
                        <span
                          className={clsx(
                            'badge text-xs font-mono uppercase',
                            log.action.includes('START') ? 'badge-green' :
                            log.action.includes('CLOSE') ? 'badge-red' :
                            log.action.includes('MARK') ? 'badge-blue' : 'badge-gray'
                          )}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="text-xs font-mono text-surface-600">{log.table_name || '—'}</td>
                      <td className="text-xs font-mono text-surface-400 truncate max-w-[150px]">
                        {log.actor_id || 'System'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
