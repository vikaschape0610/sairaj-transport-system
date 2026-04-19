// ============================================================
// config/adminMail.js – Admin Mail Functions
// ============================================================

const transporter = require("./mailer");

// ============================================================
// 📩 SEND ADMIN OTP
// ============================================================
const sendAdminOTP = async (email, otp) => {
  try {
    await transporter.sendMail({
      from: `"Sairaj Transport Admin" <${process.env.FROM_EMAIL || process.env.EMAIL_USER}>`,
      to: email,
      subject: "Admin Password Reset OTP",
      html: `
        <h2>Password Reset Request</h2>
        <p>Your OTP is:</p>
        <h1 style="color:blue;">${otp}</h1>
        <p>This OTP will expire in 5 minutes.</p>
      `,
    });

    console.log("Admin OTP sent to:", email);
  } catch (err) {
    console.error("Admin Mail Error:", err.message);
    throw err;
  }
};

module.exports = {
  sendAdminOTP,
};
