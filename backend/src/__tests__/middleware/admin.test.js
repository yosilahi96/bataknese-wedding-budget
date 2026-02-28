jest.mock("../../lib/prisma");
const prisma = require("../../lib/prisma");
const { requireAdmin } = require("../../middleware/admin");

function mockReqResNext(userId) {
  const req = { userId };
  const res = {
    statusCode: null,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(data) { this.body = data; return this; },
  };
  const next = jest.fn();
  return { req, res, next };
}

describe("requireAdmin middleware", () => {
  it("should call next for admin user", async () => {
    const { req, res, next } = mockReqResNext("admin-1");
    prisma.user.findUnique.mockResolvedValue({ isAdmin: true });

    await requireAdmin(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it("should return 403 for non-admin user", async () => {
    const { req, res, next } = mockReqResNext("user-1");
    prisma.user.findUnique.mockResolvedValue({ isAdmin: false });

    await requireAdmin(req, res, next);

    expect(res.statusCode).toBe(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 403 when user not found", async () => {
    const { req, res, next } = mockReqResNext("nonexistent");
    prisma.user.findUnique.mockResolvedValue(null);

    await requireAdmin(req, res, next);

    expect(res.statusCode).toBe(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 500 on database error", async () => {
    const { req, res, next } = mockReqResNext("user-1");
    prisma.user.findUnique.mockRejectedValue(new Error("DB error"));

    await requireAdmin(req, res, next);

    expect(res.statusCode).toBe(500);
    expect(next).not.toHaveBeenCalled();
  });
});
