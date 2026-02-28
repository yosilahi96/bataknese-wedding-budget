jest.mock("../../lib/prisma");
const request = require("supertest");
const app = require("../../app");
const prisma = require("../../lib/prisma");
const { authHeader } = require("../helpers/auth");
const { TEST_USER, TEST_VENDOR_TYPE } = require("../helpers/fixtures");

describe("Vendor Types Routes", () => {
  describe("GET /api/vendor-types", () => {
    it("should list all vendor types", async () => {
      prisma.vendorTypeMaster.findMany.mockResolvedValue([TEST_VENDOR_TYPE]);

      const res = await request(app)
        .get("/api/vendor-types")
        .set("Authorization", authHeader(TEST_USER.id));

      expect(res.status).toBe(200);
      expect(res.body.vendorTypes).toHaveLength(1);
      expect(res.body.vendorTypes[0].code).toBe("CATERING");
    });

    it("should return 401 without token", async () => {
      const res = await request(app).get("/api/vendor-types");
      expect(res.status).toBe(401);
    });
  });
});
