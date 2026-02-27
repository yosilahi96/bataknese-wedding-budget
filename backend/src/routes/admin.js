const express = require("express");
const bcrypt = require("bcryptjs");
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

const VALID_EVENT_TYPES = ["PESTA_ADAT", "THREE_M"];

// POST /api/admin/master-categories — create master category
router.post("/master-categories", authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, eventType, sortOrder } = req.body;

    if (!name || !eventType) {
      return res.status(400).json({ error: "Name and event type are required" });
    }
    if (!VALID_EVENT_TYPES.includes(eventType)) {
      return res.status(400).json({ error: "Invalid event type" });
    }

    const category = await prisma.masterCategory.create({
      data: { name, eventType, sortOrder: sortOrder || 0 },
    });

    res.status(201).json({ category });
  } catch (err) {
    console.error("Create master category error:", err);
    res.status(500).json({ error: "Failed to create master category" });
  }
});

// PUT /api/admin/master-categories/:id — update master category
router.put("/master-categories/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    const existing = await prisma.masterCategory.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: "Master category not found" });

    const { name, eventType, sortOrder } = req.body;

    if (eventType !== undefined && !VALID_EVENT_TYPES.includes(eventType)) {
      return res.status(400).json({ error: "Invalid event type" });
    }

    const category = await prisma.masterCategory.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(eventType !== undefined && { eventType }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
    });

    res.json({ category });
  } catch (err) {
    console.error("Update master category error:", err);
    res.status(500).json({ error: "Failed to update master category" });
  }
});

// DELETE /api/admin/master-categories/:id — delete master category
router.delete("/master-categories/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    const existing = await prisma.masterCategory.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: "Master category not found" });

    await prisma.masterCategory.delete({ where: { id: req.params.id } });
    res.json({ message: "Master category deleted" });
  } catch (err) {
    console.error("Delete master category error:", err);
    res.status(500).json({ error: "Failed to delete master category" });
  }
});

// ── User Management ──────────────────────────────────────

// GET /api/admin/users — list all users
router.get("/users", authenticate, requireAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        createdAt: true,
        _count: { select: { projects: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ users });
  } catch (err) {
    console.error("List users error:", err);
    res.status(500).json({ error: "Failed to list users" });
  }
});

// POST /api/admin/users — create user
router.post("/users", authenticate, requireAdmin, async (req, res) => {
  try {
    const { email, password, name, isAdmin } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: "Email, password, and name are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name, isAdmin: isAdmin || false },
      select: { id: true, email: true, name: true, isAdmin: true, createdAt: true },
    });

    res.status(201).json({ user });
  } catch (err) {
    console.error("Create user error:", err);
    res.status(500).json({ error: "Failed to create user" });
  }
});

// PUT /api/admin/users/:id — update user
router.put("/users/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: "User not found" });

    const { name, email, isAdmin } = req.body;

    if (req.params.id === req.userId && isAdmin === false) {
      return res.status(400).json({ error: "Cannot remove your own admin privileges" });
    }

    if (email !== undefined && email !== existing.email) {
      const emailTaken = await prisma.user.findUnique({ where: { email } });
      if (emailTaken) {
        return res.status(409).json({ error: "Email already in use by another account" });
      }
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
        ...(isAdmin !== undefined && { isAdmin }),
      },
      select: { id: true, email: true, name: true, isAdmin: true, createdAt: true },
    });

    res.json({ user });
  } catch (err) {
    console.error("Update user error:", err);
    res.status(500).json({ error: "Failed to update user" });
  }
});

// PUT /api/admin/users/:id/reset-password — reset password
router.put("/users/:id/reset-password", authenticate, requireAdmin, async (req, res) => {
  try {
    const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: "User not found" });

    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ error: "New password is required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { id: req.params.id },
      data: { password: hashedPassword },
    });

    res.json({ message: "Password has been reset" });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ error: "Failed to reset password" });
  }
});

// DELETE /api/admin/users/:id — delete user
router.delete("/users/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    if (req.params.id === req.userId) {
      return res.status(400).json({ error: "Cannot delete your own account" });
    }

    const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: "User not found" });

    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ message: "User deleted" });
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

module.exports = router;
