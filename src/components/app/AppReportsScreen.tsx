import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase, type Unit } from '@/lib/supabase'
import {
  Trophy, BarChart3, ChevronRight
} from 'lucide-react'
import { clsx } from 'clsx'

export default function AppReportsScreen() {
  const [selectedCluster, setSelectedCluster] = useState<'all' | 'PAD' | 'KUT' | 'PER'>('all')

  // Fetch Units
  const { data: units = [] } = useQuery<Unit[]>({
    queryKey: ['app-reports-units'],
    queryFn: async () => {
      const { data } = await supabase.from('units').select('*, cluster:clusters(*)').eq('is_active', true).order('name')
      return (data || []) as Unit[]
    },
  })

  // Fetch Scores
  const { data: scores = [], isLoading } = useQuery({
    queryKey: ['app-reports-scores'],
    queryFn: async () => {
      const { data } = await supabase.from('branch_scores').select('*').eq('is_published', true)
      return data || []
    },
  })

  // Group scores by unit and sort
  const standings = useMemo(() => {
    const map = new Map<string, number>()
    scores.forEach((s: any) => {
      const id = s.unit_id
      map.set(id, (map.get(id) || 0) + Number(s.marks || 0))
    })

    const rows = units.map((u) => {
      const total = Number((map.get(u.id) || 0).toFixed(1))
      return {
        unitId: u.id,
        unitName: u.name,
        clusterCode: u.cluster?.code || '—',
        clusterId: u.cluster_id,
        totalMarks: total,
        rank: 0,
      }
    })

    let filtered = selectedCluster === 'all'
      ? rows
      : rows.filter((r) => r.clusterCode === selectedCluster)

    filtered.sort((a, b) => b.totalMarks - a.totalMarks)

    let currentRank = 1
    for (let i = 0; i < filtered.length; i++) {
      if (i === 0) filtered[i].rank = 1
      else if (filtered[i].totalMarks === filtered[i - 1].totalMarks) {
        filtered[i].rank = filtered[i - 1].rank
      } else {
        currentRank = i + 1
        filtered[i].rank = currentRank
      }
    }
    return filtered
  }, [units, scores, selectedCluster])

  return (
    <div className="space-y-4">
      {/* ── Top Bar ── */}
      <div>
        <h2 className="text-base font-black text-surface-900 tracking-tight flex items-center gap-1.5">
          <Trophy className="w-4 h-4 text-amber-500" />
          <span>ശാഖാ സ്കോർബോർഡ് & റിപ്പോർട്ടുകൾ</span>
        </h2>
        <p className="text-[11px] text-surface-500">
          100 മാർക്ക് ഇവാല്യുവേഷൻ സിസ്റ്റത്തിലെ ശാഖാ റാങ്കിംഗുകൾ
        </p>
      </div>

      {/* ── Quick Links Strip ── */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <Link
          to="/scoreboard"
          className="bg-white p-3 rounded-2xl border border-surface-200 shadow-xs flex items-center justify-between hover:border-emerald-400 transition"
        >
          <div>
            <span className="font-extrabold text-surface-900 block">പൂർണ്ണ സ്കോർബോർഡ്</span>
            <span className="text-[10px] text-surface-400">7 കാറ്റഗറി വിവരണം</span>
          </div>
          <ChevronRight className="w-4 h-4 text-emerald-600" />
        </Link>

        <Link
          to="/admin/unit-report"
          className="bg-white p-3 rounded-2xl border border-surface-200 shadow-xs flex items-center justify-between hover:border-emerald-400 transition"
        >
          <div>
            <span className="font-extrabold text-surface-900 block">അറ്റൻഡൻസ് റിപ്പോർട്ട്</span>
            <span className="text-[10px] text-surface-400">ഹാജർ കണക്കുകൾ</span>
          </div>
          <BarChart3 className="w-4 h-4 text-teal-600" />
        </Link>
      </div>

      {/* ── Cluster Filter Tabs ── */}
      <div className="flex items-center gap-1 p-1 bg-surface-200/60 rounded-2xl text-[11px] font-bold overflow-x-auto">
        {[
          { id: 'all', label: 'All 16 ശാഖകൾ' },
          { id: 'PAD', label: 'പടപ്പേങ്ങാട്' },
          { id: 'KUT', label: 'കുട്ടപ്പറമ്പ്' },
          { id: 'PER', label: 'പെരുമളാബാദ്' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedCluster(tab.id as any)}
            className={clsx(
              'px-3 py-1.5 rounded-xl transition whitespace-nowrap',
              selectedCluster === tab.id
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-surface-600 hover:text-surface-900'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Standings List ── */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-surface-400">ലോഡ് ചെയ്യുന്നു...</div>
      ) : standings.length === 0 ? (
        <div className="p-8 text-center text-xs text-surface-400 bg-white rounded-2xl">
          വിവരങ്ങൾ ലഭ്യമല്ല
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-surface-200 divide-y divide-surface-100 overflow-hidden shadow-xs">
          {standings.map((row) => (
            <div
              key={row.unitId}
              className={clsx(
                'p-3.5 flex items-center justify-between text-xs hover:bg-surface-50 transition',
                row.rank === 1 && row.totalMarks > 0 && 'bg-amber-50/40',
                row.rank === 2 && row.totalMarks > 0 && 'bg-slate-50/60',
                row.rank === 3 && row.totalMarks > 0 && 'bg-orange-50/30'
              )}
            >
              <div className="flex items-center gap-3">
                <span
                  className={clsx(
                    'w-7 h-7 rounded-full flex items-center justify-center font-extrabold text-[11px]',
                    row.rank === 1 && row.totalMarks > 0 ? 'bg-amber-400 text-amber-950' :
                    row.rank === 2 && row.totalMarks > 0 ? 'bg-slate-300 text-slate-800' :
                    row.rank === 3 && row.totalMarks > 0 ? 'bg-orange-300 text-orange-950' :
                    'bg-surface-100 text-surface-600'
                  )}
                >
                  {row.rank}
                </span>

                <div>
                  <h4 className="font-extrabold text-xs text-surface-900">{row.unitName}</h4>
                  <span className="text-[10px] font-semibold text-surface-400 uppercase">
                    {row.clusterCode}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="font-black text-sm text-emerald-800">{row.totalMarks}</span>
                <span className="text-[10px] text-surface-400 font-semibold block">/ 100</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
