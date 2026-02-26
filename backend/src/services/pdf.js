const PDFDocument = require("pdfkit");

function formatRupiah(amount) {
  return "Rp " + Number(amount).toLocaleString("id-ID");
}

function renderCategoryTable(doc, categories) {
  const col1 = 50;
  const col2 = 220;
  const col3 = 330;
  const col4 = 440;

  // Table header
  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown(0.3);

  const tableTop = doc.y;
  doc.fontSize(10).font("Helvetica-Bold");
  doc.text("Category", col1, tableTop, { width: 160 });
  doc.text("Planned", col2, tableTop, { width: 100, align: "right" });
  doc.text("Actual", col3, tableTop, { width: 100, align: "right" });
  doc.text("Diff", col4, tableTop, { width: 100, align: "right" });
  doc.moveDown(0.5);

  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown(0.3);

  // Table rows
  doc.fontSize(9).font("Helvetica");
  let subtotalPlanned = 0;
  let subtotalActual = 0;

  categories.forEach((cat) => {
    const planned = Number(cat.plannedBudget);
    const actual = Number(cat.actualCost);
    const diff = planned - actual;
    subtotalPlanned += planned;
    subtotalActual += actual;

    if (doc.y > 700) doc.addPage();

    const rowY = doc.y;
    doc.text(cat.name, col1, rowY, { width: 160 });
    doc.text(formatRupiah(planned), col2, rowY, { width: 100, align: "right" });
    doc.text(formatRupiah(actual), col3, rowY, { width: 100, align: "right" });
    doc.text((diff >= 0 ? "+" : "") + formatRupiah(diff), col4, rowY, { width: 100, align: "right" });

    if (cat.notes) {
      doc.moveDown(0.2);
      doc.fontSize(8).fillColor("#666666").text(`  Note: ${cat.notes}`, col1);
      doc.fillColor("#000000").fontSize(9);
    }

    doc.moveDown(0.5);
  });

  // Subtotal row
  doc.moveDown(0.3);
  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown(0.3);

  const totalY = doc.y;
  doc.fontSize(10).font("Helvetica-Bold");
  doc.text("Subtotal", col1, totalY, { width: 160 });
  doc.text(formatRupiah(subtotalPlanned), col2, totalY, { width: 100, align: "right" });
  doc.text(formatRupiah(subtotalActual), col3, totalY, { width: 100, align: "right" });
  doc.moveDown(1);
}

