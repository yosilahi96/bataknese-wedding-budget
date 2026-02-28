const jwt = require("jsonwebtoken");
const { authenticate } = require("../../middleware/auth");

process.env.JWT_SECRET = "test-secret-for-unit-tests";

function mockReqResNext() {
  const req = { headers: {} };
  const res = {
    statusCode: null,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(data) { this.body = data; return this; },
  };
  const next = jest.fn();
  return { req, res, next };
}

describe("authenticate middleware", () => {
  it("should call next and set userId for valid token", () => {
    const { req, res, next } = mockReqResNext();
    const token = jwt.sign({ userId: "user-1" }, process.env.JWT_SECRET, { expiresIn: "1h" });
    req.headers.authorization = `Bearer ${token}`;

    authenticate(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.userId).toBe("user-1");
  });

  it("should return 401 when no Authorization header", () => {
    const { req, res, next } = mockReqResNext();

    authenticate(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 401 when header lacks Bearer prefix", () => {
    const { req, res, next } = mockReqResNext();
    req.headers.authorization = "Token some-token";

    authenticate(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 401 for expired token", () => {
    const { req, res, next } = mockReqResNext();
    const token = jwt.sign({ userId: "user-1" }, process.env.JWT_SECRET, { expiresIn: "-1s" });
    req.headers.authorization = `Bearer ${token}`;

    authenticate(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 401 for malformed token", () => {
    const { req, res, next } = mockReqResNext();
    req.headers.authorization = "Bearer not-a-real-token";

    authenticate(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });
});
