const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { authenticate } = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/vendors — list vendors with optional filters
router.get("/", authenticate, async (req, res) => {
  try {
    const { type, minPrice, maxPrice, minCapacity, isBatakSpecialist, sortBy } = req.query;

    const where = {};
    if (type) where.type = type;
    if (minCapacity) where.capacity = { gte: Number(minCapacity) };
    if (isBatakSpecialist === "true") where.isBatakSpecialist = true;
    if (maxPrice) {
      where.minPriceEstimate = { lte: Number(maxPrice) };
    }
    if (minPrice) {
      where.maxPriceEstimate = { gte: Number(minPrice) };
    }

    let orderBy = { name: "asc" };
    if (sortBy === "price_asc") orderBy = { minPriceEstimate: "asc" };
    if (sortBy === "price_desc") orderBy = { maxPriceEstimate: "desc" };
    if (sortBy === "name") orderBy = { name: "asc" };

    const vendors = await prisma.vendor.findMany({ where, orderBy });
    res.json({ vendors });
  } catch (err) {
    console.error("List vendors error:", err);
    res.status(500).json({ error: "Failed to list vendors" });
  }
});

// GET /api/vendors/recommend/:projectId — smart recommendation
router.get("/recommend/:projectId", authenticate, async (req, res) => {
  try {
    const project = await prisma.weddingProject.findFirst({
      where: { id: req.params.projectId, userId: req.userId },
    });
    if (!project) return res.status(404).json({ error: "Project not found" });

    const guestCount = project.guestCount || 0;

    const vendorTypes = ["VENUE", "CATERING", "ATTIRE", "GONDANG", "WO", "DOCUMENTATION", "CHURCH"];
    const recommendations = {};

    for (const type of vendorTypes) {
      const where = { type };
      if (guestCount > 0 && ["VENUE", "CATERING"].includes(type)) {
        where.capacity = { gte: guestCount };
      }

      const vendors = await prisma.vendor.findMany({
        where,
        orderBy: [
          { isBatakSpecialist: "desc" },
          { minPriceEstimate: "asc" },
        ],
        take: 5,
      });

      recommendations[type] = vendors;
    }

    res.json({ recommendations, projectGuestCount: guestCount, projectBudget: project.totalBudget });
  } catch (err) {
    console.error("Recommend vendors error:", err);
    res.status(500).json({ error: "Failed to get recommendations" });
  }
});

// GET /api/vendors/:id — single vendor
router.get("/:id", authenticate, async (req, res) => {
  try {
    const vendor = await prisma.vendor.findUnique({ where: { id: req.params.id } });
    if (!vendor) return res.status(404).json({ error: "Vendor not found" });
    res.json({ vendor });
  } catch (err) {
    console.error("Get vendor error:", err);
    res.status(500).json({ error: "Failed to get vendor" });
  }
});

module.exports = router;