function generatePDF(project, stream) {
  const doc = new PDFDocument({ margin: 50, size: "A4" });
  doc.pipe(stream);

  const events = project.events || [];
  const allCategories = events.flatMap((e) => e.categories || []);
  const totalPlanned = allCategories.reduce((s, c) => s + Number(c.plannedBudget), 0);
  const totalActual = allCategories.reduce((s, c) => s + Number(c.actualCost), 0);
  const remaining = Number(project.totalBudget) - totalActual;

  // Header
  doc.fontSize(20).font("Helvetica-Bold").text("Bataknese Wedding Budget Report", { align: "center" });
  doc.moveDown(0.3);
  doc.fontSize(12).font("Helvetica").text("Jakarta Edition", { align: "center" });
  doc.moveDown(1);

  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown(0.5);

  // Couple Info
  doc.fontSize(12).font("Helvetica-Bold").text("Wedding Details");
  doc.moveDown(0.3);
  doc.fontSize(10).font("Helvetica");
  doc.text(`Groom: ${project.groomName} (${project.groomDomicile})`);
  doc.text(`Bride: ${project.brideName} (${project.brideDomicile})`);
  doc.text(`Wedding Date: ${new Date(project.weddingDate).toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`);
  if (project.finalizedAt) {
    doc.text(`Finalized: ${new Date(project.finalizedAt).toLocaleDateString("id-ID")}`);
  }
  doc.moveDown(1);

  // Combined Budget Summary
  doc.fontSize(12).font("Helvetica-Bold").text("Budget Summary");
  doc.moveDown(0.3);
  doc.fontSize(10).font("Helvetica");
  doc.text(`Total Budget: ${formatRupiah(project.totalBudget)}`);
  doc.text(`Total Planned: ${formatRupiah(totalPlanned)}`);
  doc.text(`Total Actual: ${formatRupiah(totalActual)}`);
  doc.text(`Remaining: ${formatRupiah(remaining)}`);
  doc.text(`Usage: ${Number(project.totalBudget) > 0 ? ((totalActual / Number(project.totalBudget)) * 100).toFixed(1) : 0}%`);

  // Per-event summary
  events.forEach((evt) => {
    const evtPlanned = (evt.categories || []).reduce((s, c) => s + Number(c.plannedBudget), 0);
    const evtActual = (evt.categories || []).reduce((s, c) => s + Number(c.actualCost), 0);
    doc.text(`  ${evt.name}: Planned ${formatRupiah(evtPlanned)} | Actual ${formatRupiah(evtActual)}`);
  });
  doc.moveDown(1.5);

  // Event Sections
  events.forEach((evt, i) => {
    if (doc.y > 500) doc.addPage();

    doc.fontSize(14).font("Helvetica-Bold").text(`Section ${i + 1}: ${evt.name}`);
    doc.moveDown(0.5);

    renderCategoryTable(doc, evt.categories || []);
  });

  // Grand Total
  if (doc.y > 650) doc.addPage();
  doc.moveDown(0.5);
  doc.fontSize(12).font("Helvetica-Bold").text("Grand Total");
  doc.moveDown(0.3);
  doc.fontSize(10).font("Helvetica");
  doc.text(`Total Planned: ${formatRupiah(totalPlanned)}`);
  doc.text(`Total Actual: ${formatRupiah(totalActual)}`);
  doc.text(`Remaining Budget: ${formatRupiah(remaining)}`);

  // Selected Vendors section
  const projectVendors = project.vendors || [];
  if (projectVendors.length > 0) {
    if (doc.y > 500) doc.addPage();
    doc.moveDown(1);
    doc.fontSize(14).font("Helvetica-Bold").fillColor("#000000").text("Selected Vendors & Estimated Cost");
    doc.moveDown(0.5);

    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.3);
    const vTop = doc.y;
    doc.fontSize(9).font("Helvetica-Bold");
    doc.text("Vendor", 50, vTop, { width: 160 });
    doc.text("Type", 215, vTop, { width: 80 });
    doc.text("Est. Cost", 300, vTop, { width: 100, align: "right" });
    doc.text("Batak?", 405, vTop, { width: 50, align: "center" });
    doc.text("Contact", 460, vTop, { width: 85 });
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.3);

    doc.fontSize(8).font("Helvetica");
    let vendorTotal = 0;

    projectVendors.forEach((pv) => {
      const v = pv.vendor;
      const est = Number(pv.estimatedCost || v.minPriceEstimate);
      vendorTotal += est;

      if (doc.y > 700) doc.addPage();
      const rowY = doc.y;
      doc.text(v.name, 50, rowY, { width: 160 });
      doc.text(v.type, 215, rowY, { width: 80 });
      doc.text(formatRupiah(est), 300, rowY, { width: 100, align: "right" });
      doc.text(v.isBatakSpecialist ? "Yes" : "No", 405, rowY, { width: 50, align: "center" });
      doc.text(v.contactInfo || "-", 460, rowY, { width: 85 });
      doc.moveDown(0.5);
    });

    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.3);
    doc.fontSize(10).font("Helvetica-Bold");
    doc.text(`Total Vendor Estimated Cost: ${formatRupiah(vendorTotal)}`);
    doc.moveDown(0.3);
    doc.fontSize(9).font("Helvetica");
    const budgetNum = Number(project.totalBudget);
    doc.text(`vs Total Budget: ${formatRupiah(budgetNum)} (${budgetNum > 0 ? ((vendorTotal / budgetNum) * 100).toFixed(1) : 0}%)`);
  }

  // Footer
  doc.moveDown(2);
  doc.fontSize(8).font("Helvetica").fillColor("#999999");
  doc.text("Generated by Bataknese Wedding Budget Tracker - Jakarta Edition", { align: "center" });
  doc.text(`Report generated on ${new Date().toLocaleDateString("id-ID")}`, { align: "center" });

  doc.end();
}

module.exports = { generatePDF };
