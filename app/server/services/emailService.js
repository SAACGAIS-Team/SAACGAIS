import nodemailer from "nodemailer";
import logger from "./logger.js";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SUPPORT_EMAIL,
    pass: process.env.SUPPORT_EMAIL_PASSWORD,
  },
});

/**
 * Send an alert email to the support inbox.
 * Used for runtime errors and critical failures.
 */
export async function sendAlertEmail(subject, body) {
  try {
    await transporter.sendMail({
      from: `"SAACGAIS Alerts" <${process.env.SUPPORT_EMAIL}>`,
      to: process.env.SUPPORT_EMAIL,
      subject,
      text: body,
    });
  } catch (err) {
    logger.error("Failed to send alert email", { error: err.message });
  }
}

/**
 * Forward a user-submitted contact form message to the support inbox.
 */
export async function sendContactEmail({ name, email, message }) {
  await transporter.sendMail({
    from: `"SAACGAIS Support" <${process.env.SUPPORT_EMAIL}>`,
    to: process.env.SUPPORT_EMAIL,
    replyTo: email,
    subject: `Contact Form — ${name}`,
    text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
  });
}