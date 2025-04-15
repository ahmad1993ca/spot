const bcrypt = require("bcrypt");
const db = require("../models");
const nodemailer = require("nodemailer");
const { sendMail } = require("../services/mailService");
require("dotenv").config();

exports.sendOtp = async (req, res) => {
  try {
    const otp = Math.floor(100000 + Math.random() * 900000);
    const email = req.body.email;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Verify Your Email - OTP Code",
      html: `<div style="max-width: 500px; margin: 20px auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; background: #f9f9f9; font-family: Arial, sans-serif;">
                      <div style="text-align: center; padding-bottom: 20px;">
                          <h2 style="color: #333;">Email Verification</h2>
                          <p style="font-size: 16px; color: #555;">
                              Use the OTP below to verify your email address.
                          </p>
                      </div>
                      <div style="text-align: center; background: #fff; padding: 15px; border-radius: 5px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
                          <p style="font-size: 18px; color: #222; margin-bottom: 10px;">
                              Your OTP Code:
                          </p>
                          <p style="font-size: 24px; font-weight: bold; color: #d9534f; padding: 10px; background: #f8d7da; display: inline-block; border-radius: 5px;">
                              ${otp}
                          </p>
                      </div>
                      <p style="text-align: center; font-size: 14px; color: #777; margin-top: 20px;">
                          This OTP will expire in <strong>10 minutes</strong>. 
                          Do not share this code with anyone.
                      </p>
                  </div>`,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    req.session.email = email;
    req.session.otp = otp;
    req.session.otpExpires = Date.now() + 10 * 60 * 1000; // OTP expires in 10 minutes

    res.status(200).json({
      status: true,
      message: "OTP sent successfully",
    });

    // // Send Welcome Email
    // const subject = "Welcome to Our App!";
    // const text = `Hello ${email}, welcome to our platform.`;
    // const html = `<h1>Hello ${email},</h1><p>Welcome to our platform!</p>`;

    // await sendMail(email, subject, text, html);

    // res
    //   .status(201)
    //   .json({
    //     message: "User registered successfully and email sent",
    //     user: newUser,
    //   });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { otp } = req.body;

    if (!req.session.otp || Date.now() > req.session.otpExpires) {
      return res.status(400).json({
        status: false,
        message: "OTP expired or not found",
      });
    }

    if (parseInt(req.session.otp) !== parseInt(otp)) {
      return res.status(400).json({
        status: false,
        message: "Invalid OTP",
      });
    }

    // Find user with Sequelize instead of MongoDB syntax
    const existingUser = await db.User.findOne({
      where: {
        email: req.session.email,
      },
    });

    console.log(existingUser);

    let userData = null;
    if (existingUser) {
      userData = {
        id: existingUser.id,
        fullName: existingUser.fullName,
        mobile: existingUser.mobile,
        email: existingUser.email,
        businessName: existingUser.businessName,
        isAdmin: existingUser.isAdmin,
        profession: existingUser.profession,
        usagePlan: existingUser.usagePlan,
        goals: existingUser.goals,
        photograph: existingUser.photograph,
        token: generateToken(existingUser),
      };
    }

    // req.session.otp = null;
    // req.session.otpExpires = null;

    res.status(200).json({
      status: true,
      message: "OTP verified successfully",
      data: userData,
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: err.message,
    });
  }
};

exports.register = async (req, res) => {
  try {
    const { email, password, confirm_password } = req.body;
    const { otp } = req.body;

    // Verify OTP
    if (!req.session.otp || Date.now() > req.session.otpExpires) {
      return res.status(400).json({
        status: false,
        message: "OTP expired or not found",
      });
    }

    if (parseInt(req.session.otp) !== parseInt(otp)) {
      return res.status(400).json({
        status: false,
        message: "Invalid OTP",
      });
    }

    // Verify email matches the one OTP was sent to
    if (email !== req.session.email) {
      return res.status(400).json({
        status: false,
        message: "Email does not match the one OTP was sent to",
      });
    }

    // Check if user already exists
    const existingUser = await db.User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        status: false,
        message: "User already exists",
      });
    }

    // Check if passwords match
    if (password !== confirm_password) {
      return res.status(400).json({
        status: false,
        message: "Passwords do not match",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with only required fields
    const newUser = await db.User.create({
      email,
      password: hashedPassword,
      confirm_password: hashedPassword,
    });

    // Clear OTP session data
    req.session.email = null;
    req.session.otp = null;
    req.session.otpExpires = null;

    res.status(201).json({
      status: true,
      message: "User registered successfully",
      user: {
        id: newUser.id,
        email: newUser.email,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};
