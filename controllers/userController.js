const bcrypt = require("bcrypt");
const db = require("../models");
const nodemailer = require("nodemailer");
const jwt = require('jsonwebtoken');
const axios = require('axios');
const express = require('express');
const router = express.Router();

const {
  sendMail,
  generateOTP,
  sendOTPviaSMS,
} = require("../services/mailAndSmsService");
require("dotenv").config();

exports.sendOtp = async (req, res) => {
  try {
    const { email, mobile } = req.body;

    console.log("email", email, mobile)

    if (!email) {
      return res.status(400).json({
        status: false,
        message: "please provide email "
      })
    }

    const otp = generateOTP();
    if (email) {
      const subject = "Verify Your Email - OTP Code";
      const text = `Hello ${email}, welcome to our platform.`;
      const html = `<div style="max-width: 500px; margin: 20px auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; background: #f9f9f9; font-family: Arial, sans-serif;">
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
                </div>`;

      await sendMail(email, subject, text, html);

      req.session.email = email;
    } else {
    //  const result =  await sendOTPviaSMS(mobile, otp);
    // Replace with your actual values
      const AUTH_KEY = '343074686573706f743132333130301744818964';
      const SENDER_ID = 'ARHAMF'; // Must be exactly 6 characters
      const ROUTE = 1;

    const { mobile, } = req.body;

  if (!mobile ) {
    return res.status(400).json({ error: 'Mobile number and message are required' });
  }

  // Handle single quotes by doubling them up as per guideline
  // const formattedMessage = message.replace(/'/g, "''");
  const message = encodeURIComponent(`Your OTP code is ${otp}. Please use it within 10 minutes.`);

  try {
    const smsURL = 'http://bulk.powerstext.in/http-tokenkeyapi.php';

    const params = {
      'authentic-key': AUTH_KEY,
      senderid: SENDER_ID, // Replace with your approved 6-char sender ID
      route: 1,
      number: mobile, // Replace with recipient number
      message: `Your OTP code is ${otp}. Please use it within 10 minutes.`, // Message must match template
      templateid: '1607100000000340864' // Replace with your approved template ID
    };
  
    try {
      const response = await axios.get(smsURL, { params });
      console.log('SMS API Response:', response);
    } catch (error) {
      console.error('SMS API Error:', error.message);
    }
      //  console.log('result', result)
      req.session.mobile = mobile;
    }catch (error) {
      console.error('SMS API Error:', error.message);
    }
  }
  

    req.session.otp = otp;
    req.session.otpExpires = Date.now() + 10 * 60 * 1000; // OTP expires in 10 minutes

    res.status(200).json({
      status: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
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

    req.session.email = null;
    req.session.mobile = null;
    req.session.otp = null;
    req.session.otpExpires = null;


    res.status(200).json({
      status: true,
      message: "OTP verified successfully"
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


    // Check if user already exists

    let existingUser;

    if (email) {
      existingUser = await db.User.findOne({ where: { email } });
    } else {
      existingUser = await db.User.findOne({ where: { mobile } });
    }

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

    let newUser ;

    if (email) {
      newUser = await db.User.create({
        email,
        password: hashedPassword,
        confirm_password: hashedPassword,
      });
    } 

    res.status(201).json({
      status: true,
      message: "User registered successfully",
      user: {
        id: newUser.id,
        email: newUser.email
      },
    });
  } catch (error) {
    console.log(error)
    res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};


exports.profile = async (req, res) => {
  try {
    const { email, first_name, last_name, gender, about_you, profile_visibility } = req.body;

    const imageUrl = req.file ? `uploads/${req.file.filename}` : null;

    const profile = await db.Profile.create({
      email,
      first_name,
      last_name,
      gender,
      about_you,
      profile_visibility,
      image_url: imageUrl
    });

    res.status(201).json({ message: 'Profile created successfully', profile });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Something went wrong', error: err.message });
  }
};


// Replace with your actual secret (store securely in .env)
const JWT_SECRET = process.env.JWT_SECRET || 'spot';

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await db.User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({
        status: false,
        message: "Invalid email or password",
      });
    }

    const matchPassword = await bcrypt.compare(password, user.password);

    if (!matchPassword) {
      return res.status(401).json({
        status: false,
        message: "Invalid email or password",
      });
    }

    // Generate JWT Token
    const token = jwt.sign(
      { id: user.id, email: user.email }, // Payload
      JWT_SECRET,
      { expiresIn: '1d' } // Token validity
    );

    res.status(200).json({
      status: true,
      message: 'Login successful',
      token, // Include token in response
      user: {
        id: user.id,
        email: user.email,
      }
    });

  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};
