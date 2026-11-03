import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { AttendanceExportRecord, CommitteePointsExportRecord, UnitReportExportData } from './exportExcel'

export function exportAttendanceToPdf(
  programName: string,
  programDate: string,
  venue: string,
  records: AttendanceExportRecord[]
) {
  const doc = new jsPDF()

  // Header branding
  doc.setFillColor(15, 118, 110) // Primary teal/green
  doc.rect(0, 0, 210, 28, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('SKSSF CHAPPARAPPADAVU ZONE', 105, 12, { align: 'center' })

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('OFFICIAL ATTENDANCE REGISTER & REPORT', 105, 20, { align: 'center' })

  // Event info box
  doc.setTextColor(30, 41, 59)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text(`Event: ${programName}`, 14, 38)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`Date: ${programDate}  |  Venue: ${venue}`, 14, 44)
  doc.text(`Total Present: ${records.length} Members  |  Generated on: ${new Date().toLocaleDateString('en-IN')}`, 14, 50)

  // Table
  const tableData = records.map(r => [
    r.slNo.toString(),
    r.memberName,
    r.mobile,
    r.committee,
    r.position,
    r.markedAt,
  ])

  autoTable(doc, {
    startY: 55,
    head: [['#', 'Member Name', 'Mobile', 'Committee', 'Position', 'Marked At']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 118, 110],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 2,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 45 },
      2: { cellWidth: 28 },
      3: { cellWidth: 45 },
      4: { cellWidth: 40 },
      5: { cellWidth: 22 },
    },
    didDrawPage: (data) => {
      // Footer page number
      doc.setFontSize(8)
      doc.setTextColor(148, 163, 184)
      const pageStr = `Page ${data.pageNumber} of ${doc.getNumberOfPages()}`
      doc.text(pageStr, 196, 287, { align: 'right' })
      doc.text('SKSSF Chapparappadavu Zone — Confidential Official Record', 14, 287)
    },
  })

  const sanitizedTitle = programName.replace(/[^a-zA-Z0-9_-]/g, '_')
  doc.save(`SKSSF_Attendance_${sanitizedTitle}_${programDate}.pdf`)
}

export function exportCommitteePointsToPdf(
  programName: string,
  records: CommitteePointsExportRecord[]
) {
  const doc = new jsPDF()

  // Header branding
  doc.setFillColor(15, 118, 110)
  doc.rect(0, 0, 210, 28, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('SKSSF CHAPPARAPPADAVU ZONE', 105, 12, { align: 'center' })

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('COMMITTEE-WISE POINTS & PERFORMANCE REPORT', 105, 20, { align: 'center' })

  // Summary
  doc.setTextColor(30, 41, 59)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text(`Program: ${programName}`, 14, 38)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`Committees Evaluated: ${records.length}  |  Generated on: ${new Date().toLocaleDateString('en-IN')}`, 14, 44)

  const tableData = records.map(r => [
    r.rank.toString(),
    r.committeeName,
    r.level.toUpperCase(),
    r.clusterName || '—',
    r.totalPositions.toString(),
    r.presentCount.toString(),
    r.points.toString(),
    r.percentage,
  ])

  autoTable(doc, {
    startY: 50,
    head: [['Rank', 'Committee', 'Level', 'Cluster', 'Total Seats', 'Attended', 'Points', 'Rate']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 118, 110],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 2,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 14, halign: 'center' },
      1: { cellWidth: 50 },
      2: { cellWidth: 22 },
      3: { cellWidth: 32 },
      4: { cellWidth: 20, halign: 'center' },
      5: { cellWidth: 20, halign: 'center' },
      6: { cellWidth: 18, halign: 'center' },
      7: { cellWidth: 18, halign: 'center' },
    },
    didDrawPage: (data) => {
      doc.setFontSize(8)
      doc.setTextColor(148, 163, 184)
      const pageStr = `Page ${data.pageNumber} of ${doc.getNumberOfPages()}`
      doc.text(pageStr, 196, 287, { align: 'right' })
      doc.text('SKSSF Chapparappadavu Zone — Performance Summary', 14, 287)
    },
  })

  const sanitizedTitle = programName.replace(/[^a-zA-Z0-9_-]/g, '_')
  doc.save(`SKSSF_Points_${sanitizedTitle}.pdf`)
}

