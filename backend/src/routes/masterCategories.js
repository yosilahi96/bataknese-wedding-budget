const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { authenticate } = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/master-categories?eventType=PESTA_ADAT
router.get("/", authenticate, async (req, res) => {
  try {
    const { eventType } = req.query;
    const where = {};
    if (eventType && ["PESTA_ADAT", "THREE_M"].includes(eventType)) {
      where.eventType = eventType;
    }

    const categories = await prisma.masterCategory.findMany({
      where,
      orderBy: [{ eventType: "asc" }, { sortOrder: "asc" }],
    });

    res.json({ categories });
  } catch (err) {
    console.error("List master categories error:", err);
    res.status(500).json({ error: "Failed to list master categories" });
  }
});

module.exports = router;
