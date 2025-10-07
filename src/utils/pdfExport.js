import jsPDF from 'jspdf'

export const exportToPDF = (timetableData) => {
  const pdf = new jsPDF('landscape', 'mm', 'a4')
  
  // Page dimensions
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 15
  
  // Title
  pdf.setFontSize(24)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Timetable', pageWidth / 2, 25, { align: 'center' })
  
  // Timetable info
  pdf.setFontSize(14)
  pdf.setFont('helvetica', 'normal')
  const infoY = 35
  const infoText = `${timetableData.year || ''} - ${timetableData.branch || ''} - Section ${timetableData.section || ''}`
  pdf.text(infoText, pageWidth / 2, infoY, { align: 'center' })
  
  // Date and time
  pdf.setFontSize(10)
  const currentDate = new Date()
  const dateText = `Generated on: ${currentDate.toLocaleDateString()} at ${currentDate.toLocaleTimeString()}`
  pdf.text(dateText, pageWidth / 2, infoY + 8, { align: 'center' })
  
  // Get schedule data
  const scheduleData = timetableData.schedule || {}
  const timeSlots = timetableData.timeSlots || []
  const days = timetableData.days || []
  
  if (timeSlots.length === 0 || days.length === 0) {
    pdf.setFontSize(16)
    pdf.text('No timetable data available', pageWidth / 2, pageHeight / 2, { align: 'center' })
    pdf.save(`timetable-${timetableData.year || 'unknown'}-${timetableData.branch || 'unknown'}-${timetableData.section || 'unknown'}.pdf`)
    return
  }
  
  // Calculate table dimensions
  const tableStartY = 55
  const availableWidth = pageWidth - (2 * margin)
  const availableHeight = pageHeight - tableStartY - margin
  
  // Calculate cell dimensions to fit all content
  const timeColumnWidth = Math.max(50, availableWidth * 0.2) // At least 50mm for time column
  const dayColumnWidth = (availableWidth - timeColumnWidth) / days.length
  const rowHeight = Math.min(20, availableHeight / (timeSlots.length + 1)) // +1 for header
  
  // Adjust font sizes based on cell dimensions
  const headerFontSize = Math.min(12, dayColumnWidth / 4)
  const timeFontSize = Math.min(10, timeColumnWidth / 6)
  const cellFontSize = Math.min(9, dayColumnWidth / 5)
  
  // Draw table
  let currentY = tableStartY
  
  // Header row
  pdf.setFontSize(headerFontSize)
  pdf.setFont('helvetica', 'bold')
  
  // Time column header
  pdf.rect(margin, currentY, timeColumnWidth, rowHeight)
  pdf.text('Time / Day', margin + timeColumnWidth / 2, currentY + rowHeight / 2 + 2, { align: 'center' })
  
  // Day headers
  days.forEach((day, index) => {
    const x = margin + timeColumnWidth + (index * dayColumnWidth)
    pdf.rect(x, currentY, dayColumnWidth, rowHeight)
    
    // Truncate day name if necessary
    const dayText = dayColumnWidth < 30 ? day.substring(0, 3) : day
    pdf.text(dayText, x + dayColumnWidth / 2, currentY + rowHeight / 2 + 2, { align: 'center' })
  })
  
  currentY += rowHeight
  
  // Data rows
  pdf.setFont('helvetica', 'normal')
  
  timeSlots.forEach((timeSlot, rowIndex) => {
    // Time slot column
    pdf.rect(margin, currentY, timeColumnWidth, rowHeight)
    pdf.setFontSize(timeFontSize)
    
    // Format time slot for better readability
    const formattedTimeSlot = timeSlot.length > 15 ? 
      timeSlot.replace(' AM', 'AM').replace(' PM', 'PM') : timeSlot
    
    pdf.text(formattedTimeSlot, margin + timeColumnWidth / 2, currentY + rowHeight / 2 + 1, { align: 'center' })
    
    // Schedule cells
    days.forEach((day, colIndex) => {
      const x = margin + timeColumnWidth + (colIndex * dayColumnWidth)
      const cellData = scheduleData[day]?.[timeSlot]
      
      pdf.rect(x, currentY, dayColumnWidth, rowHeight)
      
      if (cellData && (cellData.subject || cellData.teacher)) {
        pdf.setFontSize(cellFontSize)
        
        // Handle different cell types
        if (cellData.type === 'lunch') {
          pdf.setFont('helvetica', 'bold')
          pdf.text('LUNCH', x + dayColumnWidth / 2, currentY + rowHeight / 2 + 1, { align: 'center' })
        } else if (cellData.type === 'break') {
          pdf.setFont('helvetica', 'bold')
          pdf.text('BREAK', x + dayColumnWidth / 2, currentY + rowHeight / 2 + 1, { align: 'center' })
        } else {
          // Regular class
          pdf.setFont('helvetica', 'bold')
          
          // Subject (truncate if too long)
          const maxSubjectLength = Math.floor(dayColumnWidth / 3)
          const subjectText = cellData.subject.length > maxSubjectLength ? 
            cellData.subject.substring(0, maxSubjectLength - 2) + '..' : cellData.subject
          
          const textY = currentY + (rowHeight * 0.3)
          pdf.text(subjectText, x + dayColumnWidth / 2, textY, { align: 'center' })
          
          // Teacher
          if (cellData.teacher) {
            pdf.setFont('helvetica', 'normal')
            pdf.setFontSize(cellFontSize - 1)
            
            const maxTeacherLength = Math.floor(dayColumnWidth / 2.5)
            const teacherText = cellData.teacher.length > maxTeacherLength ? 
              cellData.teacher.substring(0, maxTeacherLength - 2) + '..' : cellData.teacher
            
            pdf.text(teacherText, x + dayColumnWidth / 2, textY + 4, { align: 'center' })
          }
          
          // Room (if available and space permits)
          if (cellData.room && rowHeight > 15) {
            pdf.setFontSize(cellFontSize - 2)
            const roomText = `Room: ${cellData.room}`
            pdf.text(roomText, x + dayColumnWidth / 2, textY + 8, { align: 'center' })
          }
        }
      } else {
        // Empty cell
        pdf.setFontSize(cellFontSize - 1)
        pdf.setFont('helvetica', 'italic')
        pdf.text('Free', x + dayColumnWidth / 2, currentY + rowHeight / 2 + 1, { align: 'center' })
      }
    })
    
    currentY += rowHeight
  })
  
  // Add footer with additional info
  pdf.setFontSize(8)
  pdf.setFont('helvetica', 'normal')
  const footerY = pageHeight - 10
  
  if (timetableData.semester) {
    pdf.text(`Semester: ${timetableData.semester}`, margin, footerY)
  }
  
  if (timetableData.academicYear) {
    pdf.text(`Academic Year: ${timetableData.academicYear}`, pageWidth - margin, footerY, { align: 'right' })
  }
  
  // Save the PDF
  const fileName = `timetable-${timetableData.year || 'unknown'}-${timetableData.branch || 'unknown'}-${timetableData.section || 'unknown'}.pdf`
  pdf.save(fileName)
}