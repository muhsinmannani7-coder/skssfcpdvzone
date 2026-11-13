import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase, type ScoreCategory, SCORE_CATEGORY_MAX_MARKS } from '@/lib/supabase'
import PublicNavbar from './PublicNavbar'
import PublicFooter from './PublicFooter'
import {
  Trophy, Award, ChevronDown, ChevronUp,
  Search, Info, FileSpreadsheet
} from 'lucide-react'
import { clsx } from 'clsx'
import * as XLSX from 'xlsx'

interface UnitData {
  id: string
  name: string
  cluster_id: string
  clusters: { id: string; name: string; code: string } | null
}

interface ScoreRecord {
  id: string
  unit_id: string
  category: ScoreCategory
  marks: number
  max_marks: number
  notes: string | null
  is_published: boolean
}

const CATEGORIES: ScoreCategory[] = [
  'MASIRA',
  'KHUTBIYYATH',
  'HIDAYA',
  'EDU VISION',
  'RAHMA BLOOD BANK',
  'SAHACHARI CONNECT',
  'ULAMA-UMARA SANGAMAM',
]

export default function PublicScoreboard() {
  const [selectedCluster, setSelectedCluster] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedUnitId, setExpandedUnitId] = useState<string | null>(null)

  // Fetch Units
  const { data: units = [], isLoading: unitsLoading } = useQuery<UnitData[]>({
    queryKey: ['public-scoreboard-units'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('units')
        .select('id, name, cluster_id, clusters(id, name, code)')
        .eq('is_active', true)
        .order('name')
      if (error) throw error
      return (data || []) as unknown as UnitData[]
    },
  })

  // Fetch Scores
  const { data: scores = [], isLoading: scoresLoading } = useQuery<ScoreRecord[]>({
    queryKey: ['public-scoreboard-scores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('branch_scores')
        .select('*')
        .eq('is_published', true)
      if (error) {
        // Table might be freshly created, gracefully return empty
        console.warn('Error fetching branch scores:', error.message)
        return []
      }
      return (data || []) as ScoreRecord[]
    },
  })

  const isLoading = unitsLoading || scoresLoading

  // Aggregate scoreboard data
  const scoreboardData = useMemo(() => {
    const scoreMap = new Map<string, Record<string, { marks: number; notes: string | null }>>()
    scores.forEach((s) => {
      if (!scoreMap.has(s.unit_id)) {
        scoreMap.set(s.unit_id, {})
      }
      scoreMap.get(s.unit_id)![s.category] = { marks: Number(s.marks), notes: s.notes }
    })

    const rows = units.map((u) => {
      const uScores = scoreMap.get(u.id) || {}
      let total = 0
      const categoryScores: Record<ScoreCategory, { marks: number; max: number; notes: string | null }> = {} as any

      CATEGORIES.forEach((cat) => {
        const item = uScores[cat]
        const marks = item ? item.marks : 0
        total += marks
        categoryScores[cat] = {
          marks,
          max: SCORE_CATEGORY_MAX_MARKS[cat],
          notes: item ? item.notes : null,
        }
      })

      return {
        unitId: u.id,
        unitName: u.name,
        clusterName: u.clusters?.name || 'Zone',
        clusterCode: u.clusters?.code || '—',
        clusterId: u.cluster_id,
        categoryScores,
        totalMarks: Number(total.toFixed(2)),
        maxTotal: 100,
        percentage: Number(total.toFixed(1)),
        rank: 0,
      }
    })

    // Filter by cluster
    let filtered = selectedCluster === 'all'
      ? rows
      : rows.filter((r) => r.clusterCode === selectedCluster || r.clusterId === selectedCluster)

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter((r) => r.unitName.toLowerCase().includes(q))
    }

    // Sort descending by totalMarks
    filtered.sort((a, b) => b.totalMarks - a.totalMarks)

    // Dense Ranking
    let currentRank = 1
    for (let i = 0; i < filtered.length; i++) {
      if (i === 0) {
        filtered[i].rank = 1
      } else if (filtered[i].totalMarks === filtered[i - 1].totalMarks) {
        filtered[i].rank = filtered[i - 1].rank
      } else {
        currentRank = i + 1
        filtered[i].rank = currentRank
      }
    }

    return filtered
  }, [units, scores, selectedCluster, searchQuery])

  // Top 3 Leader
  const topThree = useMemo(() => {
    return scoreboardData.slice(0, 3)
  }, [scoreboardData])

  // Export to Excel
  const handleExportExcel = () => {
    const headers = ['Rank', 'ശാഖ (Unit)', 'ക്ലസ്റ്റർ (Cluster)', ...CATEGORIES.map(c => `${c} (${SCORE_CATEGORY_MAX_MARKS[c]})`), 'ആകെ മാർക്ക് (Total)', 'ശതമാനം (%)']
    const data = scoreboardData.map(r => [
      r.rank,
      r.unitName,
      r.clusterCode,
      ...CATEGORIES.map(c => r.categoryScores[c].marks),
      r.totalMarks,
      `${r.percentage}%`,
    ])

    const ws = XLSX.utils.aoa_to_sheet([headers, ...data])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Branch Scoreboard')
    XLSX.writeFile(wb, `SKSSF_Chapparappadavu_Scoreboard_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  return (
    <div className="min-h-screen bg-surface-50 flex flex-col font-sans">
      <PublicNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Page Title & Intro */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
            <Trophy className="w-3.5 h-3.5" /> 100 Marks Evaluation System
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-surface-900 tracking-tight">
            ശാഖാ പെർഫോമൻസ് സ്കോർബോർഡ്
          </h1>
          <p className="text-sm text-surface-600 leading-relaxed">
            ചപ്പാരപ്പടവ് മേഖലാ പരിധിയിലെ 16 ശാഖകളുടെ സമഗ്ര പ്രകടന വിലയിരുത്തൽ. മസീറ, ഖുതുബിയ്യത്ത്, ഹിദായ, എഡ്യൂവിഷൻ, റഹ്മ, സഹചാരി, ഉലമാ-ഉമറാ സംഗമം എന്നിവയിലെ പോയിന്റുകൾ.
          </p>
        </div>

        {/* Podium / Top 3 Showcase */}
        {topThree.length >= 3 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
            {/* 2nd Place */}
            <div className="order-2 md:order-1 bg-white rounded-2xl border border-surface-200 p-5 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-400" />
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-700 font-extrabold flex items-center justify-center text-lg shadow-inner mb-3">
                🥈 2
              </div>
              <h3 className="font-bold text-surface-800 text-base">{topThree[1].unitName}</h3>
              <p className="text-xs text-surface-400 mt-0.5">{topThree[1].clusterName}</p>
              <div className="mt-4 bg-slate-50 px-4 py-2 rounded-xl">
                <span className="text-2xl font-black text-slate-800">{topThree[1].totalMarks}</span>
                <span className="text-xs text-slate-500 font-semibold"> / 100</span>
              </div>
            </div>

            {/* 1st Place */}
            <div className="order-1 md:order-2 bg-gradient-to-b from-amber-50 to-white rounded-2xl border-2 border-amber-300 p-6 shadow-md flex flex-col items-center text-center relative overflow-hidden -translate-y-2">
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-400 to-yellow-500" />
              <div className="w-14 h-14 rounded-full bg-amber-400 text-amber-950 font-black flex items-center justify-center text-2xl shadow-md mb-3">
                👑
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-200/60 px-2 py-0.5 rounded-full mb-1">
                TOP RANK
              </span>
              <h3 className="font-black text-surface-900 text-lg">{topThree[0].unitName}</h3>
              <p className="text-xs text-surface-500">{topThree[0].clusterName}</p>
              <div className="mt-4 bg-amber-100/70 px-5 py-2.5 rounded-2xl border border-amber-200">
                <span className="text-3xl font-black text-amber-900">{topThree[0].totalMarks}</span>
                <span className="text-xs text-amber-700 font-bold"> / 100</span>
              </div>
            </div>

            {/* 3rd Place */}
            <div className="order-3 bg-white rounded-2xl border border-surface-200 p-5 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-amber-700" />
              <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-800 font-extrabold flex items-center justify-center text-lg shadow-inner mb-3">
                🥉 3
              </div>
              <h3 className="font-bold text-surface-800 text-base">{topThree[2].unitName}</h3>
              <p className="text-xs text-surface-400 mt-0.5">{topThree[2].clusterName}</p>
              <div className="mt-4 bg-orange-50 px-4 py-2 rounded-xl">
                <span className="text-2xl font-black text-orange-900">{topThree[2].totalMarks}</span>
                <span className="text-xs text-orange-600 font-semibold"> / 100</span>
              </div>
            </div>
          </div>
        )}

        {/* Categories Breakdown Legend */}
        <div className="bg-white rounded-2xl border border-surface-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-surface-700">
              വിലയിരുത്തൽ വിഭാഗങ്ങൾ (Evaluation Categories & Max Marks)
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {CATEGORIES.map((cat) => (
              <div key={cat} className="bg-surface-50 rounded-xl p-2.5 text-center border border-surface-100">
                <p className="text-[11px] font-bold text-surface-700 truncate" title={cat}>{cat}</p>
                <p className="text-sm font-extrabold text-emerald-700 mt-0.5">
                  {SCORE_CATEGORY_MAX_MARKS[cat]} <span className="text-[10px] font-normal text-surface-400">Marks</span>
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          {/* Cluster filter tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-surface-200/60 rounded-2xl w-full sm:w-auto overflow-x-auto">
            {[
              { id: 'all', label: 'All Clusters (16 ശാഖകൾ)' },
              { id: 'PAD', label: 'PADAPPENGAD' },
              { id: 'KUT', label: 'KUTTAPARAMB' },
              { id: 'PER', label: 'PERUMALABAD' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedCluster(tab.id)}
                className={clsx(
                  'px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap',
                  selectedCluster === tab.id
                    ? 'bg-white text-emerald-800 shadow-sm'
                    : 'text-surface-600 hover:text-surface-900'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-60">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-surface-400" />
              <input
                type="text"
                placeholder="ശാഖ തിരയുക..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-surface-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Export Excel */}
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-surface-200 bg-white hover:bg-surface-50 text-xs font-semibold text-surface-700 transition shadow-sm"
              title="Download Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Excel</span>
            </button>
          </div>
        </div>

        {/* Scoreboard Table */}
        <div className="bg-white rounded-2xl border border-surface-200 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="animate-spin w-8 h-8 rounded-full border-4 border-emerald-600 border-t-transparent mx-auto mb-2" />
              <p className="text-xs text-surface-500 font-medium">സ്കോറുകൾ ശേഖരിക്കുന്നു...</p>
            </div>
          ) : scoreboardData.length === 0 ? (
            <div className="p-12 text-center text-surface-400">
              <Trophy className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-semibold">വിവരങ്ങൾ ലഭ്യമല്ല</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-surface-50 border-b border-surface-200 text-surface-600 font-bold uppercase tracking-wider text-left">
                    <th className="px-4 py-3.5 w-16 text-center">Rank</th>
                    <th className="px-4 py-3.5">ശാഖ (Unit)</th>
                    <th className="px-3 py-3.5 hidden md:table-cell">ക്ലസ്റ്റർ</th>
                    {CATEGORIES.map((c) => (
                      <th key={c} className="px-2 py-3.5 text-center hidden lg:table-cell">
                        {c.length > 8 ? c.slice(0, 7) + '..' : c}
                      </th>
                    ))}
                    <th className="px-4 py-3.5 text-center">Total (100)</th>
                    <th className="px-4 py-3.5 text-center">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100">
                  {scoreboardData.map((row) => {
                    const isExpanded = expandedUnitId === row.unitId
                    return (
                      <>
                        <tr
                          key={row.unitId}
                          onClick={() => setExpandedUnitId(isExpanded ? null : row.unitId)}
                          className={clsx(
                            'hover:bg-emerald-50/40 transition cursor-pointer',
                            row.rank === 1 && 'bg-amber-50/40',
                            row.rank === 2 && 'bg-slate-50/50',
                            row.rank === 3 && 'bg-orange-50/30'
                          )}
                        >
                          <td className="px-4 py-3 text-center">
                            <span
                              className={clsx(
                                'inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-extrabold',
                                row.rank === 1 ? 'bg-amber-400 text-amber-950' :
                                row.rank === 2 ? 'bg-slate-300 text-slate-800' :
                                row.rank === 3 ? 'bg-orange-300 text-orange-950' :
                                'bg-surface-100 text-surface-600'
                              )}
                            >
                              {row.rank}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-bold text-surface-900 text-sm block">
                              {row.unitName}
                            </span>
                            <span className="text-[11px] text-surface-400 md:hidden">
                              {row.clusterName}
                            </span>
                          </td>
                          <td className="px-3 py-3 hidden md:table-cell">
                            <span className="bg-surface-100 text-surface-700 px-2 py-0.5 rounded-md font-semibold text-[11px]">
                              {row.clusterCode}
                            </span>
                          </td>

                          {/* Desktop category columns */}
                          {CATEGORIES.map((c) => (
                            <td key={c} className="px-2 py-3 text-center hidden lg:table-cell">
                              <span className="font-semibold text-surface-700">
                                {row.categoryScores[c].marks}
                              </span>
                              <span className="text-surface-400 text-[10px]">
                                /{SCORE_CATEGORY_MAX_MARKS[c]}
                              </span>
                            </td>
                          ))}

                          <td className="px-4 py-3 text-center">
                            <div className="inline-block bg-emerald-50 border border-emerald-200/80 px-3 py-1 rounded-xl">
                              <span className="font-black text-emerald-800 text-sm">
                                {row.totalMarks}
                              </span>
                              <span className="text-emerald-600/70 text-[10px] font-bold"> / 100</span>
                            </div>
                          </td>

                          <td className="px-4 py-3 text-center">
                            <button
                              type="button"
                              className="p-1 rounded-lg text-surface-400 hover:text-surface-700 hover:bg-surface-100"
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </td>
                        </tr>

                        {/* Expanded details */}
                        {isExpanded && (
                          <tr key={`${row.unitId}-details`} className="bg-emerald-50/20">
                            <td colSpan={12} className="p-4 sm:p-6 border-b border-surface-200">
                              <div className="space-y-3 max-w-4xl">
                                <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2">
                                  <h4 className="font-bold text-surface-900 text-sm flex items-center gap-2">
                                    <Award className="w-4 h-4 text-emerald-700" />
                                    <span>{row.unitName} — മാർക്ക് വിവരണം</span>
                                  </h4>
                                  <span className="text-xs font-bold text-emerald-800">
                                    ആകെ: {row.totalMarks} / 100 ({row.percentage}%)
                                  </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 pt-1">
                                  {CATEGORIES.map((cat) => {
                                    const c = row.categoryScores[cat]
                                    const pct = Math.round((c.marks / c.max) * 100)
                                    return (
                                      <div
                                        key={cat}
                                        className="bg-white p-3 rounded-xl border border-surface-200 shadow-xs flex flex-col justify-between"
                                      >
                                        <div className="flex items-start justify-between gap-1">
                                          <span className="font-bold text-surface-700 text-xs truncate" title={cat}>
                                            {cat}
                                          </span>
                                          <span className="font-extrabold text-emerald-700 text-xs">
                                            {c.marks} <span className="text-[10px] text-surface-400 font-normal">/{c.max}</span>
                                          </span>
                                        </div>

                                        <div className="w-full bg-surface-100 h-1.5 rounded-full mt-2 overflow-hidden">
                                          <div
                                            className="bg-emerald-600 h-1.5 rounded-full"
                                            style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                                          />
                                        </div>

                                        {c.notes && (
                                          <p className="text-[10px] text-surface-500 mt-2 bg-surface-50 p-1.5 rounded italic">
                                            "{c.notes}"
                                          </p>
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <PublicFooter />
    </div>
  )
}

