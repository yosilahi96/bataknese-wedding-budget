jest.mock("../../lib/prisma");
const request = require("supertest");
const app = require("../../app");
const prisma = require("../../lib/prisma");
const { authHeader } = require("../helpers/auth");
const { TEST_USER, TEST_PROJECT, TEST_VENDOR, TEST_VENDOR_TYPE, TEST_PROJECT_VENDOR } = require("../helpers/fixtures");

describe("Project Vendor Routes", () => {
  describe("GET /api/projects/:projectId/vendors", () => {
    it("should list project vendors", async () => {
      prisma.weddingProject.findFirst.mockResolvedValue(TEST_PROJECT);
      prisma.projectVendor.findMany.mockResolvedValue([
        { ...TEST_PROJECT_VENDOR, vendor: TEST_VENDOR },
      ]);

      const res = await request(app)
        .get(`/api/projects/${TEST_PROJECT.id}/vendors`)
        .set("Authorization", authHeader(TEST_USER.id));

      expect(res.status).toBe(200);
      expect(res.body.projectVendors).toHaveLength(1);
    });

    it("should return 404 when project not found", async () => {
      prisma.weddingProject.findFirst.mockResolvedValue(null);

      const res = await request(app)
        .get("/api/projects/nonexistent/vendors")
        .set("Authorization", authHeader(TEST_USER.id));

      expect(res.status).toBe(404);
    });
  });

  describe("POST /api/projects/:projectId/vendors", () => {
    it("should add vendor to project", async () => {
      prisma.weddingProject.findFirst.mockResolvedValue(TEST_PROJECT);
      prisma.vendor.findUnique.mockResolvedValue(TEST_VENDOR);
      prisma.projectVendor.findUnique.mockResolvedValue(null);
      prisma.projectVendor.create.mockResolvedValue({
        ...TEST_PROJECT_VENDOR,
        vendor: TEST_VENDOR,
      });

      const res = await request(app)
        .post(`/api/projects/${TEST_PROJECT.id}/vendors`)
        .set("Authorization", authHeader(TEST_USER.id))
        .send({ vendorId: TEST_VENDOR.id });

      expect(res.status).toBe(201);
      expect(res.body.projectVendor.vendor.name).toBe(TEST_VENDOR.name);
    });

    it("should return 400 when vendorId is missing", async () => {
      prisma.weddingProject.findFirst.mockResolvedValue(TEST_PROJECT);

      const res = await request(app)
        .post(`/api/projects/${TEST_PROJECT.id}/vendors`)
        .set("Authorization", authHeader(TEST_USER.id))
        .send({});

      expect(res.status).toBe(400);
    });

    it("should return 409 when vendor already added", async () => {
      prisma.weddingProject.findFirst.mockResolvedValue(TEST_PROJECT);
      prisma.vendor.findUnique.mockResolvedValue(TEST_VENDOR);
      prisma.projectVendor.findUnique.mockResolvedValue(TEST_PROJECT_VENDOR);

      const res = await request(app)
        .post(`/api/projects/${TEST_PROJECT.id}/vendors`)
        .set("Authorization", authHeader(TEST_USER.id))
        .send({ vendorId: TEST_VENDOR.id });

      expect(res.status).toBe(409);
    });

    it("should return 403 when project is finalized", async () => {
      prisma.weddingProject.findFirst.mockResolvedValue({ ...TEST_PROJECT, isFinalized: true });

      const res = await request(app)
        .post(`/api/projects/${TEST_PROJECT.id}/vendors`)
        .set("Authorization", authHeader(TEST_USER.id))
        .send({ vendorId: TEST_VENDOR.id });

      expect(res.status).toBe(403);
    });
  });

  describe("DELETE /api/projects/:projectId/vendors/:vendorId", () => {
    it("should remove vendor from project", async () => {
      prisma.weddingProject.findFirst.mockResolvedValue(TEST_PROJECT);
      prisma.projectVendor.findUnique.mockResolvedValue(TEST_PROJECT_VENDOR);
      prisma.vendor.findUnique.mockResolvedValue(TEST_VENDOR);
      prisma.vendorTypeMaster.findUnique.mockResolvedValue(TEST_VENDOR_TYPE);
      prisma.projectVendor.delete.mockResolvedValue(TEST_PROJECT_VENDOR);
      // Mock the cascade reset
      prisma.weddingProject.findFirst.mockResolvedValue({
        ...TEST_PROJECT,
        events: [{
          id: "event-1",
          categories: [{ id: "cat-1", name: "Catering" }],
        }],
      });
      prisma.budgetCategory.update.mockResolvedValue({ id: "cat-1", plannedBudget: 0, notes: null });

      const res = await request(app)
        .delete(`/api/projects/${TEST_PROJECT.id}/vendors/${TEST_VENDOR.id}`)
        .set("Authorization", authHeader(TEST_USER.id));

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Vendor removed from project");
    });

    it("should return 404 when vendor not in project", async () => {
      prisma.weddingProject.findFirst.mockResolvedValue(TEST_PROJECT);
      prisma.projectVendor.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .delete(`/api/projects/${TEST_PROJECT.id}/vendors/nonexistent`)
        .set("Authorization", authHeader(TEST_USER.id));

      expect(res.status).toBe(404);
    });
  });

  describe("POST /api/projects/:projectId/vendors/:vendorId/add-to-budget", () => {
    it("should add vendor to budget category", async () => {
      prisma.weddingProject.findFirst.mockResolvedValue({
        ...TEST_PROJECT,
        events: [{
          id: "event-1",
          name: "Pesta Adat",
          categories: [{ id: "cat-1", name: "Catering", sortOrder: 1 }],
        }],
      });
      prisma.vendor.findUnique.mockResolvedValue(TEST_VENDOR);
      prisma.vendorTypeMaster.findUnique.mockResolvedValue(TEST_VENDOR_TYPE);
      prisma.budgetCategory.update.mockResolvedValue({
        id: "cat-1",
        name: "Catering",
        plannedBudget: 55000,
      });

      const res = await request(app)
        .post(`/api/projects/${TEST_PROJECT.id}/vendors/${TEST_VENDOR.id}/add-to-budget`)
        .set("Authorization", authHeader(TEST_USER.id))
        .send({ estimatedCost: 55000 });

      expect(res.status).toBe(200);
      expect(res.body.category).toBeDefined();
    });

    it("should return 404 when project not found", async () => {
      prisma.weddingProject.findFirst.mockResolvedValue(null);

      const res = await request(app)
        .post(`/api/projects/nonexistent/vendors/${TEST_VENDOR.id}/add-to-budget`)
        .set("Authorization", authHeader(TEST_USER.id))
        .send({});

      expect(res.status).toBe(404);
    });

    it("should return 400 when no category mapping exists", async () => {
      prisma.weddingProject.findFirst.mockResolvedValue({
        ...TEST_PROJECT,
        events: [{ id: "event-1", name: "Pesta Adat", categories: [] }],
      });
      prisma.vendor.findUnique.mockResolvedValue(TEST_VENDOR);
      prisma.vendorTypeMaster.findUnique.mockResolvedValue({ ...TEST_VENDOR_TYPE, defaultCategoryName: null });

      const res = await request(app)
        .post(`/api/projects/${TEST_PROJECT.id}/vendors/${TEST_VENDOR.id}/add-to-budget`)
        .set("Authorization", authHeader(TEST_USER.id))
        .send({});

      expect(res.status).toBe(400);
    });
  });
});
