// ============================================================
// config/emailTemplates.js – Centralized Email HTML Templates
// ============================================================

const BRAND = "Sairaj Transport";
const BRAND_BLUE = "#1d4ed8";
const BRAND_DARK = "#0f172a";
// Use verified domain email if set, otherwise fall back to EMAIL_USER
const FROM_ADDRESS = () => `"${BRAND}" <${process.env.FROM_EMAIL || process.env.EMAIL_USER}>`;

// ── Helper: branded container wrapper ────────────────────────
function wrap(headerBg, headerText, body) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:540px;margin:0 auto;background:#f9fafb;padding:24px;border-radius:12px;">
      <div style="background:${headerBg};padding:20px 24px;border-radius:8px 8px 0 0;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:1.3rem;font-weight:700;">${headerText}</h1>
        <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:0.85rem;">${BRAND}</p>
      </div>
      <div style="background:#fff;padding:24px;border-radius:0 0 8px 8px;border:1px solid #e5e7eb;border-top:none;">
        ${body}
        <hr style="border:none;border-top:1px solid #f3f4f6;margin:24px 0 16px;" />
        <p style="color:#9ca3af;font-size:0.8rem;margin:0;">— ${BRAND} Team &nbsp;|&nbsp; This is an automated message, please do not reply.</p>
      </div>
    </div>
  `;
}

// ── Booking Received (sent to user on booking creation) ──────
function bookingReceivedEmail(toEmail, bookingId, pickup, destination, goodsType) {
  return {
    from: FROM_ADDRESS(),
    to: toEmail,
    subject: `Booking Received — ${bookingId}`,
    html: wrap(
      BRAND_BLUE,
      "📦 Booking Received",
      `
      <p style="color:#374151;">Your booking has been successfully submitted. Our team will review it and contact you shortly with pricing details.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:0.9rem;">
        <tr style="background:#f0f9ff;">
          <td style="padding:10px 12px;color:#6b7280;width:40%;border-bottom:1px solid #e5e7eb;">Booking ID</td>
          <td style="padding:10px 12px;font-weight:700;color:#1d4ed8;border-bottom:1px solid #e5e7eb;">${bookingId}</td>
        </tr>
        <tr>
          <td style="padding:10px 12px;color:#6b7280;border-bottom:1px solid #e5e7eb;">From</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">${pickup}</td>
        </tr>
        <tr style="background:#f9fafb;">
          <td style="padding:10px 12px;color:#6b7280;border-bottom:1px solid #e5e7eb;">To</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">${destination}</td>
        </tr>
        <tr>
          <td style="padding:10px 12px;color:#6b7280;">Goods Type</td>
          <td style="padding:10px 12px;">${goodsType}</td>
        </tr>
      </table>
      <p style="color:#6b7280;font-size:0.9rem;">You will receive another email once your booking is confirmed and a truck is assigned.</p>
      `
    ),
  };
}

// ── Booking Confirmed (sent to user when admin confirms) ──────
function bookingConfirmedEmail(toEmail, userName, bookingId) {
  return {
    from: FROM_ADDRESS(),
    to: toEmail,
    subject: `✅ Booking Confirmed — ${bookingId}`,
    html: wrap(
      "#16a34a",
      "✅ Booking Confirmed!",
      `
      <p style="color:#374151;">Dear <strong>${userName || "Valued Customer"}</strong>,</p>
      <p style="color:#374151;">Great news! Your booking <strong style="color:#16a34a;">${bookingId}</strong> has been confirmed by our team.</p>
      <p style="color:#374151;">A truck and driver have been assigned to your shipment. Your goods are being prepared for transit.</p>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:14px 16px;margin:16px 0;">
        <p style="margin:0;color:#15803d;font-weight:600;">📍 You can track your booking anytime using Booking ID: <span style="color:#16a34a;">${bookingId}</span></p>
      </div>
      <p style="color:#6b7280;font-size:0.9rem;">Visit <a href="https://sairajroadlines.in/track" style="color:${BRAND_BLUE};">sairajroadlines.in/track</a> and enter your Booking ID to track in real-time.</p>
      `
    ),
  };
}

// ── Booking Delivered (sent to user when marked as Delivered) ─
function bookingDeliveredEmail(toEmail, userName, bookingId) {
  return {
    from: FROM_ADDRESS(),
    to: toEmail,
    subject: `🚛 Delivery Completed — ${bookingId}`,
    html: wrap(
      BRAND_DARK,
      "🚛 Delivery Completed!",
      `
      <p style="color:#374151;">Dear <strong>${userName || "Valued Customer"}</strong>,</p>
      <p style="color:#374151;">Your shipment for booking <strong>${bookingId}</strong> has been <strong style="color:#16a34a;">successfully delivered</strong>.</p>
      <p style="color:#374151;">Thank you for choosing <strong>${BRAND}</strong> for your logistics needs. We hope your experience was smooth and reliable.</p>
      <p style="color:#374151;">You can download your delivery report from your booking history page.</p>
      <p style="color:#374151;margin-top:16px;">We look forward to serving you again!</p>
      `
    ),
  };
}

// ── Admin: New Booking Alert (sent to admin when booking created) ──
function adminNewBookingEmail(toEmail, bookingId, pickup, destination, goodsType, userName, userPhone) {
  return {
    from: FROM_ADDRESS(),
    to: toEmail,
    subject: `🔔 New Booking Alert — ${bookingId}`,
    html: wrap(
      BRAND_BLUE,
      "🔔 New Booking Received",
      `
      <p style="color:#374151;">A new booking has been submitted and is awaiting your review and confirmation.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:0.9rem;">
        <tr style="background:#eff6ff;">
          <td style="padding:10px 12px;color:#6b7280;width:40%;border-bottom:1px solid #e5e7eb;">Booking ID</td>
          <td style="padding:10px 12px;font-weight:700;color:${BRAND_BLUE};border-bottom:1px solid #e5e7eb;">${bookingId}</td>
        </tr>
        <tr>
          <td style="padding:10px 12px;color:#6b7280;border-bottom:1px solid #e5e7eb;">Customer</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">${userName || "—"}</td>
        </tr>
        <tr style="background:#f9fafb;">
          <td style="padding:10px 12px;color:#6b7280;border-bottom:1px solid #e5e7eb;">Phone</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">${userPhone || "—"}</td>
        </tr>
        <tr>
          <td style="padding:10px 12px;color:#6b7280;border-bottom:1px solid #e5e7eb;">From</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">${pickup}</td>
        </tr>
        <tr style="background:#f9fafb;">
          <td style="padding:10px 12px;color:#6b7280;border-bottom:1px solid #e5e7eb;">To</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">${destination}</td>
        </tr>
        <tr>
          <td style="padding:10px 12px;color:#6b7280;">Goods Type</td>
          <td style="padding:10px 12px;">${goodsType}</td>
        </tr>
      </table>
      <p style="color:#6b7280;font-size:0.9rem;">
        <a href="https://sairajroadlines.in/admin/bookings" style="background:${BRAND_BLUE};color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600;display:inline-block;margin-top:8px;">
          → Open Admin Panel
        </a>
      </p>
      `
    ),
  };
}

module.exports = {
  bookingReceivedEmail,
  bookingConfirmedEmail,
  bookingDeliveredEmail,
  adminNewBookingEmail,
};
