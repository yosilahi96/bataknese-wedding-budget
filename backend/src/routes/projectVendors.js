const express = require("express");
const prisma = require("../lib/prisma");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

async function getVendorTypeMapping(typeCode) {
  const vtm = await prisma.vendorTypeMaster.findUnique({ where: { code: typeCode } });
  if (!vtm || !vtm.defaultCategoryName) return null;
  return { categoryName: vtm.defaultCategoryName, isPricePerPax: vtm.isPricePerPax };
}

async function getOwnedProject(userId, projectId) {
  return prisma.weddingProject.findFirst({
    where: { id: projectId, userId },
  });
}

// GET /api/projects/:projectId/vendors
router.get("/:projectId/vendors", authenticate, async (req, res) => {
  try {
    const project = await getOwnedProject(req.userId, req.params.projectId);
    if (!project) return res.status(404).json({ error: "Project not found" });

    const projectVendors = await prisma.projectVendor.findMany({
      where: { projectId: project.id },
      include: { vendor: true },
      orderBy: { createdAt: "desc" },
    });

    res.json({ projectVendors });
  } catch (err) {
    console.error("List project vendors error:", err);
    res.status(500).json({ error: "Failed to list project vendors" });
  }
});

// POST /api/projects/:projectId/vendors
router.post("/:projectId/vendors", authenticate, async (req, res) => {
  try {
    const project = await getOwnedProject(req.userId, req.params.projectId);
    if (!project) return res.status(404).json({ error: "Project not found" });
    if (project.isFinalized) return res.status(403).json({ error: "Project is finalized" });

    const { vendorId, notes, estimatedCost } = req.body;
    if (!vendorId) return res.status(400).json({ error: "Vendor ID is required" });

    const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
    if (!vendor) return res.status(404).json({ error: "Vendor not found" });

    const existing = await prisma.projectVendor.findUnique({
      where: { projectId_vendorId: { projectId: project.id, vendorId } },
    });
    if (existing) return res.status(409).json({ error: "Vendor already added to this project" });

    const projectVendor = await prisma.projectVendor.create({
      data: {
        projectId: project.id,
        vendorId,
        notes: notes || null,
        estimatedCost: estimatedCost || null,
      },
      include: { vendor: true },
    });

    res.status(201).json({ projectVendor });
  } catch (err) {
    console.error("Add project vendor error:", err);
    res.status(500).json({ error: "Failed to add vendor to project" });
  }
});

// DELETE /api/projects/:projectId/vendors/:vendorId
router.delete("/:projectId/vendors/:vendorId", authenticate, async (req, res) => {
  try {
    const project = await getOwnedProject(req.userId, req.params.projectId);
    if (!project) return res.status(404).json({ error: "Project not found" });
    if (project.isFinalized) return res.status(403).json({ error: "Project is finalized" });

    const projectVendor = await prisma.projectVendor.findUnique({
      where: { projectId_vendorId: { projectId: project.id, vendorId: req.params.vendorId } },
    });
    if (!projectVendor) return res.status(404).json({ error: "Vendor not found in project" });

    // Look up the vendor to find its type → category mapping
    const vendor = await prisma.vendor.findUnique({ where: { id: req.params.vendorId } });
    const mapping = vendor ? await getVendorTypeMapping(vendor.type) : null;

    // Remove the project vendor
    await prisma.projectVendor.delete({ where: { id: projectVendor.id } });

    // Reset the corresponding budget category (set plannedBudget to 0 and clear vendor notes)
    let updatedCategory = null;
    if (mapping) {
      const projectWithEvents = await prisma.weddingProject.findFirst({
        where: { id: project.id },
        include: { events: { include: { categories: true } } },
      });
      const targetEvent = projectWithEvents?.events[0];
      if (targetEvent) {
        const category = targetEvent.categories.find((c) => c.name === mapping.categoryName);
        if (category) {
          updatedCategory = await prisma.budgetCategory.update({
            where: { id: category.id },
            data: { plannedBudget: 0, notes: null },
          });
        }
      }
    }

    res.json({ message: "Vendor removed from project", updatedCategory });
  } catch (err) {
    console.error("Remove project vendor error:", err);
    res.status(500).json({ error: "Failed to remove vendor from project" });
  }
});

// POST /api/projects/:projectId/vendors/:vendorId/add-to-budget
router.post("/:projectId/vendors/:vendorId/add-to-budget", authenticate, async (req, res) => {
  try {
    const project = await prisma.weddingProject.findFirst({
      where: { id: req.params.projectId, userId: req.userId },
      include: { events: { include: { categories: true } } },
    });
    if (!project) return res.status(404).json({ error: "Project not found" });
    if (project.isFinalized) return res.status(403).json({ error: "Project is finalized" });

    const vendor = await prisma.vendor.findUnique({ where: { id: req.params.vendorId } });
    if (!vendor) return res.status(404).json({ error: "Vendor not found" });

    const mapping = await getVendorTypeMapping(vendor.type);
    if (!mapping) return res.status(400).json({ error: "No category mapping for this vendor type" });

    const targetEvent = project.events[0];
    if (!targetEvent) return res.status(400).json({ error: "No event found in this project" });

    const { estimatedCost } = req.body;
    const cost = estimatedCost || Number(vendor.minPriceEstimate);

    const existingCategory = targetEvent.categories.find((c) => c.name === mapping.categoryName);

    let category;
    if (existingCategory) {
      category = await prisma.budgetCategory.update({
        where: { id: existingCategory.id },
        data: {
          plannedBudget: cost,
          notes: `Vendor: ${vendor.name} (${vendor.contactInfo || "N/A"})`,
        },
      });
    } else {
      const maxOrder = await prisma.budgetCategory.aggregate({
        where: { eventId: targetEvent.id },
        _max: { sortOrder: true },
      });
      category = await prisma.budgetCategory.create({
        data: {
          name: mapping.categoryName,
          plannedBudget: cost,
          actualCost: 0,
          notes: `Vendor: ${vendor.name} (${vendor.contactInfo || "N/A"})`,
          sortOrder: (maxOrder._max.sortOrder || 0) + 1,
          eventId: targetEvent.id,
        },
      });
    }

    res.json({ category, event: targetEvent.name });
  } catch (err) {
    console.error("Add to budget error:", err);
    res.status(500).json({ error: "Failed to add vendor to budget" });
  }
});

module.exports = router;
