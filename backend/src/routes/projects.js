const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { authenticate } = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

const PESTA_ADAT_CATEGORIES = [
  { name: "Sinamot (Bride Price)", sortOrder: 1 },
  { name: "Ulos (Traditional Cloth)", sortOrder: 2 },
  { name: "Jambar (Ceremonial Gifts)", sortOrder: 3 },
  { name: "Gondang (Traditional Music)", sortOrder: 4 },
  { name: "Gedung (Venue)", sortOrder: 5 },
  { name: "Catering", sortOrder: 6 },
  { name: "Dokumentasi (Photo & Video)", sortOrder: 7 },
  { name: "Wedding Organizer", sortOrder: 8 },
  { name: "Transport", sortOrder: 9 },
  { name: "Souvenir", sortOrder: 10 },
  { name: "Others", sortOrder: 11 },
];

const THREE_M_CATEGORIES = [
  { name: "Marhusip venue", sortOrder: 1 },
  { name: "Martumpol church", sortOrder: 2 },
  { name: "Pasu-pasu church", sortOrder: 3 },
  { name: "Konsumsi kecil", sortOrder: 4 },
  { name: "Dokumentasi sederhana", sortOrder: 5 },
  { name: "Transport keluarga", sortOrder: 6 },
  { name: "Others", sortOrder: 7 },
];

const PROJECT_INCLUDE = {
  events: {
    include: { categories: { orderBy: { sortOrder: "asc" } } },
    orderBy: { type: "asc" },
  },
  vendors: {
    include: { vendor: true },
    orderBy: { createdAt: "desc" },
  },
};

function mapCategories(list) {
  return list.map((c) => ({ name: c.name, sortOrder: c.sortOrder, plannedBudget: 0, actualCost: 0 }));
}

// GET /api/projects — list all projects for user
router.get("/", authenticate, async (req, res) => {
  try {
    const projects = await prisma.weddingProject.findMany({
      where: { userId: req.userId },
      include: PROJECT_INCLUDE,
      orderBy: { createdAt: "desc" },
    });
    res.json({ projects });
  } catch (err) {
    console.error("List projects error:", err);
    res.status(500).json({ error: "Failed to list projects" });
  }
});

// GET /api/projects/:id — single project with events and categories
router.get("/:id", authenticate, async (req, res) => {
  try {
    const project = await prisma.weddingProject.findFirst({
      where: { id: req.params.id, userId: req.userId },
      include: PROJECT_INCLUDE,
    });
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    res.json({ project });
  } catch (err) {
    console.error("Get project error:", err);
    res.status(500).json({ error: "Failed to get project" });
  }
});

// POST /api/projects — create a new project with default events and categories
router.post("/", authenticate, async (req, res) => {
  try {
    const { groomName, brideName, groomDomicile, brideDomicile, weddingDate, totalBudget, guestCount } = req.body;

    if (!groomName || !brideName || !groomDomicile || !brideDomicile || !weddingDate || totalBudget == null) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const project = await prisma.weddingProject.create({
      data: {
        groomName,
        brideName,
        groomDomicile,
        brideDomicile,
        weddingDate: new Date(weddingDate),
        totalBudget,
        guestCount: guestCount || null,
        userId: req.userId,
        events: {
          create: [
            {
              name: "Pesta Adat",
              type: "PESTA_ADAT",
              categories: { create: mapCategories(PESTA_ADAT_CATEGORIES) },
            },
            {
              name: "3M Ceremony",
              type: "THREE_M",
              categories: { create: mapCategories(THREE_M_CATEGORIES) },
            },
          ],
        },
      },
      include: PROJECT_INCLUDE,
    });

    res.status(201).json({ project });
  } catch (err) {
    console.error("Create project error:", err);
    res.status(500).json({ error: "Failed to create project" });
  }
});

// PUT /api/projects/:id — update project details
router.put("/:id", authenticate, async (req, res) => {
  try {
    const existing = await prisma.weddingProject.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!existing) {
      return res.status(404).json({ error: "Project not found" });
    }
    if (existing.isFinalized) {
      return res.status(403).json({ error: "Project is finalized and cannot be edited" });
    }

    const { groomName, brideName, groomDomicile, brideDomicile, weddingDate, totalBudget, guestCount } = req.body;

    const project = await prisma.weddingProject.update({
      where: { id: req.params.id },
      data: {
        ...(groomName && { groomName }),
        ...(brideName && { brideName }),
        ...(groomDomicile && { groomDomicile }),
        ...(brideDomicile && { brideDomicile }),
        ...(weddingDate && { weddingDate: new Date(weddingDate) }),
        ...(totalBudget != null && { totalBudget }),
        ...(guestCount !== undefined && { guestCount: guestCount || null }),
      },
      include: PROJECT_INCLUDE,
    });

    res.json({ project });
  } catch (err) {
    console.error("Update project error:", err);
    res.status(500).json({ error: "Failed to update project" });
  }
});

// POST /api/projects/:id/finalize — lock the project
router.post("/:id/finalize", authenticate, async (req, res) => {
  try {
    const existing = await prisma.weddingProject.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!existing) {
      return res.status(404).json({ error: "Project not found" });
    }
    if (existing.isFinalized) {
      return res.status(400).json({ error: "Project is already finalized" });
    }

    const project = await prisma.weddingProject.update({
      where: { id: req.params.id },
      data: { isFinalized: true, finalizedAt: new Date() },
      include: PROJECT_INCLUDE,
    });

    res.json({ project });
  } catch (err) {
    console.error("Finalize project error:", err);
    res.status(500).json({ error: "Failed to finalize project" });
  }
});

// DELETE /api/projects/:id
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const existing = await prisma.weddingProject.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!existing) {
      return res.status(404).json({ error: "Project not found" });
    }

    await prisma.weddingProject.delete({ where: { id: req.params.id } });
    res.json({ message: "Project deleted" });
  } catch (err) {
    console.error("Delete project error:", err);
    res.status(500).json({ error: "Failed to delete project" });
  }
});

module.exports = router;
