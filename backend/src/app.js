const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const projectRoutes = require("./routes/projects");
const categoryRoutes = require("./routes/categories");
const exportRoutes = require("./routes/export");
const vendorRoutes = require("./routes/vendors");
const adminRoutes = require("./routes/admin");
const masterCategoryRoutes = require("./routes/masterCategories");
const vendorTypeRoutes = require("./routes/vendorTypes");
const projectVendorRoutes = require("./routes/projectVendors");
const openapi = require("./docs/openapi");
const swaggerPage = require("./docs/swaggerPage");

const app = express();

const isProduction = process.env.NODE_ENV === "production";
const isTest = process.env.NODE_ENV === "test";
const insecureJwtSecrets = new Set([
  "your-secret-key-change-in-production",
  "local-dev-secret-change-me",
  "secret",
  "changeme",
]);

const HTTP_ERROR_CODES = {
  400: "BAD_REQUEST",
  401: "UNAUTHORIZED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  409: "CONFLICT",
  413: "PAYLOAD_TOO_LARGE",
  415: "UNSUPPORTED_MEDIA_TYPE",
  422: "UNPROCESSABLE_ENTITY",
  429: "TOO_MANY_REQUESTS",
  500: "INTERNAL_SERVER_ERROR",
};

function getErrorCode(status) {
  return HTTP_ERROR_CODES[status] || "REQUEST_FAILED";
}

function normalizeErrorResponse(body, status) {
  const fallbackMessage = status >= 500 ? "Internal server error" : "Request failed";

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    const message = typeof body === "string" ? body : fallbackMessage;
    return {
      error: message,
      message,
      status,
      code: getErrorCode(status),
    };
  }

  const message = body.message || body.error || fallbackMessage;
  return {
    ...body,
    error: body.error || message,
    message,
    status: body.status || status,
    code: body.code || getErrorCode(status),
  };
}

function errorResponseFormatter(_req, res, next) {
  const originalJson = res.json.bind(res);

  res.json = (body) => {
    if (res.statusCode >= 400) {
      return originalJson(normalizeErrorResponse(body, res.statusCode));
    }
    return originalJson(body);
  };

  next();
}

function validateRequiredEnv() {
  if (isTest) {
    process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret-for-unit-tests";
  }

  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is required");
  }

  if (isProduction) {
    if (insecureJwtSecrets.has(process.env.JWT_SECRET) || process.env.JWT_SECRET.length < 32) {
      throw new Error("JWT_SECRET must be a strong production secret");
    }

    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is required in production");
    }

    if (!process.env.CORS_ORIGIN) {
      throw new Error("CORS_ORIGIN is required in production");
    }
  }
}

function buildCorsOptions() {
  function normalizeOrigin(origin) {
    return origin.replace(/\/$/, "");
  }

  const allowedOrigins = (process.env.CORS_ORIGIN || "")
    .split(",")
    .map((origin) => origin.trim())
    .map(normalizeOrigin)
    .filter(Boolean);

  if (!isProduction && allowedOrigins.length === 0) {
    return {};
  }

  return {
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(normalizeOrigin(origin))) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    optionsSuccessStatus: 204,
  };
}

validateRequiredEnv();

app.use(cors(buildCorsOptions()));
app.use(express.json());
app.use(errorResponseFormatter);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

if (!isProduction || process.env.ENABLE_API_DOCS === "true") {
  app.get("/api-docs.json", (_req, res) => {
    res.json(openapi);
  });

  app.get("/api-docs", (_req, res) => {
    res.type("html").send(swaggerPage());
  });
}

app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/projects", categoryRoutes);
app.use("/api/projects", exportRoutes);
app.use("/api/vendors", vendorRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/master-categories", masterCategoryRoutes);
app.use("/api/vendor-types", vendorTypeRoutes);
app.use("/api/projects", projectVendorRoutes);

app.use("/api", (req, res) => {
  res.status(404).json({
    error: `API route not found: ${req.method} ${req.originalUrl}`,
  });
});

app.use((err, _req, res, _next) => {
  console.error(err.stack);
  const status = err.status || err.statusCode || 500;
  const message = !isProduction && err.message ? err.message : "Internal server error";
  const body = { error: message, code: err.code || getErrorCode(status) };

  if (!isProduction && err.stack) {
    body.details = err.stack.split("\n").map((line) => line.trim());
  }

  res.status(status).json(body);
});

module.exports = app;
