/**
 * Email Notifications — Hotels Vendors
 * Authority Matrix alerts, order updates, factoring events
 *
 * Uses Resend (free 3,000 emails/month) with SMTP fallback via nodemailer
 */

import nodemailer from "nodemailer";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@hotelsvendors.com";

interface EmailPayload {
  to: string[];
  subject: string;
  html: string;
  text?: string;
}

function getSmtpTransport() {
  if (!process.env.SMTP_HOST) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 465,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

async function sendViaResend(payload: EmailPayload): Promise<{ id: string }> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend failed: ${err}`);
  }
  return res.json();
}

async function sendViaSmtp(payload: EmailPayload): Promise<{ id: string }> {
  const transport = getSmtpTransport();
  if (!transport) throw new Error("No email transport configured");

  const info = await transport.sendMail({
    from: FROM_EMAIL,
    to: payload.to.join(", "),
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
  });

  return { id: info.messageId };
}

export async function sendEmail(payload: EmailPayload): Promise<{ id: string }> {
  if (RESEND_API_KEY) {
    return sendViaResend(payload);
  }
  const smtp = getSmtpTransport();
  if (smtp) {
    return sendViaSmtp(payload);
  }
  console.warn("[Email] No transport configured (set RESEND_API_KEY or SMTP_HOST). Email not sent:", payload.subject);
  return { id: "no-transport" };
}

// ── Template: Approval Required ──
export function approvalRequiredTemplate(params: {
  approverName: string;
  orderId: string;
  hotelName: string;
  supplierName: string;
  total: number;
  currency: string;
  orderUrl: string;
}): { subject: string; html: string } {
  const subject = `Approval Required: Order ${params.orderId} — ${params.total.toLocaleString()} ${params.currency}`;
  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1a1a1a;">
      <h2 style="color: #c41e3a;">Hotels Vendors — Approval Request</h2>
      <p>Hello ${params.approverName},</p>
      <p>A new purchase order requires your approval:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Order ID</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${params.orderId}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Hotel</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${params.hotelName}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Supplier</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${params.supplierName}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Total</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee; color: #c41e3a; font-weight: bold;">${params.total.toLocaleString()} ${params.currency}</td></tr>
      </table>
      <a href="${params.orderUrl}" style="display: inline-block; padding: 12px 24px; background: #c41e3a; color: white; text-decoration: none; border-radius: 6px; margin-top: 16px;">Review & Approve</a>
      <p style="margin-top: 24px; font-size: 12px; color: #666;">This is an automated message from Hotels Vendors Authority Matrix.</p>
    </div>
  `;
  return { subject, html };
}

// ── Template: Order Approved ──
export function orderApprovedTemplate(params: {
  requesterName: string;
  orderId: string;
  approverName: string;
  total: number;
  currency: string;
}): { subject: string; html: string } {
  const subject = `Order ${params.orderId} Approved`;
  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #22c55e;">✓ Order Approved</h2>
      <p>Hello ${params.requesterName},</p>
      <p>Your order <strong>${params.orderId}</strong> has been approved by ${params.approverName}.</p>
      <p style="font-size: 18px; color: #22c55e; font-weight: bold;">${params.total.toLocaleString()} ${params.currency}</p>
      <p>The supplier will be notified to begin fulfillment.</p>
    </div>
  `;
  return { subject, html };
}

// ── Template: Factoring Disbursed ──
export function factoringDisbursedTemplate(params: {
  supplierName: string;
  invoiceId: string;
  amount: number;
  currency: string;
  partnerName: string;
}): { subject: string; html: string } {
  const subject = `💰 Factoring Funds Disbursed — ${params.invoiceId}`;
  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #c41e3a;">Factoring Disbursement Complete</h2>
      <p>Hello ${params.supplierName},</p>
      <p>Your invoice has been funded through ${params.partnerName}:</p>
      <p style="font-size: 24px; color: #c41e3a; font-weight: bold;">${params.amount.toLocaleString()} ${params.currency}</p>
      <p>Funds will reach your account within 24 hours.</p>
    </div>
  `;
  return { subject, html };
}

