require("dotenv").config();
const express = require("express");
const db = require("./models");
const userRoutes = require("./routes/userRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Routes
app.use("/api/users", userRoutes);

// Sync Database
db.sequelize.sync()
  .then(() => console.log("Database connected and synced"))
  .catch((err) => console.log("Error syncing database: ", err));

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
