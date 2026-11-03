import * as XLSX from 'xlsx'

export interface AttendanceExportRecord {
  slNo: number
  memberName: string
  mobile: string
  membershipNumber: string
  committee: string
  position: string
  markedAt: string
  operatorName: string
}

export function exportAttendanceToExcel(
  programName: string,
  programDate: string,
  records: AttendanceExportRecord[]
) {
  const wb = XLSX.utils.book_new()

  // Sheet 1: Detailed Attendance
  const rows = records.map(r => ({
    'Sl. No': r.slNo,
    'Member Name': r.memberName,
    'Mobile Number': r.mobile,
    'Membership ID': r.membershipNumber || 'N/A',
    'Committee': r.committee,
    'Position': r.position,
    'Check-in Time': r.markedAt,
    'Marked By': r.operatorName,
  }))

  const ws = XLSX.utils.json_to_sheet(rows)

  // Configure column widths
  ws['!cols'] = [
    { wch: 8 },
    { wch: 25 },
    { wch: 15 },
    { wch: 15 },
    { wch: 25 },
    { wch: 25 },
    { wch: 20 },
    { wch: 20 },
  ]

  XLSX.utils.book_append_sheet(wb, ws, 'Attendance List')

  // Generate filename
  const sanitizedTitle = programName.replace(/[^a-zA-Z0-9_-]/g, '_')
  const filename = `SKSSF_${sanitizedTitle}_${programDate}.xlsx`

  XLSX.writeFile(wb, filename)
}

export interface CommitteePointsExportRecord {
  rank: number
  committeeName: string
  level: string
  clusterName?: string
  totalPositions: number
  presentCount: number
  points: number
  percentage: string
}

export function exportCommitteePointsToExcel(
  programName: string,
  records: CommitteePointsExportRecord[]
) {
  const wb = XLSX.utils.book_new()

  const rows = records.map(r => ({
    'Rank': r.rank,
    'Committee': r.committeeName,
    'Level': r.level.toUpperCase(),
    'Cluster': r.clusterName || '—',
    'Total Seats': r.totalPositions,
    'Attended': r.presentCount,
    'Points Earned': r.points,
    'Attendance %': r.percentage,
  }))

  const ws = XLSX.utils.json_to_sheet(rows)
  ws['!cols'] = [
    { wch: 8 },
    { wch: 28 },
    { wch: 14 },
    { wch: 20 },
    { wch: 14 },
    { wch: 12 },
    { wch: 14 },
    { wch: 14 },
  ]

  XLSX.utils.book_append_sheet(wb, ws, 'Committee Points')

  const sanitizedTitle = programName.replace(/[^a-zA-Z0-9_-]/g, '_')
  XLSX.writeFile(wb, `SKSSF_Points_${sanitizedTitle}.xlsx`)
}

// ─── Unit Points Report Export ────────────────────────────────────────────────

export interface UnitReportExportData {
  unitName: string
  clusterName: string
  meetings: Array<{ name: string; date: string; pointsEarned: number; maxPoints: number }>
  totalPoints: number
  maxTotalPoints: number
  attendancePercent: number
  absentMembersPerMeeting: Array<{ meetingName: string; absentMembers: string[] }>
}

export function exportUnitReportToExcel(records: UnitReportExportData[]): void {
  const wb = XLSX.utils.book_new()

  // ── Sheet 1: Summary ──────────────────────────────────────────────────────
  const summaryRows = records.map(r => ({
    'Unit Name': r.unitName,
    'Cluster': r.clusterName,
    'Total Meetings': r.meetings.length,
    'Meetings Attended (any member)': r.meetings.filter(m => m.pointsEarned > 0).length,
    'Points Earned': r.totalPoints,
    'Max Possible Points': r.maxTotalPoints,
    'Attendance %': `${r.attendancePercent}%`,
  }))

  const ws1 = XLSX.utils.json_to_sheet(summaryRows)
  ws1['!cols'] = [
    { wch: 30 },
    { wch: 20 },
    { wch: 16 },
    { wch: 28 },
    { wch: 14 },
    { wch: 20 },
    { wch: 14 },
  ]
  XLSX.utils.book_append_sheet(wb, ws1, 'Summary')

  // ── Sheet 2: Meeting-wise Details ─────────────────────────────────────────
  // Collect all unique meeting names (preserving order from first record)
  const allMeetingNames: string[] = []
  if (records.length > 0) {
    for (const m of records[0].meetings) {
      allMeetingNames.push(m.name)
    }
  }

  const detailRows = records.map(r => {
    const row: Record<string, string | number> = {
      'Unit Name': r.unitName,
      'Cluster': r.clusterName,
    }
    for (const meetingName of allMeetingNames) {
      const m = r.meetings.find(m => m.name === meetingName)
      row[meetingName] = m ? m.pointsEarned : 0
    }
    row['Total Points'] = r.totalPoints
    row['Max Points'] = r.maxTotalPoints
    row['Attendance %'] = `${r.attendancePercent}%`
    return row
  })

  const ws2 = XLSX.utils.json_to_sheet(detailRows)
  ws2['!cols'] = [
    { wch: 30 },
    { wch: 20 },
    ...allMeetingNames.map(() => ({ wch: 16 })),
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
  ]
  XLSX.utils.book_append_sheet(wb, ws2, 'Meeting-wise Details')

  // ── Sheet 3: Absent Members ───────────────────────────────────────────────
  const absentRows: Array<Record<string, string>> = []
  for (const r of records) {
    for (const am of r.absentMembersPerMeeting) {
      if (am.absentMembers.length > 0) {
        const meetingEntry = r.meetings.find(m => m.name === am.meetingName)
        absentRows.push({
          'Unit Name': r.unitName,
          'Cluster': r.clusterName,
          'Meeting Name': am.meetingName,
          'Meeting Date': meetingEntry?.date ?? '',
          'Absent Members': am.absentMembers.join(', '),
        })
      }
    }
  }

  const ws3 = XLSX.utils.json_to_sheet(absentRows.length > 0 ? absentRows : [{ 'Note': 'No absent members data' }])
  ws3['!cols'] = [
    { wch: 30 },
    { wch: 20 },
    { wch: 25 },
    { wch: 15 },
    { wch: 60 },
  ]
  XLSX.utils.book_append_sheet(wb, ws3, 'Absent Members')

  XLSX.writeFile(wb, 'SKSSF_Unit_Points_Report.xlsx')
}
