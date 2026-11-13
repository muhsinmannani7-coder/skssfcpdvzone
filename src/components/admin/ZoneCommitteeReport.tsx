import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import {
  Shield, Download, FileText,
  CheckCircle2, XCircle, Users, Award, TrendingUp, Calendar,
} from 'lucide-react'
import { clsx } from 'clsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

// ─── Types ────────────────────────────────────────────────────────────────────

interface RawProgram {
  id: string
  name: string
  program_date: string
  venue: string
  status: string
}

interface RawZoneMemberPosition {
  member_id: string
  members: { id: string; full_name: string; mobile: string } | null
  positions: { id: string; title: string } | null
}

interface RawAttendance {
  program_id: string
  member_id: string
}

interface ZoneMemberRow {
  rank: number
  memberId: string
  memberName: string
  mobile: string
  position: string
  attendance: Record<string, boolean> // program_id → attended
  totalPoints: number
  attendancePercent: number
}

// ─── PDF Export ──────────────────────────────────────────────────────────────

function exportZoneReportToPdf(
  programs: RawProgram[],
  members: ZoneMemberRow[],
  mode: 'all' | string // 'all' or specific program_id
) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  const teal: [number, number, number] = [15, 118, 110]
  const white: [number, number, number] = [255, 255, 255]
  const dark: [number, number, number] = [30, 41, 59]
  const gray: [number, number, number] = [148, 163, 184]

  const filteredPrograms = mode === 'all' ? programs : programs.filter(p => p.id === mode)
  const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

  filteredPrograms.forEach((program, pIdx) => {
    if (pIdx > 0) doc.addPage()

    // Header
    doc.setFillColor(...teal)
    doc.rect(0, 0, 297, 24, 'F')
    doc.setTextColor(...white)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('SKSSF CHAPPARAPPADAVU ZONE', 148.5, 10, { align: 'center' })
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text('ZONE COMMITTEE — OFFICIAL ATTENDANCE REPORT', 148.5, 17, { align: 'center' })

    // Meeting info
    doc.setTextColor(...dark)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text(`Meeting: ${program.name}`, 14, 32)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...gray)
    doc.text(
      `Date: ${new Date(program.program_date).toLocaleDateString('en-IN')}  |  Venue: ${program.venue}  |  Generated: ${dateStr}`,
      14, 37
    )

    // Attendance table for this meeting
    const attended = members.filter(m => m.attendance[program.id])
    const absent = members.filter(m => !m.attendance[program.id])

    // KPI badges
    const drawKpi = (x: number, y: number, label: string, val: string | number, bg: [number, number, number], fg: [number, number, number]) => {
      doc.setFillColor(...bg)
      doc.roundedRect(x, y, 36, 11, 2, 2, 'F')
      doc.setFontSize(6)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...fg)
      doc.text(label.toUpperCase(), x + 18, y + 4, { align: 'center' })
      doc.setFontSize(9)
      doc.text(val.toString(), x + 18, y + 9.5, { align: 'center' })
    }

    drawKpi(130, 27, 'Total Members', members.length, [239, 246, 255], [29, 78, 216])
    drawKpi(169, 27, 'Present', attended.length, [236, 253, 245], [4, 120, 87])
    drawKpi(208, 27, 'Absent', absent.length, [254, 242, 242], [185, 28, 28])
    drawKpi(247, 27, 'Attendance %', `${members.length ? Math.round((attended.length / members.length) * 100) : 0}%`, [240, 253, 250], [15, 118, 110])

    // Attended members table
    doc.setTextColor(4, 120, 87)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text(`PRESENT MEMBERS (${attended.length})`, 14, 44)

    autoTable(doc, {
      startY: 47,
      head: [['#', 'Member Name', 'Mobile', 'Position', 'Status']],
      body: attended.map((m, i) => [
        (i + 1).toString(),
        m.memberName,
        m.mobile || '—',
        m.position,
        'PRESENT ✓',
      ]),
      theme: 'grid',
      headStyles: { fillColor: [4, 120, 87], textColor: white, fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 8, cellPadding: 2 },
      alternateRowStyles: { fillColor: [236, 253, 245] },
      columnStyles: {
        0: { cellWidth: 12, halign: 'center' },
        1: { cellWidth: 65 },
        2: { cellWidth: 35 },
        3: { cellWidth: 70 },
        4: { cellWidth: 25, halign: 'center', fontStyle: 'bold' },
      },
      didDrawPage: (data) => {
        doc.setFontSize(7)
        doc.setTextColor(...gray)
        doc.text(`Page ${data.pageNumber}`, 283, 202, { align: 'right' })
        doc.text('SKSSF Chapparappadavu Zone — Zone Committee Official Record', 14, 202)
      },
    })

    if (absent.length > 0) {
      const lastY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 100
      const startY2 = lastY + 8

      doc.setTextColor(185, 28, 28)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.text(`ABSENT MEMBERS (${absent.length})`, 14, startY2)

      autoTable(doc, {
        startY: startY2 + 3,
        head: [['#', 'Member Name', 'Mobile', 'Position', 'Status']],
        body: absent.map((m, i) => [
          (i + 1).toString(),
          m.memberName,
          m.mobile || '—',
          m.position,
          'ABSENT ✗',
        ]),
        theme: 'grid',
        headStyles: { fillColor: [185, 28, 28], textColor: white, fontStyle: 'bold', fontSize: 8 },
        bodyStyles: { fontSize: 8, cellPadding: 2 },
        alternateRowStyles: { fillColor: [254, 242, 242] },
        columnStyles: {
          0: { cellWidth: 12, halign: 'center' },
          1: { cellWidth: 65 },
          2: { cellWidth: 35 },
          3: { cellWidth: 70 },
          4: { cellWidth: 25, halign: 'center', fontStyle: 'bold' },
        },
        didDrawPage: (data) => {
          doc.setFontSize(7)
          doc.setTextColor(...gray)
          doc.text(`Page ${data.pageNumber}`, 283, 202, { align: 'right' })
          doc.text('SKSSF Chapparappadavu Zone — Zone Committee Official Record', 14, 202)
        },
      })
    }
  })

  // If 'all' mode: add a final cumulative summary page
  if (mode === 'all' && members.length > 0) {
    doc.addPage()

    // Header
    doc.setFillColor(...teal)
    doc.rect(0, 0, 297, 24, 'F')
    doc.setTextColor(...white)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('SKSSF CHAPPARAPPADAVU ZONE', 148.5, 10, { align: 'center' })
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text('ZONE COMMITTEE — CUMULATIVE POINTS SUMMARY', 148.5, 17, { align: 'center' })

    doc.setTextColor(...dark)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text(`All Meetings (${programs.length} Total)  |  Generated: ${dateStr}`, 14, 30)

    const meetingCols = programs.map(p =>
      p.name.length > 18 ? p.name.slice(0, 16) + '..' : p.name
    )

    const headRow = ['Rank', 'Member Name', 'Position', ...meetingCols, 'Total', 'Rate']
    const bodyRows = members.map(m => {
      const rankLabel = m.rank === 1 ? '🥇 1st' : m.rank === 2 ? '🥈 2nd' : m.rank === 3 ? '🥉 3rd' : `#${m.rank}`
      const cells = programs.map(p => m.attendance[p.id] ? '✓' : '✗')
      return [rankLabel, m.memberName, m.position, ...cells, m.totalPoints.toString(), `${m.attendancePercent}%`]
    })

    autoTable(doc, {
      startY: 35,
      head: [headRow],
      body: bodyRows,
      theme: 'grid',
      headStyles: { fillColor: teal, textColor: white, fontStyle: 'bold', fontSize: 7, halign: 'center' },
      bodyStyles: { fontSize: 7.5, cellPadding: 2 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
        1: { cellWidth: 55 },
        2: { cellWidth: 50 },
        [3 + programs.length]: { cellWidth: 16, halign: 'center', fontStyle: 'bold' },
        [4 + programs.length]: { cellWidth: 16, halign: 'center', fontStyle: 'bold' },
      },
      didParseCell: (data) => {
        if (data.section === 'body') {
          const r = members[data.row.index]
          if (r) {
            if (r.rank === 1) data.cell.styles.fillColor = [254, 252, 232]
            else if (r.rank === 2) data.cell.styles.fillColor = [248, 250, 252]
            else if (r.rank === 3) data.cell.styles.fillColor = [255, 247, 237]
          }
        }
      },
      didDrawPage: (data) => {
        doc.setFontSize(7)
        doc.setTextColor(...gray)
        doc.text(`Page ${data.pageNumber}`, 283, 202, { align: 'right' })
        doc.text('SKSSF Chapparappadavu Zone — Zone Committee Official Record', 14, 202)
      },
    })
  }

  const fileDate = new Date().toISOString().split('T')[0]
  const label = mode === 'all' ? 'All_Meetings' : programs.find(p => p.id === mode)?.name.replace(/[^a-zA-Z0-9_-]/g, '_') ?? mode
  doc.save(`SKSSF_Zone_Committee_${label}_${fileDate}.pdf`)
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ZoneCommitteeReport() {
  const [includedStatus, setIncludedStatus] = useState<'completed' | 'all'>('completed')
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null)
  const [selectedMeetingId, setSelectedMeetingId] = useState<string>('all')
  const [pdfMode, setPdfMode] = useState<'all' | 'single'>('all')

  // ── Fetch programs ─────────────────────────────────────────────────────────
  const { data: programs = [], isLoading: programsLoading } = useQuery<RawProgram[]>({
    queryKey: ['zone-report-programs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('programs')
        .select('id, name, program_date, venue, status')
        .order('program_date', { ascending: true })
      if (error) throw error
      return data as RawProgram[]
    },
  })

  // ── Fetch zone committee members ───────────────────────────────────────────
  const { data: rawMemberPositions = [], isLoading: membersLoading } = useQuery<RawZoneMemberPosition[]>({
    queryKey: ['zone-report-members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('member_positions')
        .select(`
          member_id,
          members ( id, full_name, mobile ),
          positions ( id, title ),
          committees!inner ( id, level )
        `)
        .eq('committees.level', 'zone')
        .eq('is_active', true)
      if (error) throw error
      return data as unknown as RawZoneMemberPosition[]
    },
  })

  // ── Fetch attendance ───────────────────────────────────────────────────────
  const { data: attendance = [], isLoading: attendanceLoading } = useQuery<RawAttendance[]>({
    queryKey: ['zone-report-attendance'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attendance')
        .select('program_id, member_id')
      if (error) throw error
      return data as RawAttendance[]
    },
  })

  const isLoading = programsLoading || membersLoading || attendanceLoading

  // ── Filtered programs ──────────────────────────────────────────────────────
  const filteredPrograms = useMemo(() => {
    return programs.filter(p =>
      includedStatus === 'all' ? true : p.status === 'closed'
    )
  }, [programs, includedStatus])

  // ── Build attendance map: member_id → Set<program_id> ─────────────────────
  const attendanceMap = useMemo(() => {
    const map = new Map<string, Set<string>>()
    attendance.forEach(a => {
      if (!map.has(a.member_id)) map.set(a.member_id, new Set())
      map.get(a.member_id)!.add(a.program_id)
    })
    return map
  }, [attendance])

  // ── De-duplicate members: one row per member (multiple positions merged) ──
  const uniqueMembers = useMemo(() => {
    const map = new Map<string, { memberId: string; memberName: string; mobile: string; positions: string[] }>()
    rawMemberPositions.forEach(mp => {
      if (!mp.members) return
      const id = mp.member_id
      if (!map.has(id)) {
        map.set(id, {
          memberId: id,
          memberName: mp.members.full_name,
          mobile: mp.members.mobile,
          positions: [],
        })
      }
      if (mp.positions?.title) {
        map.get(id)!.positions.push(mp.positions.title)
      }
    })
    return Array.from(map.values())
  }, [rawMemberPositions])

  // ── Build member rows ──────────────────────────────────────────────────────
  const memberRows = useMemo((): ZoneMemberRow[] => {
    const programIds = new Set(filteredPrograms.map(p => p.id))
    const rows = uniqueMembers.map(m => {
      const attended = attendanceMap.get(m.memberId) ?? new Set<string>()
      const attendanceRecord: Record<string, boolean> = {}
      let totalPoints = 0
      filteredPrograms.forEach(p => {
        const present = attended.has(p.id)
        attendanceRecord[p.id] = present
        if (present) totalPoints++
      })
      const pct = programIds.size > 0 ? Math.round((totalPoints / programIds.size) * 100) : 0
      return {
        rank: 0,
        memberId: m.memberId,
        memberName: m.memberName,
        mobile: m.mobile,
        position: m.positions.join(', '),
        attendance: attendanceRecord,
        totalPoints,
        attendancePercent: pct,
      }
    })

    // Dense ranking
    rows.sort((a, b) => b.totalPoints - a.totalPoints)
    let currentRank = 1
    for (let i = 0; i < rows.length; i++) {
      if (i === 0) {
        rows[i].rank = 1
      } else if (rows[i].totalPoints === rows[i - 1].totalPoints) {
        rows[i].rank = rows[i - 1].rank
      } else {
        currentRank = i + 1
        rows[i].rank = currentRank
      }
    }
    return rows
  }, [uniqueMembers, filteredPrograms, attendanceMap])

  // ── Per-meeting summary ────────────────────────────────────────────────────
  const meetingSummary = useMemo(() => {
    return filteredPrograms.map(p => {
      const present = memberRows.filter(m => m.attendance[p.id])
      const absent = memberRows.filter(m => !m.attendance[p.id])
      return { program: p, present, absent }
    })
  }, [filteredPrograms, memberRows])

  // ── Stats ──────────────────────────────────────────────────────────────────
  const totalPointsGiven = memberRows.reduce((s, m) => s + m.totalPoints, 0)
  const fullAttendance = memberRows.filter(m => m.attendancePercent === 100).length
  const zeroAttendance = memberRows.filter(m => m.totalPoints === 0).length

  // ── Excel export ───────────────────────────────────────────────────────────
  function handleExportExcel() {
    const header = ['Rank', 'Member Name', 'Mobile', 'Position', ...filteredPrograms.map(p => p.name), 'Total Points', 'Attendance %']
    const rows = memberRows.map(m => [
      m.rank,
      m.memberName,
      m.mobile,
      m.position,
      ...filteredPrograms.map(p => m.attendance[p.id] ? 'Present' : 'Absent'),
      m.totalPoints,
      `${m.attendancePercent}%`,
    ])
    const ws = XLSX.utils.aoa_to_sheet([header, ...rows])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Zone Committee Report')
    XLSX.writeFile(wb, `SKSSF_Zone_Committee_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  // ── PDF export ─────────────────────────────────────────────────────────────
  function handleExportPdf() {
    if (pdfMode === 'all') {
      exportZoneReportToPdf(filteredPrograms, memberRows, 'all')
    } else {
      if (!selectedMeetingId || selectedMeetingId === 'all') {
        alert('Please select a specific meeting for single PDF export.')
        return
      }
      exportZoneReportToPdf(filteredPrograms, memberRows, selectedMeetingId)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center shadow-md">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-surface-900">
                മേഖലാ കമ്മിറ്റി റിപ്പോർട്ട് | Zone Committee Report
              </h1>
              <p className="text-sm text-surface-500 mt-0.5">
                Zone-level attendance, points & performance — independent of branch/unit scores
              </p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-2 items-center">
          {/* Status filter */}
          <div className="flex rounded-xl overflow-hidden border border-surface-200 text-xs font-semibold">
            <button
              onClick={() => setIncludedStatus('completed')}
              className={clsx('px-3 py-2 transition', includedStatus === 'completed' ? 'bg-primary-600 text-white' : 'bg-white text-surface-600 hover:bg-surface-50')}
            >
              Completed
            </button>
            <button
              onClick={() => setIncludedStatus('all')}
              className={clsx('px-3 py-2 transition', includedStatus === 'all' ? 'bg-primary-600 text-white' : 'bg-white text-surface-600 hover:bg-surface-50')}
            >
              All Meetings
            </button>
          </div>

          {/* Export Excel */}
          <button
            onClick={handleExportExcel}
            className="btn btn-secondary text-xs flex items-center gap-1.5 px-3 py-2"
          >
            <Download className="w-3.5 h-3.5" /> Excel
          </button>

          {/* PDF Mode + Export */}
          <div className="flex items-center gap-1 border border-surface-200 rounded-xl overflow-hidden">
            <select
              value={pdfMode}
              onChange={e => setPdfMode(e.target.value as 'all' | 'single')}
              className="text-xs px-2 py-2 border-none outline-none bg-white text-surface-700"
            >
              <option value="all">All Meetings PDF</option>
              <option value="single">Single Meeting PDF</option>
            </select>
            {pdfMode === 'single' && (
              <select
                value={selectedMeetingId}
                onChange={e => setSelectedMeetingId(e.target.value)}
                className="text-xs px-2 py-2 border-l border-surface-200 outline-none bg-white text-surface-700"
              >
                <option value="all">Select Meeting…</option>
                {filteredPrograms.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            )}
            <button
              onClick={handleExportPdf}
              className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3 py-2 flex items-center gap-1 transition"
            >
              <FileText className="w-3.5 h-3.5" /> PDF
            </button>
          </div>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Zone Members', value: uniqueMembers.length, icon: Users, color: 'blue' },
          { label: 'Total Meetings', value: filteredPrograms.length, icon: Calendar, color: 'indigo' },
          { label: 'Points Given', value: totalPointsGiven, icon: Award, color: 'green' },
          { label: 'Full Attendance', value: `${fullAttendance} Members`, icon: TrendingUp, color: 'teal' },
          { label: 'Zero Attendance', value: `${zeroAttendance} Members`, icon: XCircle, color: 'red' },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-2xl p-4 border border-surface-200 shadow-sm">
            <p className="text-xs text-surface-500 font-medium">{card.label}</p>
            <p className="text-2xl font-bold text-surface-900 mt-1">{card.value}</p>
          </div>
        ))}
      </div>

      {/* ── Member Points Table ── */}
      <div className="bg-white rounded-2xl border border-surface-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-surface-100 flex items-center gap-2">
          <Award className="w-4 h-4 text-indigo-600" />
          <span className="font-semibold text-surface-800 text-sm">
            Member-wise Points ({uniqueMembers.length} Zone Members × {filteredPrograms.length} Meetings)
          </span>
          <span className="text-xs text-surface-400 ml-1">— Click a row to see meeting-wise details</span>
        </div>

        {memberRows.length === 0 ? (
          <div className="p-12 text-center text-surface-400">
            <Shield className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No zone committee members found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-50 border-b border-surface-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider w-16">Rank</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">Member Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider hidden md:table-cell">Position</th>
                  {filteredPrograms.map(p => (
                    <th key={p.id} className="px-2 py-3 text-center text-xs font-semibold text-surface-500 uppercase tracking-wider min-w-[80px]">
                      <div className="truncate max-w-[80px]" title={p.name}>{p.name.slice(0, 10)}{p.name.length > 10 ? '..' : ''}</div>
                      <div className="text-surface-400 font-normal">{new Date(p.program_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</div>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-center text-xs font-semibold text-surface-500 uppercase tracking-wider">Total</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-surface-500 uppercase tracking-wider">Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {memberRows.map(m => (
                  <>
                    <tr
                      key={m.memberId}
                      onClick={() => setExpandedMemberId(expandedMemberId === m.memberId ? null : m.memberId)}
                      className={clsx(
                        'cursor-pointer hover:bg-surface-50 transition',
                        m.rank === 1 && m.totalPoints > 0 && 'bg-yellow-50',
                        m.rank === 2 && m.totalPoints > 0 && 'bg-gray-50',
                        m.rank === 3 && m.totalPoints > 0 && 'bg-orange-50',
                      )}
                    >
                      <td className="px-4 py-3">
                        <span className={clsx(
                          'inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold',
                          m.rank === 1 && m.totalPoints > 0 ? 'bg-yellow-400 text-yellow-900' :
                          m.rank === 2 && m.totalPoints > 0 ? 'bg-gray-300 text-gray-700' :
                          m.rank === 3 && m.totalPoints > 0 ? 'bg-orange-300 text-orange-900' :
                          'bg-surface-100 text-surface-600'
                        )}>
                          {m.rank}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-surface-800">{m.memberName}</div>
                        <div className="text-xs text-surface-400 md:hidden">{m.position}</div>
                        <div className="text-xs text-surface-400">{m.mobile}</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-surface-500 hidden md:table-cell">{m.position}</td>
                      {filteredPrograms.map(p => (
                        <td key={p.id} className="px-2 py-3 text-center">
                          {m.attendance[p.id] ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-400 mx-auto" />
                          )}
                        </td>
                      ))}
                      <td className="px-4 py-3 text-center">
                        <span className="font-bold text-surface-900">{m.totalPoints}</span>
                        <span className="text-surface-400 text-xs">/{filteredPrograms.length}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={clsx(
                          'inline-block px-2 py-0.5 rounded-full text-xs font-bold',
                          m.attendancePercent === 100 ? 'bg-emerald-100 text-emerald-700' :
                          m.attendancePercent >= 75 ? 'bg-blue-100 text-blue-700' :
                          m.attendancePercent >= 50 ? 'bg-yellow-100 text-yellow-700' :
                          m.attendancePercent > 0 ? 'bg-orange-100 text-orange-700' :
                          'bg-red-100 text-red-700'
                        )}>
                          {m.attendancePercent}%
                        </span>
                      </td>
                    </tr>
                    {expandedMemberId === m.memberId && (
                      <tr key={`${m.memberId}-expanded`}>
                        <td colSpan={5 + filteredPrograms.length} className="px-6 py-3 bg-indigo-50 border-b border-indigo-100">
                          <div className="flex flex-wrap gap-2">
                            {filteredPrograms.map(p => (
                              <div key={p.id} className={clsx(
                                'flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium',
                                m.attendance[p.id] ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
                              )}>
                                {m.attendance[p.id] ? '✓' : '✗'} {p.name}
                                <span className="opacity-60">({new Date(p.program_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })})</span>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Per-Meeting Summary ── */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-surface-800 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-indigo-600" />
          Meeting-wise Attendance Summary
        </h2>
        {meetingSummary.length === 0 ? (
          <p className="text-surface-400 text-sm">No meetings to display.</p>
        ) : (
          meetingSummary.map(({ program, present, absent }) => (
            <div key={program.id} className="bg-white rounded-2xl border border-surface-200 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-surface-100">
                <div>
                  <p className="font-semibold text-surface-800">{program.name}</p>
                  <p className="text-xs text-surface-400 mt-0.5">
                    {new Date(program.program_date).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'long', year: 'numeric' })}
                    {program.venue && ` · ${program.venue}`}
                  </p>
                </div>
                <div className="flex gap-3 text-sm">
                  <span className="bg-emerald-100 text-emerald-700 font-bold px-3 py-1 rounded-full text-xs">
                    {present.length} Present
                  </span>
                  <span className="bg-red-100 text-red-600 font-bold px-3 py-1 rounded-full text-xs">
                    {absent.length} Absent
                  </span>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-surface-100">
                {/* Present */}
                <div className="p-4">
                  <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-2">
                    ✓ Present ({present.length})
                  </p>
                  {present.length === 0 ? (
                    <p className="text-xs text-surface-400">No one attended</p>
                  ) : (
                    <div className="space-y-1">
                      {present.map(m => (
                        <div key={m.memberId} className="flex items-center gap-2 text-xs">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                          <span className="font-medium text-surface-700">{m.memberName}</span>
                          <span className="text-surface-400">{m.position}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Absent */}
                <div className="p-4">
                  <p className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-2">
                    ✗ Absent ({absent.length})
                  </p>
                  {absent.length === 0 ? (
                    <p className="text-xs text-emerald-600 font-medium">Full attendance! 🎉</p>
                  ) : (
                    <div className="space-y-1">
                      {absent.map(m => (
                        <div key={m.memberId} className="flex items-center gap-2 text-xs">
                          <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                          <span className="font-medium text-surface-700">{m.memberName}</span>
                          <span className="text-surface-400">{m.position}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

