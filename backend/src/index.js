const app = require("./app");
const path = require("path");
const express = require("express");

const PORT = process.env.PORT || 3001;

// Serve frontend static files in production
const frontendDist = path.join(__dirname, "../../frontend/dist");
app.use(express.static(frontendDist));
app.get("*", (_req, res) => {
  res.sendFile(path.join(frontendDist, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
