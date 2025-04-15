const nodemailer = require("nodemailer");
const axios = require("axios");
// Generate a random 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP via sms
const sendOTPviaSMS = async (mobileNumber, otp) => {
  try {
    // Remove any non-numeric characters and ensure proper format
    const formattedNumber = mobileNumber.replace(/\D/g, "");

    // Construct the API URL for bulk.powerstext.in
    const url = "https://bulk.powerstext.in/api/sendmsg.php";

    // Prepare the request parameters
    const params = new URLSearchParams({
      user: process.env.SMS_USER,
      pass: process.env.SMS_PASS,
      // sender: process.env.POWERSTEXT_SENDER_ID,
      phone: formattedNumber,
      text: `Your verification code is: ${otp}`,
      priority: "1", // High priority
      stype: "normal",
    });

    // Make the API request
    const response = await axios.post(url, params);

    // Check if the message was sent successfully
    if (response.data && response.data.includes("success")) {
      return {
        success: true,
        messageId: response.data,
      };
    } else {
      return {
        success: false,
        error: response.data || "Unknown error",
      };
    }
  } catch (error) {
    console.error("Error sending OTP via SMS:", error);
    throw error;
  }
};

// Send OTP via email
const sendMail = async (to, subject, text, html) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: ", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending email: ", error);
    throw error;
  }
};

module.exports = { generateOTP, sendOTPviaSMS, sendMail };
