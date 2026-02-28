jest.mock("../../lib/prisma");
const request = require("supertest");
const bcrypt = require("bcryptjs");
const app = require("../../app");
const prisma = require("../../lib/prisma");
const { authHeader } = require("../helpers/auth");
const { TEST_ADMIN, TEST_USER, TEST_VENDOR, TEST_VENDOR_TYPE } = require("../helpers/fixtures");

// Admin middleware requires user lookup
beforeEach(() => {
  prisma.user.findUnique.mockImplementation(({ where }) => {
    if (where.id === TEST_ADMIN.id) return Promise.resolve({ isAdmin: true });
    if (where.id === TEST_USER.id) return Promise.resolve({ isAdmin: false });
    return Promise.resolve(null);
  });
});

describe("Admin Routes", () => {
  describe("Vendor Types", () => {
    it("should create a vendor type", async () => {
      prisma.vendorTypeMaster.findUnique.mockResolvedValue(null);
      prisma.vendorTypeMaster.create.mockResolvedValue({
        id: "vt-new",
        code: "MUSIC",
        label: "Music",
      });

      const res = await request(app)
        .post("/api/admin/vendor-types")
        .set("Authorization", authHeader(TEST_ADMIN.id))
        .send({ code: "music", label: "Music" });

      expect(res.status).toBe(201);
      expect(res.body.vendorType.code).toBe("MUSIC");
    });

    it("should return 400 when code/label missing", async () => {
      const res = await request(app)
        .post("/api/admin/vendor-types")
        .set("Authorization", authHeader(TEST_ADMIN.id))
        .send({ code: "MUSIC" });

      expect(res.status).toBe(400);
    });

    it("should return 409 for duplicate code", async () => {
      prisma.vendorTypeMaster.findUnique.mockResolvedValue(TEST_VENDOR_TYPE);

      const res = await request(app)
        .post("/api/admin/vendor-types")
        .set("Authorization", authHeader(TEST_ADMIN.id))
        .send({ code: "CATERING", label: "Catering" });

      expect(res.status).toBe(409);
    });

    it("should return 403 for non-admin", async () => {
      const res = await request(app)
        .post("/api/admin/vendor-types")
        .set("Authorization", authHeader(TEST_USER.id))
        .send({ code: "MUSIC", label: "Music" });

      expect(res.status).toBe(403);
    });

    it("should delete vendor type when no vendors use it", async () => {
      prisma.vendorTypeMaster.findUnique.mockResolvedValue(TEST_VENDOR_TYPE);
      prisma.vendor.count.mockResolvedValue(0);
      prisma.vendorTypeMaster.delete.mockResolvedValue(TEST_VENDOR_TYPE);

      const res = await request(app)
        .delete(`/api/admin/vendor-types/${TEST_VENDOR_TYPE.id}`)
        .set("Authorization", authHeader(TEST_ADMIN.id));

      expect(res.status).toBe(200);
    });

    it("should reject deletion when vendors still use the type", async () => {
      prisma.vendorTypeMaster.findUnique.mockResolvedValue(TEST_VENDOR_TYPE);
      prisma.vendor.count.mockResolvedValue(5);

      const res = await request(app)
        .delete(`/api/admin/vendor-types/${TEST_VENDOR_TYPE.id}`)
        .set("Authorization", authHeader(TEST_ADMIN.id));

      expect(res.status).toBe(400);
    });
  });

  describe("Vendors", () => {
    it("should create a vendor", async () => {
      prisma.vendorTypeMaster.findMany.mockResolvedValue([{ code: "CATERING" }]);
      prisma.vendor.create.mockResolvedValue(TEST_VENDOR);

      const res = await request(app)
        .post("/api/admin/vendors")
        .set("Authorization", authHeader(TEST_ADMIN.id))
        .send({
          name: "Test Vendor",
          type: "CATERING",
          location: "Jakarta",
          minPriceEstimate: 50000,
          maxPriceEstimate: 100000,
        });

      expect(res.status).toBe(201);
    });

    it("should return 400 for invalid vendor type", async () => {
      prisma.vendorTypeMaster.findMany.mockResolvedValue([{ code: "CATERING" }]);

      const res = await request(app)
        .post("/api/admin/vendors")
        .set("Authorization", authHeader(TEST_ADMIN.id))
        .send({
          name: "Test Vendor",
          type: "INVALID",
          location: "Jakarta",
          minPriceEstimate: 50000,
          maxPriceEstimate: 100000,
        });

      expect(res.status).toBe(400);
    });

    it("should delete a vendor", async () => {
      prisma.vendor.findUnique.mockResolvedValue(TEST_VENDOR);
      prisma.vendor.delete.mockResolvedValue(TEST_VENDOR);

      const res = await request(app)
        .delete(`/api/admin/vendors/${TEST_VENDOR.id}`)
        .set("Authorization", authHeader(TEST_ADMIN.id));

      expect(res.status).toBe(200);
    });
  });

  describe("Master Categories", () => {
    it("should create a master category", async () => {
      prisma.masterCategory.create.mockResolvedValue({
        id: "mc-1",
        name: "Transport",
        eventType: "PESTA_ADAT",
        sortOrder: 1,
      });

      const res = await request(app)
        .post("/api/admin/master-categories")
        .set("Authorization", authHeader(TEST_ADMIN.id))
        .send({ name: "Transport", eventType: "PESTA_ADAT", sortOrder: 1 });

      expect(res.status).toBe(201);
    });

    it("should return 400 for invalid eventType", async () => {
      const res = await request(app)
        .post("/api/admin/master-categories")
        .set("Authorization", authHeader(TEST_ADMIN.id))
        .send({ name: "Test", eventType: "INVALID" });

      expect(res.status).toBe(400);
    });
  });

  describe("Users", () => {
    it("should list users", async () => {
      prisma.user.findMany.mockResolvedValue([
        { id: "u-1", email: "a@b.com", name: "User", isAdmin: false, _count: { projects: 2 } },
      ]);

      const res = await request(app)
        .get("/api/admin/users")
        .set("Authorization", authHeader(TEST_ADMIN.id));

      expect(res.status).toBe(200);
      expect(res.body.users).toHaveLength(1);
    });

    it("should create a user", async () => {
      prisma.user.findUnique.mockImplementation(({ where }) => {
        if (where.id) return Promise.resolve({ isAdmin: true });
        return Promise.resolve(null); // email lookup
      });
      prisma.user.create.mockResolvedValue({
        id: "new-u",
        email: "new@example.com",
        name: "New",
        isAdmin: false,
        createdAt: new Date(),
      });

      const res = await request(app)
        .post("/api/admin/users")
        .set("Authorization", authHeader(TEST_ADMIN.id))
        .send({ email: "new@example.com", password: "password123", name: "New" });

      expect(res.status).toBe(201);
    });

    it("should prevent removing own admin privileges", async () => {
      prisma.user.findUnique.mockImplementation(({ where }) => {
        if (where.id === TEST_ADMIN.id) return Promise.resolve({ ...TEST_ADMIN, isAdmin: true });
        return Promise.resolve(null);
      });

      const res = await request(app)
        .put(`/api/admin/users/${TEST_ADMIN.id}`)
        .set("Authorization", authHeader(TEST_ADMIN.id))
        .send({ isAdmin: false });

      expect(res.status).toBe(400);
    });

    it("should prevent deleting own account", async () => {
      const res = await request(app)
        .delete(`/api/admin/users/${TEST_ADMIN.id}`)
        .set("Authorization", authHeader(TEST_ADMIN.id));

      expect(res.status).toBe(400);
    });

    it("should delete another user", async () => {
      prisma.user.findUnique.mockImplementation(({ where }) => {
        if (where.id === TEST_ADMIN.id) return Promise.resolve({ isAdmin: true });
        if (where.id === "other-user") return Promise.resolve({ id: "other-user", isAdmin: false });
        return Promise.resolve(null);
      });
      prisma.user.delete.mockResolvedValue({ id: "other-user" });

      const res = await request(app)
        .delete("/api/admin/users/other-user")
        .set("Authorization", authHeader(TEST_ADMIN.id));

      expect(res.status).toBe(200);
    });
  });
});
