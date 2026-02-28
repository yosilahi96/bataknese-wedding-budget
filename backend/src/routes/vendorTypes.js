const express = require("express");
const prisma = require("../lib/prisma");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

// GET /api/vendor-types — list all vendor types
router.get("/", authenticate, async (req, res) => {
  try {
    const vendorTypes = await prisma.vendorTypeMaster.findMany({
      orderBy: { sortOrder: "asc" },
    });
    res.json({ vendorTypes });
  } catch (err) {
    console.error("List vendor types error:", err);
    res.status(500).json({ error: "Failed to list vendor types" });
  }
});

module.exports = router;
