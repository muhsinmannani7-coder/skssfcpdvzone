import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase, type Program } from '@/lib/supabase'
import {
  Shield, Users, Award, MapPin, Calendar, Clock,
  RefreshCw, AlertCircle, CheckCircle2, Lock,
  Star, Layers, Trophy
} from 'lucide-react'
import { format } from 'date-fns'

interface AttendeeRecord {
  attendanceId: string
  memberId: string
  fullName: string
  mobile: string
  membershipNumber: string | null
  markedAt: string
  zonePositions: string[]
  clusterPositions: { title: string; clusterName: string }[]
  unitPositions: { title: string; unitName: string; clusterName: string }[]
}

interface ZonePointsSummary {
  zonePresent: number
  clusterWise: {
    clusterId: string
    clusterName: string
    presentCount: number
    totalOfficers: number
  }[]
}

export default function PublicAttendanceBoard() {
  const { id: programId } = useParams<{ id: string }>()

  // Fetch program info
  const { data: program, isLoading: programLoading } = useQuery({
    queryKey: ['board-program', programId],
    queryFn: async () => {
      if (!programId) return null
      const { data, error } = await supabase
        .from('programs')
        .select('*')
        .eq('id', programId)
        .single()
      if (error) throw error
      return data as Program
    },
    enabled: !!programId,
    refetchInterval: 15000,
  })

  // Fetch all attendance for this program with member + positions
  const { data: attendees = [], isLoading: attendeesLoading } = useQuery({
    queryKey: ['board-attendees', programId],
    queryFn: async () => {
      if (!programId) return []

      const { data, error } = await supabase
        .from('attendance')
        .select(`
          id,
          marked_at,
          members (
            id,
            full_name,
            mobile,
            membership_number,
            member_positions (
              positions ( title ),
              committees ( name, level ),
              clusters ( name ),
              units ( name, clusters ( name ) )
            )
          )
        `)
        .eq('program_id', programId)
        .order('marked_at', { ascending: false })

      if (error) throw error
      if (!data) return []

      // Map to structured attendee records
      interface RawMP {
        positions?: { title: string } | null
        committees?: { name: string; level: 'zone' | 'cluster' | 'unit' } | null
        clusters?: { name: string } | null
        units?: { name: string; clusters?: { name: string } | null } | null
      }

      return data.map(row => {
        const m = (row.members as unknown) as {
          id: string
          full_name: string
          mobile: string
          membership_number: string | null
          member_positions: RawMP[]
        } | null

        if (!m) return null

        const rawPositions = (m.member_positions as unknown as RawMP[]) || []
        const zonePositions: string[] = []
        const clusterPositions: { title: string; clusterName: string }[] = []
        const unitPositions: { title: string; unitName: string; clusterName: string }[] = []

        rawPositions.forEach(mp => {
          const level = mp.committees?.level
          if (level === 'zone') {
            zonePositions.push(mp.positions?.title ?? 'Member')
          } else if (level === 'cluster') {
            clusterPositions.push({
              title: mp.positions?.title ?? 'Member',
              clusterName: mp.clusters?.name ?? '',
            })
          } else if (level === 'unit') {
            unitPositions.push({
              title: mp.positions?.title ?? 'Member',
              unitName: mp.units?.name ?? '',
              clusterName: mp.units?.clusters?.name ?? mp.clusters?.name ?? '',
            })
          }
        })

        return {
          attendanceId: row.id,
          memberId: m.id,
          fullName: m.full_name,
          mobile: m.mobile,
          membershipNumber: m.membership_number,
          markedAt: row.marked_at,
          zonePositions,
          clusterPositions,
          unitPositions,
        } as AttendeeRecord
      }).filter(Boolean) as AttendeeRecord[]
    },
    enabled: !!programId,
    refetchInterval: 5000,
  })

  // Zone-level points summary
  const { data: pointsSummary } = useQuery({
    queryKey: ['board-points-summary', programId],
    queryFn: async (): Promise<ZonePointsSummary> => {
      if (!programId) return { zonePresent: 0, clusterWise: [] }

      // Get present member IDs
      const { data: attData } = await supabase
        .from('attendance')
        .select('member_id')
        .eq('program_id', programId)
      const presentIds = new Set((attData || []).map(r => r.member_id))

      // Get all clusters with their counts
      const { data: clusters } = await supabase
        .from('clusters')
        .select('id, name')
        .eq('is_active', true)

      // Count zone officials present (zone committee level members)
      const { data: zoneMembers } = await supabase
        .from('member_positions')
        .select('member_id, committees(level)')
        .eq('is_active', true)
      const zonePresentCount = (zoneMembers || [])
        .filter(mp => {
          const c = (mp.committees as unknown) as { level: string } | null
          return c?.level === 'zone' && presentIds.has(mp.member_id)
        }).length

      // Cluster-wise breakdown - count officers present per cluster
      const clusterWise = await Promise.all(
        (clusters || []).map(async cluster => {
          const { data: clusterOfficers } = await supabase
            .from('member_positions')
            .select('member_id')
            .eq('cluster_id', cluster.id)
            .eq('is_active', true)

          const total = clusterOfficers?.length ?? 0
          const presentCount = (clusterOfficers || [])
            .filter(co => presentIds.has(co.member_id)).length

          return {
            clusterId: cluster.id,
            clusterName: cluster.name,
            presentCount,
            totalOfficers: total,
          }
        })
      )

      return {
        zonePresent: zonePresentCount,
        clusterWise: clusterWise.filter(c => c.totalOfficers > 0),
      }
    },
    enabled: !!programId,
    refetchInterval: 10000,
  })

  if (programLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="text-center text-white">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-medium text-slate-300">Loading attendance board...</p>
        </div>
      </div>
    )
  }

  if (!program) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 max-w-md w-full text-center text-white space-y-4">
          <AlertCircle className="w-12 h-12 text-amber-400 mx-auto" />
          <h2 className="text-xl font-bold">Meeting Not Found</h2>
          <p className="text-slate-400 text-sm">This meeting link is invalid or the meeting has been removed.</p>
          <Link to="/admin/login" className="inline-flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 underline">
            <Lock className="w-4 h-4" /> Admin Panel
          </Link>
        </div>
      </div>
    )
  }

  const totalAttendees = attendees.length
  const hasZoneOfficers = attendees.some(a => a.zonePositions.length > 0)

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-emerald-950 text-white">
      {/* Ambient background glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 right-10 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-3xl mx-auto px-4 py-6 space-y-5">
        {/* Header */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 shadow-lg shadow-emerald-500/20 mb-2 border border-emerald-400/30">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">SKSSF</h1>
          <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
            Chapparappadavu Zone Committee
          </p>
        </div>

        {/* Meeting Info Card */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl p-5 shadow-2xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {program.status === 'active' ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  🔴 LIVE
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-500/20 text-slate-300 border border-slate-500/30">
                  🔒 CLOSED
                </span>
              )}
            </div>
            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-300 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              <Users className="w-3.5 h-3.5" />
              {totalAttendees} ഹാജരായി
            </span>
          </div>

          <h2 className="text-xl font-black text-white leading-snug">{program.name}</h2>

          <div className="grid grid-cols-2 gap-2 mt-3 text-xs text-slate-300 border-t border-white/10 pt-3">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span>{format(new Date(program.program_date), 'dd MMM yyyy')}</span>
            </div>
            <div className="flex items-center gap-1.5 truncate">
              <MapPin className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span className="truncate">{program.venue}</span>
            </div>
            {program.start_time && (
              <div className="flex items-center gap-1.5 col-span-2">
                <Clock className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>സമയം: {program.start_time}</span>
              </div>
            )}
          </div>
        </div>

        {/* Points Summary Card */}
        {pointsSummary && (
          <div className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <h3 className="font-black text-base text-white">Points Summary</h3>
            </div>

            {/* Zone level */}
            <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-bold text-amber-200">Zone Committee</span>
              </div>
              <span className="text-sm font-black text-amber-300">
                {pointsSummary.zonePresent} Officer{pointsSummary.zonePresent !== 1 ? 's' : ''} Present
              </span>
            </div>

            {/* Cluster-wise breakdown */}
            {pointsSummary.clusterWise.length > 0 && (
              <div className="space-y-2">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5" /> Cluster-wise Attendance
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {pointsSummary.clusterWise.map(c => (
                    <div key={c.clusterId} className="bg-purple-500/10 border border-purple-500/20 rounded-xl px-3 py-2.5 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Star className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                        <span className="text-xs font-semibold text-purple-200 truncate">{c.clusterName}</span>
                      </div>
                      <span className="text-xs font-black text-purple-300 whitespace-nowrap">
                        {c.presentCount}/{c.totalOfficers}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Zone Officers Present (Highlighted) */}
        {hasZoneOfficers && (
          <div className="bg-amber-500/10 backdrop-blur-xl border border-amber-500/20 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              <h3 className="font-black text-sm text-amber-200 uppercase tracking-wider">
                Zone Officials Present
              </h3>
            </div>
            <div className="space-y-2">
              {attendees
                .filter(a => a.zonePositions.length > 0)
                .map(a => (
                  <div key={a.attendanceId} className="flex items-center justify-between gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2.5">
                    <div>
                      <p className="font-bold text-white text-sm">{a.fullName}</p>
                      <p className="text-[11px] text-amber-300">{a.zonePositions.join(' • ')}</p>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  </div>
                ))
              }
            </div>
          </div>
        )}

        {/* Full Attendance List */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl overflow-hidden shadow-2xl">
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-400" />
              <h3 className="font-black text-base text-white">
                ഹാജർ പട്ടിക ({totalAttendees})
              </h3>
            </div>
            {program.status === 'active' && (
              <span className="flex items-center gap-1.5 text-[11px] text-emerald-300 font-semibold">
                <RefreshCw className="w-3 h-3 animate-spin" />
                Live updating
              </span>
            )}
          </div>

          {attendeesLoading ? (
            <div className="flex items-center justify-center py-12 gap-2 text-emerald-300">
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span className="text-sm font-medium">Loading...</span>
            </div>
          ) : attendees.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Users className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-slate-400 font-medium text-sm">
                ഇതുവരെ ആരും ഹാജർ രേഖപ്പെടുത്തിയിട്ടില്ല
              </p>
              <p className="text-xs text-slate-500">
                (കമ്മിറ്റി ഡെസ്കിൽ ഹാജർ രേഖപ്പെടുത്തുമ്പോൾ ഇവിടെ തത്സമയം കാണാം)
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {attendees.map((attendee, index) => (
                <div
                  key={attendee.attendanceId}
                  className="px-4 py-3.5 flex items-start gap-3 hover:bg-white/5 transition"
                >
                  {/* Index number */}
                  <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-[11px] font-black text-emerald-300 flex-shrink-0 mt-0.5">
                    {totalAttendees - index}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-bold text-white text-sm leading-tight truncate">
                          {attendee.fullName}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 mt-0.5 font-mono">
                          <span>📱 {attendee.mobile}</span>
                          {attendee.membershipNumber && (
                            <span>🆔 {attendee.membershipNumber}</span>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-500 whitespace-nowrap flex-shrink-0 mt-1">
                        {format(new Date(attendee.markedAt), 'hh:mm a')}
                      </span>
                    </div>

                    {/* Positions */}
                    {(attendee.zonePositions.length > 0 || attendee.clusterPositions.length > 0 || attendee.unitPositions.length > 0) && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {attendee.zonePositions.map((title, i) => (
                          <span
                            key={`z-${i}`}
                            className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold"
                          >
                            <Award className="w-2.5 h-2.5" />
                            {title} · Zone
                          </span>
                        ))}
                        {attendee.clusterPositions.map((pos, i) => (
                          <span
                            key={`c-${i}`}
                            className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold"
                          >
                            <Star className="w-2.5 h-2.5" />
                            {pos.title} · {pos.clusterName}
                          </span>
                        ))}
                        {attendee.unitPositions.map((pos, i) => (
                          <span
                            key={`u-${i}`}
                            className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 font-semibold"
                          >
                            <Layers className="w-2.5 h-2.5" />
                            {pos.title} · {pos.unitName}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center pb-4 space-y-1">
          <p className="text-xs text-slate-500">
            SKSSF Chapparappadavu Zone — Attendance Board
          </p>
          <Link to="/admin/login" className="text-xs text-slate-600 hover:text-slate-400 underline transition">
            Admin Login →
          </Link>
        </div>
      </div>
    </div>
  )
}
