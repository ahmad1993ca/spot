const bcrypt = require("bcrypt");
const db = require("../models");
const { sendMail } = require("../services/mailService");

exports.register = async (req, res) => {
  try {
    const { confirm_password, email, password } = req.body;

    // Check if user already exists
    const existingUser = await db.User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await db.User.create({
      confirm_password,
      email,
      password: hashedPassword,
    });

    // Send Welcome Email
    const subject = "Welcome to Our App!";
    const text = `Hello ${email}, welcome to our platform.`;
    const html = `<h1>Hello ${email},</h1><p>Welcome to our platform!</p>`;

    await sendMail(email, subject, text, html);

    res.status(201).json({ message: "User registered successfully and email sent", user: newUser });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
