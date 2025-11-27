// frontend/src/utils/pdfExport.js
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logo from "../asset/ims-logo.png"; // <-- Place your logo inside /src/assets

export const exportToPDF = (timetableData) => {
  try {
    const doc = new jsPDF("landscape", "pt", [842, 800]);


    // ---------- Header Section ----------
    const pageWidth = doc.internal.pageSize.getWidth();
    const centerX = pageWidth / 2;

    // College Logo
    doc.addImage(logo, "PNG", 40, 25, 60, 60);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("IMS ENGINEERING COLLEGE, GHAZIABAD", centerX, 45, { align: "center" });

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Department of Computer Science & Engineering", centerX, 65, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.text(`TIME TABLE (w.e.f. ${new Date().toLocaleDateString("en-GB")})`, centerX, 80, { align: "center" });

    doc.text(
      `${timetableData.year || "B.Tech"} | Semester: ${timetableData.semester || "N/A"} | Academic Year: ${timetableData.academicYear || "N/A"}`,
      centerX,
      95,
      { align: "center" }
    );

    // ---------- Prepare Data ----------
    const schedule = timetableData.schedule || {};
    const timeSlots = timetableData.timeSlots || [];
    const days = timetableData.days || [];

   const getCompactSubjectName = (subjectName = "") => {
  if (!subjectName) return "";

  const clean = subjectName
   // Removes anything like (continued), (Continued), (contd), (Contd.), or stray brackets
.replace(/\(.*(continued|contd).*?\)/gi, "")
.replace(/\(.*\)/g, "") // remove any leftover bracketed noise

    .replace(/\s+/g, " ")
    .trim();

  // 🧠 Predefined precise mappings
 const predefined = {
  // ✅ Strong mappings for all possible forms
  "database management system": "DBMS",
  "dbms": "DBMS",
  "dbmslab": "DBMS Lab",
  "dbms lab": "DBMS Lab",

  "web technology": "WT",
  "wt": "WT",
  "wtlab": "WT Lab",
  "web tech lab": "WT Lab",

  "data analytics": "DA",
  "data analysis": "DA",
  "da lab": "DA Lab",
  "dalab": "DA Lab",

  "design and analysis of algorithm": "DAA",
  "daa": "DAA",
  "daa lab": "DAA Lab",

  "machine learning": "ML",
  "ml": "ML",
  "ml lab": "ML Lab",

  "indian tradition culture and society": "ITCS",
  "itcs": "ITCS",

  "anudip": "Anudip",
  "Anudip (Continued)": "Anudip",
  "mini project": "Mini Project",
  "mentor": "Mentor",
  "library": "Library",
  "break": "Break",
  "lunch": "Lunch",
};

  const lower = clean.toLowerCase();

 for (const key in predefined) {
  if (lower === key || lower.includes(` ${key} `)) {
    const base = predefined[key];
    if (lower.includes("lab") && !base.toLowerCase().includes("lab")) {
      return `${base} Lab`;
    }
    return base;
  }
}


  // fallback acronym for unmapped subjects
  const words = clean.split(" ").filter(Boolean);
  if (words.length === 1) {
    return clean.length <= 6 ? clean.toUpperCase() : clean.substring(0, 5).toUpperCase();
  }

  let acronym = words.map((w) => w[0].toUpperCase()).join("");
  if (acronym.length > 5) acronym = acronym.substring(0, 5);
  return lower.includes("lab") ? `${acronym} Lab` : acronym;
};




  const formatTeacherName = (fullName = "") => {
  if (!fullName) return "";
  const clean = fullName
    .replace(/(Mr\.?|Mrs\.?|Ms\.?|Dr\.?|Prof\.?)/gi, "")
    .trim();
  const parts = clean.split(" ").filter(Boolean);
  return parts.length > 0 ? parts[0] : clean;
};




   const rows = timeSlots.map((slot) => {
  const row = [slot];
  days.forEach((day) => {
    const cell = schedule[day]?.[slot];
    // 🧠 Skip continuation or hidden cells from split-labs
if (cell.isContinuation || cell.sameGroup) return;

    if (!cell || (!cell.subject && !cell.teacher)) {
      row.push("");
      return;
    }

    // 🧩 Handle split-lab case with deduplication
if (
  cell &&
  cell.type === "split-lab" &&
  Array.isArray(cell.parallelSessions) &&
  cell.parallelSessions.length > 0
) {

  let cellText = "";
  const addedRooms = new Set();

  cell.parallelSessions.forEach((session, idx) => {
    if (idx > 0) cellText += "\n---\n";

    const subjName = getCompactSubjectName(session.subject);
    const subjCode = session.code || "";
    const teacher = formatTeacherName(session.teacher);
    const room = session.room || "";

    cellText += `${session.batch || ""}: ${subjName}`;
    if (subjCode) cellText += `\n(${subjCode})`;
    if (teacher) cellText += `\n${teacher}`;
    if (room && !addedRooms.has(room)) {
      cellText += `\n${room}`;
      addedRooms.add(room);
    }
  });

  row.push(cellText.trim());
  return; // skip normal single-cell logic
}

    // 🧩 Unified subject/code extraction (handles both nested + flat formats)
const subj =
  typeof cell.subject === "object"
    ? cell.subject
    : { name: cell.subject || "", code: cell.code || "" };

const subjectAcronym = getCompactSubjectName(subj.name || "");
const subjectCode = subj.code?.trim() || cell.code?.trim() || "";

    const teacherName = formatTeacherName(
      typeof cell.teacher === "string" ? cell.teacher : cell.teacher?.name
    );

    // ✅ Final structured layout: Acronym → Code → Teacher
    let text = "";
    if (subjectAcronym) text += `${subjectAcronym}`;
    if (subjectCode) text += `\n(${subjectCode})`;
    if (teacherName) text += `\n${teacherName}`;

    row.push(text.trim());
  });
  return row;
});


    // ---------- Colors ----------
    const typeColors = {
      lecture: [225, 255, 225],
      lab: [210, 230, 255],
      "split-lab": [240, 220, 255],
      lunch: [255, 245, 210],
      break: [255, 245, 210],
      library: [255, 255, 240],
      default: [255, 255, 255],
    };

    // ---------- Main Table ----------
    autoTable(doc, {
      startY: 110,
      head: [["Time", ...days]],
      body: rows,
      theme: "grid",
      styles: {
        fontSize: 8,
        halign: "center",
        valign: "middle",
        cellPadding: { top: 10, bottom: 10 },
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: "bold",
      },
      columnStyles: {
        0: { fillColor: [230, 230, 230], fontStyle: "bold", cellWidth: 85 },
      },
      didParseCell: function (data) {
  if (data.section === "body" && data.column.index > 0) {
    const day = days[data.column.index - 1];
    const time = timeSlots[data.row.index];
    const cell = schedule?.[day]?.[time];

    if (cell && cell.type) {
      data.cell.styles.fillColor = typeColors[cell.type] || typeColors.default;
    } else {
      // 🩵 Default color for blank cells (pure white)
      data.cell.styles.fillColor = [255, 255, 255];
    }
  }
},

    });

    // ---------- Legend ----------
    const legendY = doc.lastAutoTable.finalY + 20;
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Legend:", 40, legendY);

    const legendItems = [
      { color: typeColors.lecture, label: "Lecture" },
      { color: typeColors.lab, label: "Lab" },
      { color: typeColors["split-lab"], label: "Split Lab" },
      { color: typeColors.lunch, label: "Lunch / Break" },
    ];

    let x = 100;
    legendItems.forEach((item) => {
      doc.setFillColor(...item.color);
      doc.rect(x, legendY - 8, 12, 12, "F");
      doc.text(item.label, x + 18, legendY + 2);
      x += 100;
    });

    // ---------- Bottom Subject Table ----------
    const subjTable = (timetableData.subjectList || []).map((s) => [
      s.shortName,
      s.code,
      s.name,
      s.teacher,
    ]);

    if (subjTable.length > 0) {
      autoTable(doc, {
        startY: legendY + 25,
        head: [["Short Name", "Sub. Code", "Subject Name", "Subject Teacher"]],
        body: subjTable,
       styles: {
  fontSize: 9,
  halign: "center",
  valign: "middle",
  cellPadding: { top: 10, right: 4, bottom: 10, left: 4 },  // ✅ more breathing space
  lineWidth: 0.2,
  lineHeight: 1.2,
  lineColor: [180, 180, 180],
  overflow: "linebreak",
  minCellHeight: 28, // ✅ uniform height
},
       headStyles: {
  fillColor: [30, 70, 140],
  textColor: 255,
  fontStyle: "bold",
  halign: "center",
  valign: "middle",
  cellPadding: { top: 10, bottom: 10 },
},
alternateRowStyles: { fillColor: [250, 250, 250] },
      });
    }

    // ---------- Footer ----------
    const footerY = doc.internal.pageSize.getHeight() - 40;
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    
    // Use stored coordinatorName from database (single source of truth)
    const coordinatorName = timetableData.coordinatorName || "Coordinator";
    
    doc.text(
      `Name of Time-Table Incharge: ${coordinatorName}`,
      centerX,
      footerY - 10,
      { align: "center" }
    );
    
    doc.text(
      `Published By: ${coordinatorName}`,
      centerX,
      footerY,
      { align: "center" }
    );

    doc.text("Signature: HOD", pageWidth - 100, footerY);

    // ---------- Save ----------
    const fileName = `timetable-${timetableData.year}-${timetableData.branch}-Section-${timetableData.section}.pdf`;
    doc.save(fileName);
  } catch (err) {
    console.error("PDF generation failed:", err);
  }
};
