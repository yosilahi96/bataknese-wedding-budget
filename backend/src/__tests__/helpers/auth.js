const jwt = require("jsonwebtoken");

process.env.JWT_SECRET = "test-secret-for-unit-tests";

function generateTestToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "1h" });
}

function authHeader(userId) {
  return `Bearer ${generateTestToken(userId)}`;
}

module.exports = { generateTestToken, authHeader };
