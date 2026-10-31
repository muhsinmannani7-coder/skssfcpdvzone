import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { AttendanceExportRecord, CommitteePointsExportRecord } from './exportExcel'

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
