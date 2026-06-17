jest.mock("../../lib/prisma");
const request = require("supertest");
const app = require("../../app");
const prisma = require("../../lib/prisma");
const { authHeader } = require("../helpers/auth");
const { TEST_USER, TEST_PROJECT } = require("../helpers/fixtures");

const PROJECT_WITH_INCLUDE = {
  ...TEST_PROJECT,
  events: [{ id: "event-1", name: "Pesta Adat", type: "PESTA_ADAT", categories: [] }],
  vendors: [],
};

function dateInputDaysFromNow(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

describe("Project Routes", () => {
  describe("GET /api/projects", () => {
    it("should list projects for authenticated user", async () => {
      prisma.weddingProject.findMany.mockResolvedValue([PROJECT_WITH_INCLUDE]);

      const res = await request(app)
        .get("/api/projects")
        .set("Authorization", authHeader(TEST_USER.id));

      expect(res.status).toBe(200);
      expect(res.body.projects).toHaveLength(1);
    });

    it("should return 401 without token", async () => {
      const res = await request(app).get("/api/projects");
      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/projects/:id", () => {
    it("should return a single project", async () => {
      prisma.weddingProject.findFirst.mockResolvedValue(PROJECT_WITH_INCLUDE);

      const res = await request(app)
        .get(`/api/projects/${TEST_PROJECT.id}`)
        .set("Authorization", authHeader(TEST_USER.id));

      expect(res.status).toBe(200);
      expect(res.body.project.groomName).toBe("Budi");
    });

    it("should return 404 when project not found", async () => {
      prisma.weddingProject.findFirst.mockResolvedValue(null);

      const res = await request(app)
        .get("/api/projects/nonexistent")
        .set("Authorization", authHeader(TEST_USER.id));

      expect(res.status).toBe(404);
    });
  });

  describe("POST /api/projects", () => {
    it("should create a new project", async () => {
      prisma.masterCategory.findMany.mockResolvedValue([
        { name: "Catering", sortOrder: 1 },
      ]);
      prisma.weddingProject.create.mockResolvedValue(PROJECT_WITH_INCLUDE);

      const res = await request(app)
        .post("/api/projects")
        .set("Authorization", authHeader(TEST_USER.id))
        .send({
          groomName: "Budi",
          brideName: "Sari",
          groomDomicile: "Jakarta",
          brideDomicile: "Medan",
          weddingDate: dateInputDaysFromNow(30),
          totalBudget: 100000000,
          eventType: "PESTA_ADAT",
        });

      expect(res.status).toBe(201);
      expect(res.body.project).toBeDefined();
    });

    it("should return 400 when required fields are missing", async () => {
      const res = await request(app)
        .post("/api/projects")
        .set("Authorization", authHeader(TEST_USER.id))
        .send({ groomName: "Budi" });

      expect(res.status).toBe(400);
    });

    it("should return 400 for invalid eventType", async () => {
      const res = await request(app)
        .post("/api/projects")
        .set("Authorization", authHeader(TEST_USER.id))
        .send({
          groomName: "Budi",
          brideName: "Sari",
          groomDomicile: "Jakarta",
          brideDomicile: "Medan",
          weddingDate: dateInputDaysFromNow(30),
          totalBudget: 100000000,
          eventType: "INVALID",
        });

      expect(res.status).toBe(400);
    });

    it("should return 400 when weddingDate is not in the future", async () => {
      const res = await request(app)
        .post("/api/projects")
        .set("Authorization", authHeader(TEST_USER.id))
        .send({
          groomName: "Budi",
          brideName: "Sari",
          groomDomicile: "Jakarta",
          brideDomicile: "Medan",
          weddingDate: dateInputDaysFromNow(-1),
          totalBudget: 100000000,
          eventType: "PESTA_ADAT",
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Wedding date must be a future date");
    });
  });

  describe("PUT /api/projects/:id", () => {
    it("should update project details", async () => {
      prisma.weddingProject.findFirst.mockResolvedValue(TEST_PROJECT);
      prisma.weddingProject.update.mockResolvedValue({
        ...PROJECT_WITH_INCLUDE,
        groomName: "Updated",
      });

      const res = await request(app)
        .put(`/api/projects/${TEST_PROJECT.id}`)
        .set("Authorization", authHeader(TEST_USER.id))
        .send({ groomName: "Updated" });

      expect(res.status).toBe(200);
      expect(res.body.project.groomName).toBe("Updated");
    });

    it("should return 404 when project not found", async () => {
      prisma.weddingProject.findFirst.mockResolvedValue(null);

      const res = await request(app)
        .put("/api/projects/nonexistent")
        .set("Authorization", authHeader(TEST_USER.id))
        .send({ groomName: "Updated" });

      expect(res.status).toBe(404);
    });

    it("should return 403 when project is finalized", async () => {
      prisma.weddingProject.findFirst.mockResolvedValue({ ...TEST_PROJECT, isFinalized: true });

      const res = await request(app)
        .put(`/api/projects/${TEST_PROJECT.id}`)
        .set("Authorization", authHeader(TEST_USER.id))
        .send({ groomName: "Updated" });

      expect(res.status).toBe(403);
    });

    it("should return 400 when updating weddingDate to today or a past date", async () => {
      prisma.weddingProject.findFirst.mockResolvedValue(TEST_PROJECT);

      const res = await request(app)
        .put(`/api/projects/${TEST_PROJECT.id}`)
        .set("Authorization", authHeader(TEST_USER.id))
        .send({ weddingDate: dateInputDaysFromNow(0) });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Wedding date must be a future date");
    });
  });

  describe("POST /api/projects/:id/finalize", () => {
    it("should finalize a project", async () => {
      prisma.weddingProject.findFirst.mockResolvedValue(TEST_PROJECT);
      prisma.weddingProject.update.mockResolvedValue({
        ...PROJECT_WITH_INCLUDE,
        isFinalized: true,
      });

      const res = await request(app)
        .post(`/api/projects/${TEST_PROJECT.id}/finalize`)
        .set("Authorization", authHeader(TEST_USER.id));

      expect(res.status).toBe(200);
      expect(res.body.project.isFinalized).toBe(true);
    });

    it("should return 404 when project not found", async () => {
      prisma.weddingProject.findFirst.mockResolvedValue(null);

      const res = await request(app)
        .post("/api/projects/nonexistent/finalize")
        .set("Authorization", authHeader(TEST_USER.id));

      expect(res.status).toBe(404);
    });

    it("should return 400 when already finalized", async () => {
      prisma.weddingProject.findFirst.mockResolvedValue({ ...TEST_PROJECT, isFinalized: true });

      const res = await request(app)
        .post(`/api/projects/${TEST_PROJECT.id}/finalize`)
        .set("Authorization", authHeader(TEST_USER.id));

      expect(res.status).toBe(400);
    });
  });

  describe("DELETE /api/projects/:id", () => {
    it("should delete a project", async () => {
      prisma.weddingProject.findFirst.mockResolvedValue(TEST_PROJECT);
      prisma.weddingProject.delete.mockResolvedValue(TEST_PROJECT);

      const res = await request(app)
        .delete(`/api/projects/${TEST_PROJECT.id}`)
        .set("Authorization", authHeader(TEST_USER.id));

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Project deleted");
    });

    it("should return 404 when project not found", async () => {
      prisma.weddingProject.findFirst.mockResolvedValue(null);

      const res = await request(app)
        .delete("/api/projects/nonexistent")
        .set("Authorization", authHeader(TEST_USER.id));

      expect(res.status).toBe(404);
    });
  });
});
