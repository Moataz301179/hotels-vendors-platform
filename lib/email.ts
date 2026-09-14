import nodemailer from "nodemailer"

const smtpHost = process.env.SMTP_HOST || ""
const smtpPort = parseInt(process.env.SMTP_PORT || "465", 10)
const smtpUser = process.env.SMTP_USER || ""
const smtpPass = process.env.SMTP_PASS || ""
const emailFrom = process.env.EMAIL_FROM || "noreply@hotelprocure.com"
const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

let transporter: nodemailer.Transporter | null = null

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    })
  }
  return transporter
}

export async function sendVerificationEmail(email: string, token: string): Promise<boolean> {
  const verifyUrl = `${appUrl}/verify?token=${token}&email=${encodeURIComponent(email)}`

  if (!smtpHost || !smtpUser || !smtpPass) {
    console.log("[EMAIL] SMTP not configured. Verification URL:", verifyUrl)
    return false
  }

  try {
    await getTransporter().sendMail({
      from: emailFrom,
      to: email,
      subject: "Verify your HotelProcure account",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #6c5ce7;">Welcome to HotelProcure</h2>
          <p>Click the button below to verify your email address and activate your account.</p>
          <a href="${verifyUrl}"
             style="display: inline-block; padding: 12px 24px; background: #6c5ce7; color: #fff;
                    text-decoration: none; border-radius: 6px; margin: 16px 0;">
            Verify Email
          </a>
          <p style="color: #8b8b9e; font-size: 14px;">
            Or paste this link in your browser:<br/>
            <span style="color: #6c5ce7;">${verifyUrl}</span>
          </p>
          <p style="color: #8b8b9e; font-size: 12px;">This link expires in 24 hours.</p>
        </div>
      `,
    })
    return true
  } catch (error) {
    console.error("[EMAIL] Failed to send verification email:", error)
    return false
  }
}

export async function sendContactEmail(params: {
  name: string
  email: string
  company?: string
  message: string
  type: string
}): Promise<boolean> {
  const { name, email, company, message, type } = params

  if (!smtpHost || !smtpUser || !smtpPass) {
    console.log("[EMAIL] SMTP not configured. Contact message from:", email)
    return false
  }

  try {
    await getTransporter().sendMail({
      from: emailFrom,
      to: emailFrom,
      replyTo: email,
      subject: `[${type.toUpperCase()}] Contact from ${name}${company ? ` (${company})` : ""}`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #6c5ce7;">New Contact Inquiry</h2>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr><td style="padding: 8px; color: #8b8b9e;">Name</td><td style="padding: 8px;">${name}</td></tr>
            <tr><td style="padding: 8px; color: #8b8b9e;">Email</td><td style="padding: 8px;">${email}</td></tr>
            ${company ? `<tr><td style="padding: 8px; color: #8b8b9e;">Company</td><td style="padding: 8px;">${company}</td></tr>` : ""}
            <tr><td style="padding: 8px; color: #8b8b9e;">Type</td><td style="padding: 8px;">${type}</td></tr>
          </table>
          <div style="border-top: 1px solid #eee; padding-top: 16px;">
            <p style="color: #333;">${message}</p>
          </div>
        </div>
      `,
    })
    return true
  } catch (error) {
    console.error("[EMAIL] Failed to send contact email:", error)
    return false
  }
}

export async function sendInviteEmail(email: string, inviterName: string, token: string): Promise<boolean> {
  const inviteUrl = `${appUrl}/register?invite=${token}`

  if (!smtpHost || !smtpUser || !smtpPass) {
    console.log("[EMAIL] SMTP not configured. Invite URL:", inviteUrl)
    return false
  }

  try {
    await getTransporter().sendMail({
      from: emailFrom,
      to: email,
      subject: `${inviterName} invited you to HotelProcure`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #6c5ce7;">You've been invited</h2>
          <p><strong>${inviterName}</strong> has invited you to join their team on HotelProcure.</p>
          <a href="${inviteUrl}"
             style="display: inline-block; padding: 12px 24px; background: #6c5ce7; color: #fff;
                    text-decoration: none; border-radius: 6px; margin: 16px 0;">
            Accept Invitation
          </a>
        </div>
      `,
    })
    return true
  } catch (error) {
    console.error("[EMAIL] Failed to send invite email:", error)
    return false
  }
}
