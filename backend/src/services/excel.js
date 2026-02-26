const ExcelJS = require("exceljs");

function addCategorySheet(workbook, sheetName, categories, headerColor) {
  const sheet = workbook.addWorksheet(sheetName);

  sheet.columns = [
    { header: "No", key: "no", width: 5 },
    { header: "Category", key: "name", width: 30 },
    { header: "Planned Budget (Rp)", key: "planned", width: 22 },
    { header: "Actual Cost (Rp)", key: "actual", width: 22 },
    { header: "Difference (Rp)", key: "diff", width: 22 },
    { header: "Notes", key: "notes", width: 40 },
  ];

  // Style header
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: headerColor } };
  headerRow.alignment = { horizontal: "center" };

  let totalPlanned = 0;
  let totalActual = 0;

  categories.forEach((cat, i) => {
    const planned = Number(cat.plannedBudget);
    const actual = Number(cat.actualCost);
    const diff = planned - actual;
    totalPlanned += planned;
    totalActual += actual;

    const row = sheet.addRow({
      no: i + 1,
      name: cat.name,
      planned,
      actual,
      diff,
      notes: cat.notes || "",
    });

    row.getCell("planned").numFmt = "#,##0";
    row.getCell("actual").numFmt = "#,##0";
    row.getCell("diff").numFmt = "#,##0";

    if (diff < 0) {
      row.getCell("diff").font = { color: { argb: "FFD32F2F" } };
    }
  });

  // Total row
  const totalRow = sheet.addRow({
    no: "",
    name: "TOTAL",
    planned: totalPlanned,
    actual: totalActual,
    diff: totalPlanned - totalActual,
    notes: "",
  });
  totalRow.font = { bold: true };
  totalRow.getCell("planned").numFmt = "#,##0";
  totalRow.getCell("actual").numFmt = "#,##0";
  totalRow.getCell("diff").numFmt = "#,##0";

  // Borders
  sheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });
  });

  return { totalPlanned, totalActual };
}

async function generateExcel(project, stream) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Bataknese Wedding Budget Tracker";
  workbook.created = new Date();

  const events = project.events || [];
  const allCategories = events.flatMap((e) => e.categories || []);
  const totalPlanned = allCategories.reduce((s, c) => s + Number(c.plannedBudget), 0);
  const totalActual = allCategories.reduce((s, c) => s + Number(c.actualCost), 0);
  const remaining = Number(project.totalBudget) - totalActual;

  // ---- Sheet 1: Summary ----
  const summary = workbook.addWorksheet("Summary");
  summary.columns = [
    { header: "", key: "label", width: 25 },
    { header: "", key: "value", width: 35 },
  ];

  summary.addRow(["Bataknese Wedding Budget Report", ""]);
  summary.getRow(1).font = { bold: true, size: 14 };
  summary.mergeCells("A1:B1");
  summary.addRow([]);

  summary.addRow(["Groom", project.groomName]);
  summary.addRow(["Groom Domicile", project.groomDomicile]);
  summary.addRow(["Bride", project.brideName]);
  summary.addRow(["Bride Domicile", project.brideDomicile]);
  summary.addRow(["Wedding Date", new Date(project.weddingDate).toLocaleDateString("id-ID")]);
  summary.addRow([]);

  // Combined totals
  summary.addRow(["Total Budget", Number(project.totalBudget)]);
  summary.addRow(["Total Planned", totalPlanned]);
  summary.addRow(["Total Actual", totalActual]);
  summary.addRow(["Remaining", remaining]);
  summary.addRow(["Usage (%)", Number(project.totalBudget) > 0 ? ((totalActual / Number(project.totalBudget)) * 100).toFixed(1) + "%" : "0%"]);
  summary.addRow([]);

  // Per-event subtotals
  summary.addRow(["Per-Event Breakdown", ""]);
  summary.getRow(summary.rowCount).font = { bold: true, size: 12 };
  summary.addRow([]);

  events.forEach((evt) => {
    const evtPlanned = (evt.categories || []).reduce((s, c) => s + Number(c.plannedBudget), 0);
    const evtActual = (evt.categories || []).reduce((s, c) => s + Number(c.actualCost), 0);
    summary.addRow([`${evt.name} - Planned`, evtPlanned]);
    summary.addRow([`${evt.name} - Actual`, evtActual]);
    summary.addRow([]);
  });

  // Format currency cells in summary
  summary.eachRow((row) => {
    const val = row.getCell(2).value;
    if (typeof val === "number") {
      row.getCell(2).numFmt = "#,##0";
    }
    row.getCell(1).font = { ...row.getCell(1).font, bold: true };
  });

  // ---- Sheet 2: Pesta Adat ----
  const pestaAdat = events.find((e) => e.type === "PESTA_ADAT");
  if (pestaAdat) {
    addCategorySheet(workbook, "Pesta Adat", pestaAdat.categories || [], "FF2E7D32");
  }

  // ---- Sheet 3: 3M Ceremony ----
  const threeM = events.find((e) => e.type === "THREE_M");
  if (threeM) {
    addCategorySheet(workbook, "3M Ceremony", threeM.categories || [], "FF1565C0");
  }

  // ---- Sheet 4: Selected Vendors ----
  const projectVendors = project.vendors || [];
  if (projectVendors.length > 0) {
    const vendorSheet = workbook.addWorksheet("Selected Vendors");
    vendorSheet.columns = [
      { header: "No", key: "no", width: 5 },
      { header: "Vendor Name", key: "name", width: 30 },
      { header: "Type", key: "type", width: 18 },
      { header: "Estimated Cost (Rp)", key: "estimatedCost", width: 22 },
      { header: "Batak Specialist", key: "batak", width: 16 },
      { header: "Contact", key: "contact", width: 25 },
      { header: "Notes", key: "notes", width: 30 },
    ];

    const vendorHeaderRow = vendorSheet.getRow(1);
    vendorHeaderRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    vendorHeaderRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF6A1B9A" } };
    vendorHeaderRow.alignment = { horizontal: "center" };

    let vendorTotal = 0;
    projectVendors.forEach((pv, i) => {
      const v = pv.vendor;
      const est = Number(pv.estimatedCost || v.minPriceEstimate);
      vendorTotal += est;
      const row = vendorSheet.addRow({
        no: i + 1,
        name: v.name,
        type: v.type,
        estimatedCost: est,
        batak: v.isBatakSpecialist ? "Yes" : "No",
        contact: v.contactInfo || "",
        notes: pv.notes || "",
      });
      row.getCell("estimatedCost").numFmt = "#,##0";
    });

    const vendorTotalRow = vendorSheet.addRow({
      no: "", name: "TOTAL", type: "", estimatedCost: vendorTotal,
      batak: "", contact: "", notes: "",
    });
    vendorTotalRow.font = { bold: true };
    vendorTotalRow.getCell("estimatedCost").numFmt = "#,##0";

    vendorSheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" }, left: { style: "thin" },
          bottom: { style: "thin" }, right: { style: "thin" },
        };
      });
    });

    // Add vendor total to summary
    summary.addRow(["Selected Vendors Total", vendorTotal]);
    summary.getRow(summary.rowCount).getCell(2).numFmt = "#,##0";
    summary.getRow(summary.rowCount).getCell(1).font = { bold: true };
  }

  await workbook.xlsx.write(stream);
}

module.exports = { generateExcel };
