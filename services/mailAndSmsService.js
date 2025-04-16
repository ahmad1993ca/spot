const nodemailer = require("nodemailer");
const axios = require("axios");
// Generate a random 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP via sms

// const sendOTPviaSMS = async (mobileNumber, otp) => {
//   try {
//     const formattedNumber = mobileNumber.replace(/\D/g, "");

//     const url = "https://bulk.powerstext.in/api/sendmsg.php";

//     const params = {
//       user: process.env.SMS_USER,
//       pass: process.env.SMS_PASS,
//       sender: process.env.SMS_SENDER_ID,
//       phone: formattedNumber,
//       text: `Your verification code is: ${otp}`,
//       priority: "1",
//       stype: "normal",
//       type: "1" // This may be required to specify plain text SMS
//     };

//     const response = await axios.get(url, { params });

//     if (response.data && response.data.toLowerCase().includes("success")) {
//       return {
//         success: true,
//         messageId: response.data,
//       };
//     } else {
//       return {
//         success: false,
//         error: response.data || "Unknown error",
//       };
//     }
//   } catch (error) {
//     console.error("Error sending OTP via SMS:", error);
//     return {
//       success: false,
//       error: error.message,
//     };
//   }
// };




const sendOTPviaSMS = async (mobileNumber, otp) => {
  try {
    // Clean the number (just in case)
    const formattedNumber = mobileNumber.replace(/\D/g, '');

    // Prepare the message
    const message = `Your verification code is: ${otp}`;

    // Define API endpoint and parameters
    const url = 'http://bulk.powerstext.in/tokenapi-nontid.php';
    const params = {
      'authentic-key': process.env.SMS_AUTH_KEY,  // ✅ Must be set in your .env
      senderid: process.env.SMS_SENDER_ID,        // ✅ Must be 6 characters, approved
      route: '1',                                  // 1 = Transactional
      number: formattedNumber,                      // Only 10-digit number, no +91
      message: message,
      templateid: process.env.SMS_TemplateId
    };

    // Make the GET request
    const response = await axios.get(url, { params });

    // Log and return response
    console.log('SMS API Response:', response.data);

    if (typeof response.data === 'string' && response.data.toLowerCase().includes('success')) {
      return {
        success: true,
        messageId: response.data,
      };
    } else {
      throw new Error(response.data);

    }
  } catch (error) {
    console.error('Error sending OTP via SMS:', error.response?.data || error.message);
    throw new Error(error);
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