// ── Template: Smart Fix Triggered ──
export function smartFixTemplate(params: {
  hotelName: string;
  orderId: string;
  fixType: string;
  description: string;
  actionUrl: string;
}): { subject: string; html: string } {
  const subject = `🔒 Smart Fix Applied: ${params.fixType} — Order ${params.orderId}`;
  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #f59e0b;">Risk Mitigation Alert</h2>
      <p>Hello ${params.hotelName},</p>
      <p>Our AI has detected a risk pattern on your order and applied an automatic safeguard:</p>
      <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; margin: 16px 0;">
        <strong>${params.fixType}</strong><br/>
        ${params.description}
      </div>
      <a href="${params.actionUrl}" style="display: inline-block; padding: 12px 24px; background: #c41e3a; color: white; text-decoration: none; border-radius: 6px;">Resolve Now</a>
    </div>
  `;
  return { subject, html };
}

// ── Template: Welcome Email ──
export function welcomeTemplate(params: {
  name: string;
  loginUrl: string;
}): { subject: string; html: string } {
  const subject = "Welcome to Hotels Vendors — Your Procurement Advantage Starts Now";
  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1a1a1a;">
      <h2 style="color: #8B0000;">Welcome aboard, ${params.name}</h2>
      <p>You have successfully joined Hotels Vendors — Egypt's smartest procurement platform for hospitality.</p>
      <div style="background: #fef2f2; border-left: 4px solid #8B0000; padding: 16px; margin: 16px 0;">
        <strong>What is next?</strong><br/>
        1. Verify your email address<br/>
        2. Complete your profile<br/>
        3. Start browsing 1,200+ verified suppliers
      </div>
      <a href="${params.loginUrl}" style="display: inline-block; padding: 12px 24px; background: #8B0000; color: white; text-decoration: none; border-radius: 6px; margin-top: 16px;">Log In to Your Account</a>
      <p style="margin-top: 24px; font-size: 12px; color: #666;">Need help? Reply to this email or contact us at hello@hotelsvendors.com</p>
    </div>
  `;
  return { subject, html };
}

// ── Template: Email Verification ──
export function emailVerificationTemplate(params: {
  name: string;
  verificationUrl: string;
}): { subject: string; html: string } {
  const subject = "Verify your email — Hotels Vendors";
  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1a1a1a;">
      <h2 style="color: #8B0000;">Verify your email address</h2>
      <p>Hello ${params.name},</p>
      <p>Please confirm your email address to activate your Hotels Vendors account.</p>
      <a href="${params.verificationUrl}" style="display: inline-block; padding: 12px 24px; background: #8B0000; color: white; text-decoration: none; border-radius: 6px; margin-top: 16px;">Verify Email Address</a>
      <p style="margin-top: 16px; font-size: 13px; color: #666;">This link expires in 24 hours. If you did not create an account, you can safely ignore this email.</p>
      <p style="margin-top: 8px; font-size: 12px; color: #666;">If the button does not work, copy and paste this link:<br/>${params.verificationUrl}</p>
    </div>
  `;
  return { subject, html };
}

// ── Template: Password Reset ──
export function passwordResetTemplate(params: {
  name: string;
  resetUrl: string;
}): { subject: string; html: string } {
  const subject = "Reset your Hotels Vendors password";
  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1a1a1a;">
      <h2 style="color: #8B0000;">Password reset requested</h2>
      <p>Hello ${params.name},</p>
      <p>We received a request to reset your password. Click the button below to set a new password. This link expires in 24 hours.</p>
      <a href="${params.resetUrl}" style="display: inline-block; padding: 12px 24px; background: #8B0000; color: white; text-decoration: none; border-radius: 6px; margin-top: 16px;">Reset Password</a>
      <p style="margin-top: 16px; font-size: 13px; color: #666;">If you did not request this reset, your account is secure — no changes have been made.</p>
      <p style="margin-top: 8px; font-size: 12px; color: #666;">If the button does not work, copy and paste this link:<br/>${params.resetUrl}</p>
    </div>
  `;
  return { subject, html };
}

// ── Template: Password Reset Confirmation ──
export function passwordResetConfirmationTemplate(params: {
  name: string;
}): { subject: string; html: string } {
  const subject = "Your password has been reset";
  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1a1a1a;">
      <h2 style="color: #8B0000;">Password updated successfully</h2>
      <p>Hello ${params.name},</p>
      <p>Your Hotels Vendors password has been changed. You can now log in with your new password.</p>
      <p style="margin-top: 16px; font-size: 13px; color: #666;">If you did not make this change, please contact us immediately at hello@hotelsvendors.com.</p>
    </div>
  `;
  return { subject, html };
}
