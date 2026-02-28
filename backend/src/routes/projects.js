const express = require("express");
const prisma = require("../lib/prisma");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

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
    const { groomName, brideName, groomDomicile, brideDomicile, weddingDate, totalBudget, guestCount, eventType } = req.body;

    if (!groomName || !brideName || !groomDomicile || !brideDomicile || !weddingDate || totalBudget == null) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (!eventType || !["PESTA_ADAT", "THREE_M"].includes(eventType)) {
      return res.status(400).json({ error: "eventType must be PESTA_ADAT or THREE_M" });
    }

    const masterCategories = await prisma.masterCategory.findMany({
      where: { eventType },
      orderBy: { sortOrder: "asc" },
    });

    const eventName = eventType === "PESTA_ADAT" ? "Pesta Adat" : "3M Ceremony";
    const eventConfig = {
      name: eventName,
      type: eventType,
      categories: { create: mapCategories(masterCategories) },
    };

    const project = await prisma.weddingProject.create({
      data: {
        groomName,
        brideName,
        groomDomicile,
        brideDomicile,
        weddingDate: new Date(weddingDate),
        totalBudget,
        guestCount: guestCount || null,
        eventType,
        userId: req.userId,
        events: {
          create: [eventConfig],
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
