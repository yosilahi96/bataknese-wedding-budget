jest.mock("../../lib/prisma");
const request = require("supertest");
const bcrypt = require("bcryptjs");
const app = require("../../app");
const prisma = require("../../lib/prisma");
const { authHeader } = require("../helpers/auth");
const { TEST_USER } = require("../helpers/fixtures");

describe("Auth Routes", () => {
  describe("POST /api/auth/register", () => {
    it("should register a new user", async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: "new-user",
        email: "new@example.com",
        name: "New User",
        isAdmin: false,
      });

      const res = await request(app)
        .post("/api/auth/register")
        .send({ email: "new@example.com", password: "password123", name: "New User" });

      expect(res.status).toBe(201);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe("new@example.com");
    });

    it("should return 400 when fields are missing", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ email: "test@example.com" });

      expect(res.status).toBe(400);
    });

    it("should return 409 for duplicate email", async () => {
      prisma.user.findUnique.mockResolvedValue(TEST_USER);

      const res = await request(app)
        .post("/api/auth/register")
        .send({ email: TEST_USER.email, password: "password123", name: "Test" });

      expect(res.status).toBe(409);
    });
  });

  describe("POST /api/auth/login", () => {
    it("should login with valid credentials", async () => {
      const hashed = await bcrypt.hash("password123", 10);
      prisma.user.findUnique.mockResolvedValue({ ...TEST_USER, password: hashed });

      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: TEST_USER.email, password: "password123" });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe(TEST_USER.email);
    });

    it("should return 400 when fields are missing", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "test@example.com" });

      expect(res.status).toBe(400);
    });

    it("should return 401 for non-existent email", async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "nobody@example.com", password: "password123" });

      expect(res.status).toBe(401);
    });

    it("should return 401 for wrong password", async () => {
      const hashed = await bcrypt.hash("correct-password", 10);
      prisma.user.findUnique.mockResolvedValue({ ...TEST_USER, password: hashed });

      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: TEST_USER.email, password: "wrong-password" });

      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/auth/me", () => {
    it("should return user data with valid token", async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: TEST_USER.id,
        email: TEST_USER.email,
        name: TEST_USER.name,
        isAdmin: false,
      });

      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", authHeader(TEST_USER.id));

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe(TEST_USER.email);
    });

    it("should return 401 without token", async () => {
      const res = await request(app).get("/api/auth/me");

      expect(res.status).toBe(401);
    });

    it("should return 404 when user not found", async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", authHeader("nonexistent"));

      expect(res.status).toBe(404);
    });
  });

  describe("PUT /api/auth/change-password", () => {
    it("should change password successfully", async () => {
      const hashed = await bcrypt.hash("oldpass123", 10);
      prisma.user.findUnique.mockResolvedValue({ ...TEST_USER, password: hashed });
      prisma.user.update.mockResolvedValue(TEST_USER);

      const res = await request(app)
        .put("/api/auth/change-password")
        .set("Authorization", authHeader(TEST_USER.id))
        .send({ currentPassword: "oldpass123", newPassword: "newpass123" });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Password changed successfully");
    });

    it("should return 400 when fields are missing", async () => {
      const res = await request(app)
        .put("/api/auth/change-password")
        .set("Authorization", authHeader(TEST_USER.id))
        .send({ currentPassword: "old" });

      expect(res.status).toBe(400);
    });

    it("should return 400 when new password is too short", async () => {
      const res = await request(app)
        .put("/api/auth/change-password")
        .set("Authorization", authHeader(TEST_USER.id))
        .send({ currentPassword: "oldpass123", newPassword: "12345" });

      expect(res.status).toBe(400);
    });

    it("should return 401 for wrong current password", async () => {
      const hashed = await bcrypt.hash("correct-password", 10);
      prisma.user.findUnique.mockResolvedValue({ ...TEST_USER, password: hashed });

      const res = await request(app)
        .put("/api/auth/change-password")
        .set("Authorization", authHeader(TEST_USER.id))
        .send({ currentPassword: "wrong-password", newPassword: "newpass123" });

      expect(res.status).toBe(401);
    });
  });
});
