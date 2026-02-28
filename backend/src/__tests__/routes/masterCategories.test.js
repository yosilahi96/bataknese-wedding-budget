jest.mock("../../lib/prisma");
const request = require("supertest");
const app = require("../../app");
const prisma = require("../../lib/prisma");
const { authHeader } = require("../helpers/auth");
const { TEST_USER } = require("../helpers/fixtures");

describe("Master Categories Routes", () => {
  describe("GET /api/master-categories", () => {
    it("should list all master categories", async () => {
      prisma.masterCategory.findMany.mockResolvedValue([
        { id: "mc-1", name: "Catering", eventType: "PESTA_ADAT", sortOrder: 1 },
        { id: "mc-2", name: "Transport", eventType: "THREE_M", sortOrder: 2 },
      ]);

      const res = await request(app)
        .get("/api/master-categories")
        .set("Authorization", authHeader(TEST_USER.id));

      expect(res.status).toBe(200);
      expect(res.body.categories).toHaveLength(2);
    });

    it("should filter by eventType", async () => {
      prisma.masterCategory.findMany.mockResolvedValue([
        { id: "mc-1", name: "Catering", eventType: "PESTA_ADAT", sortOrder: 1 },
      ]);

      const res = await request(app)
        .get("/api/master-categories?eventType=PESTA_ADAT")
        .set("Authorization", authHeader(TEST_USER.id));

      expect(res.status).toBe(200);
      expect(prisma.masterCategory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ eventType: "PESTA_ADAT" }),
        })
      );
    });

    it("should return 401 without token", async () => {
      const res = await request(app).get("/api/master-categories");
      expect(res.status).toBe(401);
    });
  });
});
