jest.mock("../../lib/prisma");
const request = require("supertest");
const app = require("../../app");
const prisma = require("../../lib/prisma");
const { authHeader } = require("../helpers/auth");
const { TEST_USER, TEST_PROJECT, TEST_VENDOR, TEST_VENDOR_TYPE } = require("../helpers/fixtures");

describe("Vendor Routes", () => {
  describe("GET /api/vendors", () => {
    it("should list all vendors", async () => {
      prisma.vendor.findMany.mockResolvedValue([TEST_VENDOR]);

      const res = await request(app)
        .get("/api/vendors")
        .set("Authorization", authHeader(TEST_USER.id));

      expect(res.status).toBe(200);
      expect(res.body.vendors).toHaveLength(1);
    });

    it("should filter vendors by type", async () => {
      prisma.vendor.findMany.mockResolvedValue([TEST_VENDOR]);

      const res = await request(app)
        .get("/api/vendors?type=CATERING")
        .set("Authorization", authHeader(TEST_USER.id));

      expect(res.status).toBe(200);
      expect(prisma.vendor.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ type: "CATERING" }),
        })
      );
    });

    it("should filter by batak specialist", async () => {
      prisma.vendor.findMany.mockResolvedValue([TEST_VENDOR]);

      const res = await request(app)
        .get("/api/vendors?isBatakSpecialist=true")
        .set("Authorization", authHeader(TEST_USER.id));

      expect(res.status).toBe(200);
      expect(prisma.vendor.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isBatakSpecialist: true }),
        })
      );
    });

    it("should sort by price ascending", async () => {
      prisma.vendor.findMany.mockResolvedValue([TEST_VENDOR]);

      const res = await request(app)
        .get("/api/vendors?sortBy=price_asc")
        .set("Authorization", authHeader(TEST_USER.id));

      expect(res.status).toBe(200);
      expect(prisma.vendor.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { minPriceEstimate: "asc" },
        })
      );
    });

    it("should return 401 without token", async () => {
      const res = await request(app).get("/api/vendors");
      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/vendors/recommend/:projectId", () => {
    it("should return recommendations grouped by type", async () => {
      prisma.weddingProject.findFirst.mockResolvedValue(TEST_PROJECT);
      prisma.vendorTypeMaster.findMany.mockResolvedValue([TEST_VENDOR_TYPE]);
      prisma.vendor.findMany.mockResolvedValue([TEST_VENDOR]);

      const res = await request(app)
        .get(`/api/vendors/recommend/${TEST_PROJECT.id}`)
        .set("Authorization", authHeader(TEST_USER.id));

      expect(res.status).toBe(200);
      expect(res.body.recommendations).toBeDefined();
      expect(res.body.recommendations.CATERING).toBeDefined();
      expect(res.body.projectGuestCount).toBe(500);
    });

    it("should return 404 when project not found", async () => {
      prisma.weddingProject.findFirst.mockResolvedValue(null);

      const res = await request(app)
        .get("/api/vendors/recommend/nonexistent")
        .set("Authorization", authHeader(TEST_USER.id));

      expect(res.status).toBe(404);
    });
  });

  describe("GET /api/vendors/:id", () => {
    it("should return a single vendor", async () => {
      prisma.vendor.findUnique.mockResolvedValue(TEST_VENDOR);

      const res = await request(app)
        .get(`/api/vendors/${TEST_VENDOR.id}`)
        .set("Authorization", authHeader(TEST_USER.id));

      expect(res.status).toBe(200);
      expect(res.body.vendor.name).toBe(TEST_VENDOR.name);
    });

    it("should return 404 when vendor not found", async () => {
      prisma.vendor.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .get("/api/vendors/nonexistent")
        .set("Authorization", authHeader(TEST_USER.id));

      expect(res.status).toBe(404);
    });
  });
});
