const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { authenticate } = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

async function getOwnedEvent(userId, projectId, eventId) {
  const project = await prisma.weddingProject.findFirst({
    where: { id: projectId, userId },
  });
  if (!project) return { project: null, event: null };

  const event = await prisma.event.findFirst({
    where: { id: eventId, projectId: project.id },
  });
  return { project, event };
}

// POST /api/projects/:projectId/events/:eventId/categories — add a new category
router.post("/:projectId/events/:eventId/categories", authenticate, async (req, res) => {
  try {
    const { project, event } = await getOwnedEvent(req.userId, req.params.projectId, req.params.eventId);
    if (!project) return res.status(404).json({ error: "Project not found" });
    if (!event) return res.status(404).json({ error: "Event not found" });
    if (project.isFinalized) return res.status(403).json({ error: "Project is finalized" });

    const { name, plannedBudget, actualCost, notes } = req.body;
    if (!name) return res.status(400).json({ error: "Category name is required" });
    if (name.length > 100) return res.status(400).json({ error: "Category name cannot exceed 100 characters" });

    const maxOrder = await prisma.budgetCategory.aggregate({
      where: { eventId: event.id },
      _max: { sortOrder: true },
    });

    const category = await prisma.budgetCategory.create({
      data: {
        name,
        plannedBudget: plannedBudget || 0,
        actualCost: actualCost || 0,
        notes: notes || null,
        sortOrder: (maxOrder._max.sortOrder || 0) + 1,
        eventId: event.id,
      },
    });

    res.status(201).json({ category });
  } catch (err) {
    console.error("Create category error:", err);
    res.status(500).json({ error: "Failed to create category" });
  }
});

// PUT /api/projects/:projectId/events/:eventId/categories/:id — update a category
router.put("/:projectId/events/:eventId/categories/:id", authenticate, async (req, res) => {
  try {
    const { project, event } = await getOwnedEvent(req.userId, req.params.projectId, req.params.eventId);
    if (!project) return res.status(404).json({ error: "Project not found" });
    if (!event) return res.status(404).json({ error: "Event not found" });
    if (project.isFinalized) return res.status(403).json({ error: "Project is finalized" });

    const category = await prisma.budgetCategory.findFirst({
      where: { id: req.params.id, eventId: event.id },
    });
    if (!category) return res.status(404).json({ error: "Category not found" });

    const { name, plannedBudget, actualCost, notes } = req.body;
    if (name !== undefined && name.length > 100) return res.status(400).json({ error: "Category name cannot exceed 100 characters" });

    const updated = await prisma.budgetCategory.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(plannedBudget !== undefined && { plannedBudget }),
        ...(actualCost !== undefined && { actualCost }),
        ...(notes !== undefined && { notes }),
      },
    });

    res.json({ category: updated });
  } catch (err) {
    console.error("Update category error:", err);
    res.status(500).json({ error: "Failed to update category" });
  }
});

// DELETE /api/projects/:projectId/events/:eventId/categories/:id — delete a category
router.delete("/:projectId/events/:eventId/categories/:id", authenticate, async (req, res) => {
  try {
    const { project, event } = await getOwnedEvent(req.userId, req.params.projectId, req.params.eventId);
    if (!project) return res.status(404).json({ error: "Project not found" });
    if (!event) return res.status(404).json({ error: "Event not found" });
    if (project.isFinalized) return res.status(403).json({ error: "Project is finalized" });

    const category = await prisma.budgetCategory.findFirst({
      where: { id: req.params.id, eventId: event.id },
    });
    if (!category) return res.status(404).json({ error: "Category not found" });

    await prisma.budgetCategory.delete({ where: { id: req.params.id } });
    res.json({ message: "Category deleted" });
  } catch (err) {
    console.error("Delete category error:", err);
    res.status(500).json({ error: "Failed to delete category" });
  }
});

module.exports = router;
