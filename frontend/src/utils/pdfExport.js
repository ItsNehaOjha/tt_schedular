import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';

export const exportToPDF = (timetableData) => {
  try {
    console.log('PDF Export - Full timetable data:', timetableData);
    
    const doc = new jsPDF();
    
    // Set title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Timetable', 105, 20, { align: 'center' });
    
    // Add timetable info
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    const info = `${timetableData.year || 'N/A'} - ${timetableData.branch || 'N/A'} - Section ${timetableData.section || 'N/A'}`;
    doc.text(info, 105, 30, { align: 'center' });
    
    // Add academic year and semester if available
    if (timetableData.academicYear || timetableData.semester) {
      const academicInfo = `Academic Year: ${timetableData.academicYear || 'N/A'} | Semester: ${timetableData.semester || 'N/A'}`;
      doc.text(academicInfo, 105, 40, { align: 'center' });
    }
    
    // Prepare table data
    const schedule = timetableData.schedule || {};
    const timeSlots = timetableData.timeSlots || [];
    const days = timetableData.days || [];
    
    console.log('PDF Export - Schedule data:', schedule);
    console.log('PDF Export - Time slots:', timeSlots);
    console.log('PDF Export - Days:', days);
    
    if (timeSlots.length === 0 || days.length === 0) {
      doc.text('No timetable data available', 105, 60, { align: 'center' });
      doc.save(`timetable-${timetableData.year || 'unknown'}-${timetableData.branch || 'unknown'}-${timetableData.section || 'unknown'}.pdf`);
      return;
    }
    
    // Create table headers
    const headers = ['Time', ...days];
    
    // Helper function to generate acronym from subject name
    const generateAcronym = (subjectName) => {
      if (!subjectName || typeof subjectName !== 'string') return '';
      
      // Remove common words and prepositions
      const wordsToIgnore = ['and', 'of', 'the', 'in', 'to', 'for', 'with', 'on', 'at', 'by', 'from'];
      
      const words = subjectName
        .trim()
        .split(/\s+/)
        .filter(word => word.length > 0 && !wordsToIgnore.includes(word.toLowerCase()));
      
      if (words.length === 0) return subjectName.substring(0, 3).toUpperCase();
      
      // Take first letter of each significant word
      let acronym = words.map(word => word.charAt(0).toUpperCase()).join('');
      
      // If acronym is too long (more than 6 characters), take only first 6
      if (acronym.length > 6) {
        acronym = acronym.substring(0, 6);
      }
      
      // If acronym is too short (less than 2 characters), add more letters
      if (acronym.length < 2 && words.length > 0) {
        acronym = words[0].substring(0, Math.min(4, words[0].length)).toUpperCase();
      }
      
      return acronym;
    };
    
    // Helper function to get subject display name (full name or acronym, not code)
    const getSubjectDisplayName = (cellData) => {
      // If subject name is short (≤ 8 characters), use it as is
      if (cellData.subject && cellData.subject.length <= 8) {
        return cellData.subject;
      }
      
      // Generate acronym for longer subject names
      return generateAcronym(cellData.subject);
    };

    // Helper function to format subject with code
    const formatSubjectWithCode = (cellData) => {
      let subjectText = '';
      
      // First line: Subject name or acronym
      if (cellData.subject) {
        subjectText = getSubjectDisplayName(cellData);
      }
      
      // Second line: Subject code (if different from subject name)
      if (cellData.code && cellData.code !== cellData.subject && cellData.code.trim() !== '') {
        subjectText += `\n${cellData.code}`;
      }
      
      return subjectText;
    };

    // Helper function to format teacher name for PDF
    const formatTeacherName = (fullName) => {
      if (!fullName || typeof fullName !== 'string') return '';
      
      // If the name starts with title (Mr., Dr., Prof., etc.), keep the title + first name
      const nameParts = fullName.trim().split(' ');
      if (nameParts.length >= 2) {
        const firstPart = nameParts[0];
        // Check if first part is a title
        if (firstPart.match(/^(Mr|Dr|Prof|Ms|Mrs)\.?$/i)) {
          // Return title + first name (e.g., "Mr. Piyush" from "Mr. Piyush Kumar")
          return `${firstPart}${firstPart.endsWith('.') ? '' : '.'} ${nameParts[1]}`;
        } else {
          // If no title, just return first name
          return nameParts[0];
        }
      }
      return fullName;
    };

    // Create table rows
    const rows = timeSlots.map(timeSlot => {
      const row = [timeSlot];
      days.forEach(day => {
        const cellData = schedule[day]?.[timeSlot];
        
        console.log(`PDF Export - Cell data for ${day} ${timeSlot}:`, cellData);
        
        // Handle split-lab with parallel sessions
        if (cellData && cellData.type === 'split-lab' && cellData.parallelSessions) {
          let cellText = '';
          cellData.parallelSessions.forEach((session, index) => {
            if (index > 0) cellText += '\n---\n'; // Separator between sessions
            
            // Use subject name/acronym for parallel sessions
            const subjectDisplay = session.subject && session.subject.length <= 8 
              ? session.subject 
              : generateAcronym(session.subject);
            cellText += `${subjectDisplay} LAB (${session.batch})`;
            
            // Add subject code if available and different
            if (session.code && session.code !== session.subject && session.code.trim() !== '') {
              cellText += `\n${session.code}`;
            }
            
            // Add teacher name
            if (session.teacher) {
              const formattedTeacherName = formatTeacherName(session.teacher);
              cellText += `\n${formattedTeacherName}`;
            }
            
            // Add room information
            if (session.room) {
              cellText += `\n${session.room}`;
            }
          });
          
          row.push(cellText || 'N/A');
        } else if (cellData && (cellData.subject || cellData.teacher)) {
          let cellText = '';
          
          // Format subject with code
          if (cellData.subject) {
            cellText = formatSubjectWithCode(cellData);
          }
          
          // Add teacher name - handle both string and object formats
          let teacherName = '';
          if (typeof cellData.teacher === 'string') {
            teacherName = cellData.teacher;
          } else if (cellData.teacher && typeof cellData.teacher === 'object') {
            teacherName = cellData.teacher.name || '';
          }
          
          console.log(`PDF Export - Teacher name extracted: "${teacherName}"`);
          
          if (teacherName && teacherName.trim() !== '') {
            const formattedTeacherName = formatTeacherName(teacherName);
            console.log(`PDF Export - Formatted teacher name: "${formattedTeacherName}"`);
            cellText += cellText ? `\n${formattedTeacherName}` : formattedTeacherName;
          }
          
          // Add room information
          if (cellData.room) {
            cellText += cellText ? `\n${cellData.room}` : cellData.room;
          }
          
          row.push(cellText || 'N/A');
        } else if (cellData && (cellData.type === 'lunch' || cellData.type === 'break' || 
                   (typeof cellData === 'string' && cellData.toLowerCase().includes('lunch')))) {
          row.push('LUNCH');
        } else {
          row.push('');
        }
      });
      return row;
    });
    
    console.log('PDF Export - Final rows data:', rows);
    
    // Add table to PDF using autoTable function with optimized settings for A4 fit
    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 50,
      styles: {
        fontSize: 7, // Reduced font size for better fit
        cellPadding: 2, // Reduced padding
        overflow: 'linebreak',
        halign: 'center',
        valign: 'middle',
        lineColor: [0, 0, 0],
        lineWidth: 0.1
      },
      headStyles: {
        fillColor: [66, 139, 202],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 8 // Slightly larger for headers
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      columnStyles: {
        0: { fontStyle: 'bold', fillColor: [230, 230, 230], fontSize: 7, minCellWidth: 25 }
      },
      margin: { top: 50, left: 8, right: 8 }, // Reduced margins for more space
      tableWidth: 'auto', // Let table adjust width automatically
      didDrawPage: function (data) {
        // Add footer
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(`Generated on ${new Date().toLocaleDateString()}`, 105, doc.internal.pageSize.height - 10, { align: 'center' });
      }
    });
    
    // Save the PDF
    const fileName = `timetable-${timetableData.year || 'unknown'}-${timetableData.branch || 'unknown'}-${timetableData.section || 'unknown'}.pdf`;
    doc.save(fileName);
    
    toast.success('PDF downloaded successfully!');
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    toast.error('Failed to generate PDF. Please check your timetable data and try again.');
    throw error;
  }
};