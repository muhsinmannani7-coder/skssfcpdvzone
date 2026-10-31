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