export function exportUnitReportToPdf(
  records: UnitReportExportData[],
  summary: {
    totalMeetings: number
    totalPoints: number
    fullAttendance: number
    zeroAttendance: number
  },
  clusterFilterName?: string
) {
  // Use Landscape for comfortable layout of matrix columns
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  // 1. Header Branding
  doc.setFillColor(15, 118, 110) // Primary Teal
  doc.rect(0, 0, 297, 24, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(15)
  doc.setFont('helvetica', 'bold')
  doc.text('SKSSF CHAPPARAPPADAVU ZONE', 148.5, 10, { align: 'center' })

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('OFFICIAL UNIT (SHAKHA) ATTENDANCE & POINTS REPORT', 148.5, 17, { align: 'center' })

  // 2. Report metadata
  doc.setTextColor(30, 41, 59)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  const scopeText = clusterFilterName && clusterFilterName !== 'all'
    ? `Cluster: ${clusterFilterName}`
    : 'Scope: All 16 Units'
  doc.text(scopeText, 14, 32)

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 116, 139)
  const dateStr = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
  doc.text(`Generated on: ${dateStr}  |  Official Zone Record`, 14, 37)

  // 3. KPI Summary Badges
  const drawKpi = (
    x: number,
    y: number,
    label: string,
    val: string | number,
    bgColor: [number, number, number],
    textColor: [number, number, number]
  ) => {
    doc.setFillColor(...bgColor)
    doc.roundedRect(x, y, 38, 11, 2, 2, 'F')
    doc.setFontSize(6.5)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...textColor)
    doc.text(label.toUpperCase(), x + 19, y + 4, { align: 'center' })
    doc.setFontSize(8.5)
    doc.text(val.toString(), x + 19, y + 9, { align: 'center' })
  }

  drawKpi(130, 27, 'Total Meetings', summary.totalMeetings, [239, 246, 255], [29, 78, 216])
  drawKpi(171, 27, 'Points Given', summary.totalPoints, [240, 253, 250], [15, 118, 110])
  drawKpi(212, 27, 'Full Attendance', `${summary.fullAttendance} Units`, [236, 253, 245], [4, 120, 87])
  drawKpi(253, 27, 'No Attendance', `${summary.zeroAttendance} Units`, [254, 242, 242], [185, 28, 28])

  // 4. Extract meeting names from first record
  const meetingNames: string[] = []
  if (records.length > 0 && records[0].meetings) {
    records[0].meetings.forEach(m => meetingNames.push(m.name))
  }

  // Construct table headers
  const headRow = [
    'Rank',
    'Unit Name (Shakha)',
    'Cluster',
    ...meetingNames.map(name => name.length > 20 ? name.slice(0, 18) + '..' : name),
    'Total Pts',
    'Max Pts',
    'Rate',
  ]

  // Construct table body
  const bodyRows = records.map(r => {
    const rankLabel = r.rank === 1 ? '1 [Gold]' : r.rank === 2 ? '2 [Silver]' : r.rank === 3 ? '3 [Bronze]' : `#${r.rank}`
    const meetingCols = meetingNames.map(mName => {
      const cell = r.meetings.find(m => m.name === mName)
      if (!cell) return '—'
      return `${cell.pointsEarned}/${cell.maxPoints}`
    })
    return [
      rankLabel,
      r.unitName,
      r.clusterName,
      ...meetingCols,
      r.totalPoints.toString(),
      r.maxTotalPoints.toString(),
      `${r.attendancePercent}%`,
    ]
  })

  // Dynamic column styles
  const columnStyles: Record<number, { cellWidth?: number; halign?: 'left' | 'center' | 'right'; fontStyle?: 'bold' | 'normal' }> = {
    0: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
    1: { cellWidth: 55, fontStyle: 'bold' },
    2: { cellWidth: 26, halign: 'center' },
  }

  const startMeetingIdx = 3
  meetingNames.forEach((_, idx) => {
    columnStyles[startMeetingIdx + idx] = { halign: 'center' }
  })
  const totalIdx = startMeetingIdx + meetingNames.length
  columnStyles[totalIdx] = { cellWidth: 20, halign: 'center', fontStyle: 'bold' }
  columnStyles[totalIdx + 1] = { cellWidth: 20, halign: 'center' }
  columnStyles[totalIdx + 2] = { cellWidth: 20, halign: 'center', fontStyle: 'bold' }

  autoTable(doc, {
    startY: 42,
    head: [headRow],
    body: bodyRows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 118, 110],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 2,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles,
    didParseCell: (data) => {
      if (data.section === 'body') {
        const rowData = records[data.row.index]
        if (rowData && rowData.totalPoints > 0) {
          if (rowData.rank === 1) {
            data.cell.styles.fillColor = [254, 252, 232] // Gold
          } else if (rowData.rank === 2) {
            data.cell.styles.fillColor = [248, 250, 252] // Silver
          } else if (rowData.rank === 3) {
            data.cell.styles.fillColor = [255, 247, 237] // Bronze
          }
        }
      }
    },
    didDrawPage: (data) => {
      doc.setFontSize(8)
      doc.setTextColor(148, 163, 184)
      const pageStr = `Page ${data.pageNumber} of ${doc.getNumberOfPages()}`
      doc.text(pageStr, 283, 202, { align: 'right' })
      doc.text('SKSSF Chapparappadavu Zone — Confidential Official Record', 14, 202)
    },
  })

  // 5. Section 2: Absent Office Bearers Table
  const absentRecords: Array<[string, string, string, string]> = []
  records.forEach(r => {
    r.absentMembersPerMeeting.forEach(ab => {
      if (ab.absentMembers && ab.absentMembers.length > 0) {
        absentRecords.push([
          r.unitName,
          r.clusterName,
          ab.meetingName,
          ab.absentMembers.join(', '),
        ])
      }
    })
  })

  if (absentRecords.length > 0) {
    const lastY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 150
    if (lastY > 150) {
      doc.addPage()
    }

    const startY2 = lastY > 150 ? 20 : lastY + 8

    doc.setTextColor(185, 28, 28)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text('ABSENT OFFICE BEARERS RECORD (ഹാജരാകാത്ത ഭാരവാഹികളുടെ വിവരങ്ങൾ)', 14, startY2)

    autoTable(doc, {
      startY: startY2 + 3,
      head: [['Unit Name (Shakha)', 'Cluster', 'Meeting Name', 'Absent Members (ഹാജരാകാത്തവർ)']],
      body: absentRecords,
      theme: 'grid',
      headStyles: {
        fillColor: [185, 28, 28],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
      },
      bodyStyles: {
        fontSize: 8,
        cellPadding: 2,
      },
      alternateRowStyles: {
        fillColor: [254, 242, 242],
      },
      columnStyles: {
        0: { cellWidth: 55, fontStyle: 'bold' },
        1: { cellWidth: 26 },
        2: { cellWidth: 45 },
        3: { cellWidth: 'auto' },
      },
      didDrawPage: (data) => {
        doc.setFontSize(8)
        doc.setTextColor(148, 163, 184)
        const pageStr = `Page ${data.pageNumber} of ${doc.getNumberOfPages()}`
        doc.text(pageStr, 283, 202, { align: 'right' })
        doc.text('SKSSF Chapparappadavu Zone — Confidential Official Record', 14, 202)
      },
    })
  }

  const dateFileStr = new Date().toISOString().split('T')[0]
  doc.save(`SKSSF_Unit_Points_Report_${dateFileStr}.pdf`)
}
