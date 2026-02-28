require("dotenv").config();
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

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

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
