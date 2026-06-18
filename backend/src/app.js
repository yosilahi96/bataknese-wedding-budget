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
const insecureJwtSecrets = new Set([
  "your-secret-key-change-in-production",
  "local-dev-secret-change-me",
  "secret",
  "changeme",
]);

function validateRequiredEnv() {
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
  const allowedOrigins = (process.env.CORS_ORIGIN || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (!isProduction && allowedOrigins.length === 0) {
    return {};
  }

  return {
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
  };
}

validateRequiredEnv();

app.use(cors(buildCorsOptions()));
app.use(express.json());

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

app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal server error" });
});

module.exports = app;
