import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase, type Program } from '@/lib/supabase'
import {
  Trophy, Award, Building2, Users, Share2, Shield
} from 'lucide-react'
import { clsx } from 'clsx'

interface UnitStanding {
  unitId: string
  unitName: string
  clusterName: string
  clusterCode: string
  totalOfficers: number
  totalPoints: number
  meetingsCount: number
  attendanceRate: number
}

interface MemberStanding {
  memberId: string
  fullName: string
  mobile: string
  membershipNumber?: string | null
  primaryPosition?: string
  committeeLevel?: string
  totalPoints: number
  attendanceRate: number
}

export default function LeaderboardStandings() {
  const [selectedProgramId, setSelectedProgramId] = useState<string>('all')
  const [activeTab, setActiveTab] = useState<'units' | 'clusters' | 'members' | 'zone'>('units')

  // Fetch all programs for filter dropdown
  const { data: programs = [] } = useQuery<Program[]>({
    queryKey: ['programs-for-leaderboard'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('programs')
        .select('*')
        .order('program_date', { ascending: false })
      if (error) throw error
      return data as Program[]
    },
  })

  // Calculate Standings Data
  const { data: leaderboardData, isLoading } = useQuery({
    queryKey: ['leaderboard-standings', selectedProgramId],
    queryFn: async () => {
      // 1. Fetch attendance
      let attQuery = supabase.from('attendance').select('id, program_id, member_id, marked_at')
      if (selectedProgramId !== 'all') {
        attQuery = attQuery.eq('program_id', selectedProgramId)
      }
      const { data: attendanceList } = await attQuery

      // 2. Fetch units with clusters
      const { data: units } = await supabase
        .from('units')
        .select('id, name, cluster_id, clusters(name, code)')
        .eq('is_active', true)
        .order('sort_order')

      // 3. Fetch members with positions
      const { data: memberPositions } = await supabase
        .from('member_positions')
        .select(`
          member_id, unit_id,
          committees (name, level),
          positions (title),
          members (id, full_name, mobile, membership_number)
        `)
        .eq('is_active', true)

      // 4. Calculate total meetings considered
      const meetingsCount = selectedProgramId === 'all'
        ? (programs.filter(p => p.status !== 'upcoming').length || 1)
        : 1

      // Maps for points
      const unitPointsMap = new Map<string, number>()
      const memberPointsMap = new Map<string, number>()

      // Populate member points from attendance
      for (const att of attendanceList || []) {
        const current = memberPointsMap.get(att.member_id) || 0
        memberPointsMap.set(att.member_id, current + 1)
      }

      // Member metadata
      interface MemberMeta {
        id: string
        fullName: string
        mobile: string
        membershipNumber?: string | null
        positionTitle?: string
        level?: string
        unitId?: string
      }
      const memberMetaMap = new Map<string, MemberMeta>()

      for (const mp of memberPositions || []) {
        const m = mp.members as unknown as { id: string; full_name: string; mobile: string; membership_number?: string | null } | null
        const pos = mp.positions as unknown as { title: string } | null
        const comm = mp.committees as unknown as { level: string } | null

        if (m) {
          if (!memberMetaMap.has(m.id)) {
            memberMetaMap.set(m.id, {
              id: m.id,
              fullName: m.full_name,
              mobile: m.mobile,
              membershipNumber: m.membership_number,
              positionTitle: pos?.title,
              level: comm?.level,
              unitId: mp.unit_id,
            })
          }

          // If member attended, attribute point to their unit
          const pts = memberPointsMap.get(m.id) || 0
          if (mp.unit_id && pts > 0) {
            const currentUnitPts = unitPointsMap.get(mp.unit_id) || 0
            unitPointsMap.set(mp.unit_id, currentUnitPts + pts)
          }
        }
      }

      // Build Unit Standings
      const unitStandings: UnitStanding[] = (units || []).map(u => {
        const cl = u.clusters as unknown as { name: string; code: string } | null
        const totalPts = unitPointsMap.get(u.id) || 0
        const maxPossible = 4 * meetingsCount // 4 officers per unit
        const rate = maxPossible > 0 ? Math.round((totalPts / maxPossible) * 100) : 0

        return {
          unitId: u.id,
          unitName: u.name,
          clusterName: cl?.name || '',
          clusterCode: cl?.code || '',
          totalOfficers: 4,
          totalPoints: totalPts,
          meetingsCount,
          attendanceRate: rate,
        }
      }).sort((a, b) => b.totalPoints - a.totalPoints || b.attendanceRate - a.attendanceRate)

      // Build Cluster Standings
      const clusterMap = new Map<string, { code: string; name: string; points: number; unitsCount: number }>()
      for (const u of unitStandings) {
        if (!clusterMap.has(u.clusterCode)) {
          clusterMap.set(u.clusterCode, {
            code: u.clusterCode,
            name: u.clusterName,
            points: 0,
            unitsCount: 0,
          })
        }
        const c = clusterMap.get(u.clusterCode)!
        c.points += u.totalPoints
        c.unitsCount += 1
      }
      const clusterStandings = Array.from(clusterMap.values()).sort((a, b) => b.points - a.points)

      // Build Member Standings
      const memberStandings: MemberStanding[] = Array.from(memberMetaMap.values()).map(meta => {
        const pts = memberPointsMap.get(meta.id) || 0
        const rate = meetingsCount > 0 ? Math.round((pts / meetingsCount) * 100) : 0
        return {
          memberId: meta.id,
          fullName: meta.fullName,
          mobile: meta.mobile,
          membershipNumber: meta.membershipNumber,
          primaryPosition: meta.positionTitle,
          committeeLevel: meta.level,
          totalPoints: pts,
          attendanceRate: rate,
        }
      }).sort((a, b) => b.totalPoints - a.totalPoints)

      // Zone Members Only
      const zoneStandings = memberStandings.filter(m => m.committeeLevel === 'zone')

      return {
        unitStandings,
        clusterStandings,
        memberStandings,
        zoneStandings,
        totalMeetings: meetingsCount,
      }
    },
    refetchInterval: 15000,
  })

  // WhatsApp share leaderboard
  const handleShareWhatsApp = () => {
    if (!leaderboardData) return
    const progTitle = selectedProgramId === 'all'
      ? 'Cumulative All-Time Standings'
      : programs.find(p => p.id === selectedProgramId)?.name || 'Meeting Standings'

    let text = `*SKSSF CHAPPARAPPADAVU ZONE*\n🏆 *ATTENDANCE LEADERBOARD*\n📊 *${progTitle}*\n\n`
    text += `*TOP UNITS (16 Units):*\n`
    leaderboardData.unitStandings.slice(0, 5).forEach((u, i) => {
      text += `${i + 1}. *${u.unitName}* (${u.clusterCode}) - ${u.totalPoints} Pts (${u.attendanceRate}%)\n`
    })

    text += `\n*CLUSTERS:*\n`
    leaderboardData.clusterStandings.forEach((c, i) => {
      text += `${i + 1}. *${c.name}*: ${c.points} Pts\n`
    })

    text += `\n*TOP ATTENDEES:*\n`
    leaderboardData.memberStandings.slice(0, 5).forEach((m, i) => {
      text += `${i + 1}. ${m.fullName} - ${m.totalPoints} Pts\n`
    })

    text += `\n🔗 Live Portal: https://skssf-cpdv-zone.netlify.app`
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank')
  }

  return (
    <div className="space-y-6 page-transition">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-surface-900 tracking-tight flex items-center gap-2">
            <Trophy className="w-7 h-7 text-amber-500" />
            Leaderboard & Standings
          </h1>
          <p className="text-sm text-surface-500 mt-0.5">
            Real-time attendance rankings, points distribution, and unit standings
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Program filter */}
          <select
            value={selectedProgramId}
            onChange={e => setSelectedProgramId(e.target.value)}
            className="input py-2 text-sm max-w-xs font-semibold bg-white border-surface-300"
          >
            <option value="all">🏆 All Meetings (Cumulative Points)</option>
            {programs.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.status})
              </option>
            ))}
          </select>

          {/* Share WhatsApp */}
          <button
            onClick={handleShareWhatsApp}
            className="btn bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold py-2.5 px-3.5 flex items-center gap-1.5 shadow-sm"
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">WhatsApp Share</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-surface-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('units')}
          className={clsx(
            'px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap',
            activeTab === 'units'
              ? 'bg-primary-600 text-white shadow-sm'
              : 'text-surface-600 hover:bg-surface-100'
          )}
        >
          <Building2 className="w-4 h-4" />
          <span>16 Units Ranking</span>
          {leaderboardData && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-black/20 text-[10px]">
              {leaderboardData.unitStandings.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('clusters')}
          className={clsx(
            'px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap',
            activeTab === 'clusters'
              ? 'bg-primary-600 text-white shadow-sm'
              : 'text-surface-600 hover:bg-surface-100'
          )}
        >
          <Award className="w-4 h-4" />
          <span>3 Clusters Ranking</span>
        </button>

        <button
          onClick={() => setActiveTab('members')}
          className={clsx(
            'px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap',
            activeTab === 'members'
              ? 'bg-primary-600 text-white shadow-sm'
              : 'text-surface-600 hover:bg-surface-100'
          )}
        >
          <Users className="w-4 h-4" />
          <span>All 92 Members</span>
        </button>

        <button
          onClick={() => setActiveTab('zone')}
          className={clsx(
            'px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap',
            activeTab === 'zone'
              ? 'bg-primary-600 text-white shadow-sm'
              : 'text-surface-600 hover:bg-surface-100'
          )}
        >
          <Shield className="w-4 h-4" />
          <span>Zone Leaders (28)</span>
        </button>
      </div>

      {isLoading ? (
        <div className="card py-16 text-center text-surface-400">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm">Calculating points and standings...</p>
        </div>
      ) : !leaderboardData ? null : (
        <>
          {/* TAB 1: 16 UNITS RANKING */}
          {activeTab === 'units' && (
            <div className="card overflow-hidden shadow-sm">
              <div className="p-4 bg-surface-50 border-b border-surface-200 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-surface-900 text-sm">
                    Unit Committees Attendance & Points Ranking
                  </h3>
                  <p className="text-xs text-surface-500">
                    Each officer presence = 1 Point (Max 4 Points per meeting per unit)
                  </p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                  16 Total Units
                </span>
              </div>

              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th className="w-12 text-center">Rank</th>
                      <th>Unit Name</th>
                      <th>Cluster</th>
                      <th className="text-center">Total Points</th>
                      <th>Attendance Rate</th>
                      <th className="text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboardData.unitStandings.map((unit, idx) => (
                      <tr key={unit.unitId} className={idx < 3 ? 'bg-amber-50/40' : undefined}>
                        <td className="text-center font-bold">
                          {idx === 0 ? (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-400 text-slate-900 font-black text-xs shadow-sm">
                              🥇 1
                            </span>
                          ) : idx === 1 ? (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-300 text-slate-900 font-black text-xs shadow-sm">
                              🥈 2
                            </span>
                          ) : idx === 2 ? (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-600 text-white font-black text-xs shadow-sm">
                              🥉 3
                            </span>
                          ) : (
                            <span className="text-surface-400 text-sm">#{idx + 1}</span>
                          )}
                        </td>
                        <td>
                          <p className="font-bold text-surface-900 text-sm">{unit.unitName}</p>
                          <p className="text-xs text-surface-400">4 Registered Officers</p>
                        </td>
                        <td>
                          <span className="badge badge-purple text-xs font-semibold">
                            {unit.clusterCode}
                          </span>
                        </td>
                        <td className="text-center font-black text-primary-700 text-base">
                          {unit.totalPoints} <span className="text-xs text-surface-400 font-normal">pts</span>
                        </td>
                        <td className="w-48">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-surface-100 rounded-full overflow-hidden">
                              <div
                                className={clsx(
                                  'h-full rounded-full transition-all duration-500',
                                  unit.attendanceRate >= 75
                                    ? 'bg-emerald-500'
                                    : unit.attendanceRate >= 50
                                    ? 'bg-teal-500'
                                    : 'bg-amber-500'
                                )}
                                style={{ width: `${unit.attendanceRate}%` }}
                              />
                            </div>
                            <span className="text-xs font-bold text-surface-700 w-10 text-right">
                              {unit.attendanceRate}%
                            </span>
                          </div>
                        </td>
                        <td className="text-right">
                          <span
                            className={clsx(
                              'badge text-xs',
                              unit.attendanceRate === 100
                                ? 'badge-green'
                                : unit.attendanceRate > 0
                                ? 'badge-blue'
                                : 'badge-gray'
                            )}
                          >
                            {unit.attendanceRate === 100 ? '100% Full' : unit.totalPoints > 0 ? 'Active' : 'No Points'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: CLUSTER STANDINGS */}
          {activeTab === 'clusters' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {leaderboardData.clusterStandings.map((c, idx) => (
                <div
                  key={c.code}
                  className={clsx(
                    'card p-6 border-2 relative overflow-hidden transition-all',
                    idx === 0
                      ? 'border-amber-400 bg-gradient-to-b from-amber-50/50 to-white shadow-md'
                      : 'border-surface-200'
                  )}
                >
                  {idx === 0 && (
                    <div className="absolute top-3 right-3 text-2xl">🏆</div>
                  )}
                  <p className="text-xs font-bold text-surface-400 uppercase tracking-wider">
                    Rank #{idx + 1}
                  </p>
                  <h3 className="text-lg font-black text-surface-900 mt-1">{c.name}</h3>
                  <p className="text-xs text-surface-500">{c.unitsCount} Units</p>

                  <div className="mt-6 pt-4 border-t border-surface-100 flex items-baseline justify-between">
                    <div>
                      <p className="text-xs text-surface-400">Total Points</p>
                      <p className="text-3xl font-black text-primary-700">{c.points}</p>
                    </div>
                    <span className="badge badge-purple text-xs">{c.code} CLUSTER</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: ALL MEMBERS RANKING */}
          {activeTab === 'members' && (
            <div className="card overflow-hidden shadow-sm">
              <div className="p-4 bg-surface-50 border-b border-surface-200 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-surface-900 text-sm">
                    Individual Member Attendance Ranking (92 Members)
                  </h3>
                  <p className="text-xs text-surface-500">
                    Ranked by total attendance points across meetings
                  </p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800">
                  92 Total Leaders
                </span>
              </div>

              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th className="w-12 text-center">Rank</th>
                      <th>Member Name</th>
                      <th>Position / Level</th>
                      <th>Mobile</th>
                      <th className="text-center">Points</th>
                      <th className="text-right">Attendance Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboardData.memberStandings.map((m, idx) => (
                      <tr key={m.memberId}>
                        <td className="text-center font-bold text-surface-400 text-sm">
                          #{idx + 1}
                        </td>
                        <td>
                          <p className="font-bold text-surface-900 text-sm">{m.fullName}</p>
                          {m.membershipNumber && (
                            <p className="text-xs text-surface-400">ID: {m.membershipNumber}</p>
                          )}
                        </td>
                        <td>
                          <span
                            className={clsx(
                              'badge text-xs',
                              m.committeeLevel === 'zone'
                                ? 'badge-yellow'
                                : m.committeeLevel === 'cluster'
                                ? 'badge-purple'
                                : 'badge-blue'
                            )}
                          >
                            {m.primaryPosition || 'Member'}
                          </span>
                        </td>
                        <td className="font-mono text-xs text-surface-600">{m.mobile}</td>
                        <td className="text-center font-black text-primary-700">
                          {m.totalPoints}
                        </td>
                        <td className="text-right font-bold text-xs">
                          <span
                            className={clsx(
                              'px-2 py-0.5 rounded-md',
                              m.attendanceRate >= 75
                                ? 'bg-emerald-100 text-emerald-800'
                                : m.attendanceRate > 0
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-surface-100 text-surface-400'
                            )}
                          >
                            {m.attendanceRate}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: ZONE LEADERS (28) */}
          {activeTab === 'zone' && (
            <div className="card overflow-hidden shadow-sm">
              <div className="p-4 bg-surface-50 border-b border-surface-200 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-surface-900 text-sm">
                    Zone Committee Leaders Presence (28 Members)
                  </h3>
                  <p className="text-xs text-surface-500">
                    Attendance records of Chapparappadavu Zone Office Bearers & Secretariat Members
                  </p>
                </div>
                <span className="badge badge-yellow font-bold text-xs">
                  28 Zone Leaders
                </span>
              </div>

              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th className="w-12 text-center">#</th>
                      <th>Leader Name</th>
                      <th>Zone Position</th>
                      <th>Mobile</th>
                      <th className="text-center">Meetings Attended</th>
                      <th className="text-right">Attendance Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboardData.zoneStandings.map((m, idx) => (
                      <tr key={m.memberId}>
                        <td className="text-center font-bold text-surface-400 text-sm">
                          {idx + 1}
                        </td>
                        <td>
                          <p className="font-bold text-surface-900 text-sm">{m.fullName}</p>
                          {m.membershipNumber && (
                            <p className="text-xs text-surface-400">ID: {m.membershipNumber}</p>
                          )}
                        </td>
                        <td>
                          <span className="badge badge-yellow text-xs font-bold">
                            {m.primaryPosition || 'Zone Member'}
                          </span>
                        </td>
                        <td className="font-mono text-xs text-surface-600">{m.mobile}</td>
                        <td className="text-center font-black text-amber-700">
                          {m.totalPoints} pts
                        </td>
                        <td className="text-right font-bold text-xs">
                          <span
                            className={clsx(
                              'px-2.5 py-1 rounded-md text-xs font-bold',
                              m.attendanceRate === 100
                                ? 'bg-emerald-100 text-emerald-800'
                                : m.attendanceRate > 0
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-surface-100 text-surface-400'
                            )}
                          >
                            {m.attendanceRate}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
