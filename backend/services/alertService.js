const nodemailer = require('nodemailer');

/**
 * Creates a reusable transporter.
 * If EMAIL_USER is not configured, falls back to mock (console log).
 */
function createTransporter() {
  if (!process.env.EMAIL_USER) return null;

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

/**
 * Sends an alert email when a monitor changes status.
 * Falls back to console.log if email is not configured (useful for dev).
 */
async function sendAlert({ to, userName, monitorName, url, status }) {
  const subject =
    status === 'DOWN'
      ? `🔴 ALERT: ${monitorName} is DOWN`
      : `🟢 RESOLVED: ${monitorName} is back UP`;

  const text =
    status === 'DOWN'
      ? `Hi ${userName},\n\nYour monitored URL "${monitorName}" (${url}) is currently DOWN.\n\nPlease check your service.\n\n— URL Monitor`
      : `Hi ${userName},\n\nGood news! Your monitored URL "${monitorName}" (${url}) is back UP.\n\n— URL Monitor`;

  const transporter = createTransporter();

  if (!transporter) {
    // Mock alert — log to console in development
    console.log(`\n[MOCK ALERT] To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${text}\n`);
    return;
  }

  try {
    await transporter.sendMail({
      from: `"URL Monitor" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
    });
    console.log(`[Alert] Email sent to ${to} — ${subject}`);
  } catch (err) {
    console.error('[Alert] Failed to send email:', err.message);
  }
}

module.exports = { sendAlert };
