const request = require("supertest");
const app = require("../app");

describe("API error responses", () => {
  it("adds readable metadata to route errors", async () => {
    const res = await request(app).get("/api/projects");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({
      error: "Authentication required",
      message: "Authentication required",
      status: 401,
      code: "UNAUTHORIZED",
    });
  });

  it("returns JSON metadata for unknown API routes", async () => {
    const res = await request(app).get("/api/does-not-exist");

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      error: "API route not found: GET /api/does-not-exist",
      message: "API route not found: GET /api/does-not-exist",
      status: 404,
      code: "NOT_FOUND",
    });
  });
});
