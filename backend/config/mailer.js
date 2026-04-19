// ============================================================
// config/mailer.js – Resend HTTP Email API (replaces nodemailer SMTP)
// Render free tier blocks all outbound SMTP ports (25, 465, 587).
// Resend uses HTTPS (port 443) — always open — no port blocking.
// ============================================================

const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

// Nodemailer-compatible wrapper — no changes needed in controllers or authController
// All existing transporter.sendMail({ from, to, subject, html }) calls work as-is
const transporter = {
  sendMail: async ({ from, to, subject, html }) => {
    const { data, error } = await resend.emails.send({ from, to, subject, html });
    if (error) {
      throw new Error(`Resend error: ${error.message}`);
    }
    return data;
  },

  // Called on startup to verify the API key is set
  verify: (cb) => {
    if (!process.env.RESEND_API_KEY) {
      const msg = "❌ RESEND_API_KEY not set — add it to Render environment variables";
      console.error(msg);
      if (cb) cb(new Error(msg));
    } else {
      console.log("✅ Resend email service ready (HTTP API — no SMTP port blocking)");
      if (cb) cb(null, true);
    }
  },
};

// Verify on startup — shows in Render logs within 1 second of boot
transporter.verify();

module.exports = transporter;
