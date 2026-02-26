const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { authenticate } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/admin");

const router = express.Router();
const prisma = new PrismaClient();

const VALID_TYPES = ["VENUE", "CATERING", "ATTIRE", "GONDANG", "WO", "DOCUMENTATION", "CHURCH"];

// POST /api/admin/vendors — create vendor
router.post("/vendors", authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, type, location, minPriceEstimate, maxPriceEstimate, capacity,
            description, contactInfo, isBatakSpecialist } = req.body;

    if (!name || !type || !location || minPriceEstimate == null || maxPriceEstimate == null) {
      return res.status(400).json({ error: "Name, type, location, and price estimates are required" });
    }
    if (!VALID_TYPES.includes(type)) {
      return res.status(400).json({ error: "Invalid vendor type" });
    }

    const vendor = await prisma.vendor.create({
      data: {
        name, type, location,
        minPriceEstimate, maxPriceEstimate,
        capacity: capacity || null,
        description: description || null,
        contactInfo: contactInfo || null,
        isBatakSpecialist: isBatakSpecialist || false,
      },
    });

    res.status(201).json({ vendor });
  } catch (err) {
    console.error("Create vendor error:", err);
    res.status(500).json({ error: "Failed to create vendor" });
  }
});

// PUT /api/admin/vendors/:id — update vendor
router.put("/vendors/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    const existing = await prisma.vendor.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: "Vendor not found" });

    const { name, type, location, minPriceEstimate, maxPriceEstimate, capacity,
            description, contactInfo, isBatakSpecialist } = req.body;

    if (type !== undefined && !VALID_TYPES.includes(type)) {
      return res.status(400).json({ error: "Invalid vendor type" });
    }

    const vendor = await prisma.vendor.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(type !== undefined && { type }),
        ...(location !== undefined && { location }),
        ...(minPriceEstimate !== undefined && { minPriceEstimate }),
        ...(maxPriceEstimate !== undefined && { maxPriceEstimate }),
        ...(capacity !== undefined && { capacity }),
        ...(description !== undefined && { description }),
        ...(contactInfo !== undefined && { contactInfo }),
        ...(isBatakSpecialist !== undefined && { isBatakSpecialist }),
      },
    });

    res.json({ vendor });
  } catch (err) {
    console.error("Update vendor error:", err);
    res.status(500).json({ error: "Failed to update vendor" });
  }
});

// DELETE /api/admin/vendors/:id — delete vendor
router.delete("/vendors/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    const existing = await prisma.vendor.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: "Vendor not found" });

    await prisma.vendor.delete({ where: { id: req.params.id } });
    res.json({ message: "Vendor deleted" });
  } catch (err) {
    console.error("Delete vendor error:", err);
    res.status(500).json({ error: "Failed to delete vendor" });
  }
});

module.exports = router;
