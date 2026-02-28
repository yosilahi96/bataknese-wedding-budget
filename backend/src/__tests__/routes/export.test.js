jest.mock("../../lib/prisma");
jest.mock("../../services/pdf");
jest.mock("../../services/excel");
const request = require("supertest");
const app = require("../../app");
const prisma = require("../../lib/prisma");
const { generatePDF } = require("../../services/pdf");
const { generateExcel } = require("../../services/excel");
const { authHeader } = require("../helpers/auth");
const { TEST_USER, TEST_PROJECT } = require("../helpers/fixtures");

const PROJECT_WITH_EVENTS = {
  ...TEST_PROJECT,
  events: [{ id: "event-1", name: "Pesta Adat", categories: [] }],
  vendors: [],
};

describe("Export Routes", () => {
  describe("GET /api/projects/:id/export/pdf", () => {
    it("should generate PDF for existing project", async () => {
      prisma.weddingProject.findFirst.mockResolvedValue(PROJECT_WITH_EVENTS);
      generatePDF.mockImplementation((_project, res) => {
        res.end("pdf-data");
      });

      const res = await request(app)
        .get(`/api/projects/${TEST_PROJECT.id}/export/pdf`)
        .set("Authorization", authHeader(TEST_USER.id));

      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toContain("application/pdf");
      expect(generatePDF).toHaveBeenCalledWith(PROJECT_WITH_EVENTS, expect.anything());
    });

    it("should return 404 when project not found", async () => {
      prisma.weddingProject.findFirst.mockResolvedValue(null);

      const res = await request(app)
        .get("/api/projects/nonexistent/export/pdf")
        .set("Authorization", authHeader(TEST_USER.id));

      expect(res.status).toBe(404);
    });
  });

  describe("GET /api/projects/:id/export/excel", () => {
    it("should generate Excel for existing project", async () => {
      prisma.weddingProject.findFirst.mockResolvedValue(PROJECT_WITH_EVENTS);
      generateExcel.mockImplementation(async (_project, res) => {
        res.end("excel-data");
      });

      const res = await request(app)
        .get(`/api/projects/${TEST_PROJECT.id}/export/excel`)
        .set("Authorization", authHeader(TEST_USER.id));

      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toContain("spreadsheetml");
      expect(generateExcel).toHaveBeenCalledWith(PROJECT_WITH_EVENTS, expect.anything());
    });

    it("should return 404 when project not found", async () => {
      prisma.weddingProject.findFirst.mockResolvedValue(null);

      const res = await request(app)
        .get("/api/projects/nonexistent/export/excel")
        .set("Authorization", authHeader(TEST_USER.id));

      expect(res.status).toBe(404);
    });
  });
});
