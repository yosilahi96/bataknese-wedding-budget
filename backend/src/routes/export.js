const express = require("express");
const prisma = require("../lib/prisma");
const { authenticate } = require("../middleware/auth");
const { generatePDF } = require("../services/pdf");
const { generateExcel } = require("../services/excel");

const router = express.Router();

async function getProjectWithEvents(userId, projectId) {
  return prisma.weddingProject.findFirst({
    where: { id: projectId, userId },
    include: {
      events: {
        include: { categories: { orderBy: { sortOrder: "asc" } } },
        orderBy: { type: "asc" },
      },
      vendors: {
        include: { vendor: true },
      },
    },
  });
}

// GET /api/projects/:id/export/pdf
router.get("/:id/export/pdf", authenticate, async (req, res) => {
  try {
    const project = await getProjectWithEvents(req.userId, req.params.id);
    if (!project) return res.status(404).json({ error: "Project not found" });

    const filename = `wedding-budget-${project.groomName}-${project.brideName}.pdf`
      .replace(/\s+/g, "-")
      .toLowerCase();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    generatePDF(project, res);
  } catch (err) {
    console.error("PDF export error:", err);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
});

// GET /api/projects/:id/export/excel
router.get("/:id/export/excel", authenticate, async (req, res) => {
  try {
    const project = await getProjectWithEvents(req.userId, req.params.id);
    if (!project) return res.status(404).json({ error: "Project not found" });

    const filename = `wedding-budget-${project.groomName}-${project.brideName}.xlsx`
      .replace(/\s+/g, "-")
      .toLowerCase();

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    await generateExcel(project, res);
  } catch (err) {
    console.error("Excel export error:", err);
    res.status(500).json({ error: "Failed to generate Excel" });
  }
});

module.exports = router;
