jest.mock("../../lib/prisma");
const request = require("supertest");
const app = require("../../app");
const prisma = require("../../lib/prisma");
const { authHeader } = require("../helpers/auth");
const { TEST_USER, TEST_PROJECT, TEST_EVENT, TEST_CATEGORY } = require("../helpers/fixtures");

const BASE_URL = `/api/projects/${TEST_PROJECT.id}/events/${TEST_EVENT.id}/categories`;

describe("Category Routes", () => {
  beforeEach(() => {
    // Default: project and event exist, not finalized
    prisma.weddingProject.findFirst.mockResolvedValue(TEST_PROJECT);
    prisma.event.findFirst.mockResolvedValue(TEST_EVENT);
  });

  describe("POST - create category", () => {
    it("should create a new category", async () => {
      prisma.budgetCategory.aggregate.mockResolvedValue({ _max: { sortOrder: 3 } });
      prisma.budgetCategory.create.mockResolvedValue({ ...TEST_CATEGORY, sortOrder: 4 });

      const res = await request(app)
        .post(BASE_URL)
        .set("Authorization", authHeader(TEST_USER.id))
        .send({ name: "Catering" });

      expect(res.status).toBe(201);
      expect(res.body.category.name).toBe("Catering");
    });

    it("should return 404 when project not found", async () => {
      prisma.weddingProject.findFirst.mockResolvedValue(null);

      const res = await request(app)
        .post(BASE_URL)
        .set("Authorization", authHeader(TEST_USER.id))
        .send({ name: "Test" });

      expect(res.status).toBe(404);
    });

    it("should return 404 when event not found", async () => {
      prisma.event.findFirst.mockResolvedValue(null);

      const res = await request(app)
        .post(BASE_URL)
        .set("Authorization", authHeader(TEST_USER.id))
        .send({ name: "Test" });

      expect(res.status).toBe(404);
    });

    it("should return 403 when project is finalized", async () => {
      prisma.weddingProject.findFirst.mockResolvedValue({ ...TEST_PROJECT, isFinalized: true });

      const res = await request(app)
        .post(BASE_URL)
        .set("Authorization", authHeader(TEST_USER.id))
        .send({ name: "Test" });

      expect(res.status).toBe(403);
    });

    it("should return 400 when name is missing", async () => {
      const res = await request(app)
        .post(BASE_URL)
        .set("Authorization", authHeader(TEST_USER.id))
        .send({});

      expect(res.status).toBe(400);
    });

    it("should return 400 when name exceeds 100 characters", async () => {
      const res = await request(app)
        .post(BASE_URL)
        .set("Authorization", authHeader(TEST_USER.id))
        .send({ name: "a".repeat(101) });

      expect(res.status).toBe(400);
    });
  });

  describe("PUT - update category", () => {
    it("should update a category", async () => {
      prisma.budgetCategory.findFirst.mockResolvedValue(TEST_CATEGORY);
      prisma.budgetCategory.update.mockResolvedValue({ ...TEST_CATEGORY, plannedBudget: 60000000 });

      const res = await request(app)
        .put(`${BASE_URL}/${TEST_CATEGORY.id}`)
        .set("Authorization", authHeader(TEST_USER.id))
        .send({ plannedBudget: 60000000 });

      expect(res.status).toBe(200);
      expect(res.body.category.plannedBudget).toBe(60000000);
    });

    it("should return 404 when category not found", async () => {
      prisma.budgetCategory.findFirst.mockResolvedValue(null);

      const res = await request(app)
        .put(`${BASE_URL}/nonexistent`)
        .set("Authorization", authHeader(TEST_USER.id))
        .send({ plannedBudget: 60000000 });

      expect(res.status).toBe(404);
    });
  });

  describe("DELETE - delete category", () => {
    it("should delete a category", async () => {
      prisma.budgetCategory.findFirst.mockResolvedValue(TEST_CATEGORY);
      prisma.budgetCategory.delete.mockResolvedValue(TEST_CATEGORY);

      const res = await request(app)
        .delete(`${BASE_URL}/${TEST_CATEGORY.id}`)
        .set("Authorization", authHeader(TEST_USER.id));

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Category deleted");
    });

    it("should return 404 when category not found", async () => {
      prisma.budgetCategory.findFirst.mockResolvedValue(null);

      const res = await request(app)
        .delete(`${BASE_URL}/nonexistent`)
        .set("Authorization", authHeader(TEST_USER.id));

      expect(res.status).toBe(404);
    });
  });
});
