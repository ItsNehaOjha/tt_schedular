// frontend/src/utils/pdfExport.js
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logo from "../asset/ims-logo.png"; // <-- Place your logo inside /src/assets

export const exportToPDF = (timetableData) => {
  try {
    const doc = new jsPDF("landscape", "pt", "a4");

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

  const cleanName = subjectName.replace(/\(.*continued.*\)/i, "").trim();

  // 🧩 Direct special mappings (priority)
  const special = {
    "Web Technology": "WT",
    "Database Management System": "DBMS",
    "Operating System": "OS",
    "Machine Learning": "ML",
    "Data Analysis": "DA",
    Anudip: "Anudip",
    Library: "Library",
    Break: "Break",
    Lunch: "Lunch",
    "Mini Project": "Mini Project",
    Mentor: "Mentor",
  };

  for (const key in special) {
    if (cleanName.toLowerCase().includes(key.toLowerCase())) return special[key];
  }

  const words = cleanName.split(/\s+/).filter((w) => w.length > 2);

  // 🧠 Case 1: Single short word (<= 8 chars) → show full word
  if (words.length === 1 && cleanName.length <= 8) {
    return cleanName;
  }

  // 🧠 Case 2: Single long word (> 8 chars) → shorten smartly
  if (words.length === 1 && cleanName.length > 8) {
    return cleanName.substring(0, 5).toUpperCase(); // e.g., "Programming" → "PROGR"
  }

  // 🧩 Case 3: Multi-word → use acronym (up to 3 chars)
  const acronym = words.map((w) => w[0].toUpperCase()).slice(0, 3).join("");

  // 🧩 Fallback: use first 3 letters
  return acronym || cleanName.substring(0, 3).toUpperCase();
};


  const formatTeacherName = (fullName = "") => {
  if (!fullName) return "";
  const clean = fullName.trim().replace(/\s{2,}/g, " ");
  const parts = clean.split(" ");

  // Keep only the first name (ignore last name)
  const firstName = parts.length > 1 ? parts[1] : parts[0];

  // Detect prefixes properly
  if (/^(Mr|Ms|Mrs|Dr|Prof)\.?$/i.test(parts[0])) {
    return `${parts[0].replace(".", "")}. ${firstName}`;
  }

  return `Mr. ${parts[0]}`; // Default fallback
};



   const rows = timeSlots.map((slot) => {
  const row = [slot];
  days.forEach((day) => {
    const cell = schedule[day]?.[slot];
    if (!cell || (!cell.subject && !cell.teacher)) {
      row.push("");
      return;
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
        cellPadding: 2,
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
          if (cell) data.cell.styles.fillColor = typeColors[cell.type] || typeColors.default;
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
  cellPadding: { top: 10, right: 6, bottom: 10, left: 6 },  // ✅ more breathing space
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
    doc.text(
  `Name of Time-Table Incharge:  ${timetableData.coordinatorName || "Coordinator"}`,
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
