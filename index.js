require("dotenv").config();
const express = require("express");
const session = require("express-session");
const passport = require('passport');
const jwt = require('jsonwebtoken');

require('./auth/google');
const db = require("./models");
const userRoutes = require("./routes/userRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

app.use(
  session({
    secret: "spot",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, 
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use("/api/users", userRoutes);



app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/auth/failure' }),
  (req, res) => {
    const user = {
      id: req.user.id,
      name: req.user.displayName,
      email: req.user.emails?.[0].value,
      photo: req.user.photos?.[0].value
    };

    const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '7d' });

    // Send token in JSON response instead of redirecting to a page
    res.json({ token, user });
  }
);

app.get('/auth/failure', (req, res) => {
  res.status(401).json({ message: 'Authentication failed' });
});

app.get('/logout', (req, res) => {
  req.logout(() => {
    res.json({ message: 'Logged out' });
  });
});

// Sync Database
db.sequelize.sync()
  .then(() => console.log("Database connected and synced"))
  .catch((err) => console.log("Error syncing database: ", err));

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
