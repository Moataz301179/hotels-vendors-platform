import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendContactEmail } from "@/lib/email"
import { ok, error } from "@/lib/api-response"

const validTypes = ["support", "marketing", "general"] as const
type InquiryType = (typeof validTypes)[number]

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, company, phone, message, inquiryType } = body

    if (!name || !email || !message) {
      return error("Name, email, and message are required")
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return error("Invalid email address")
    }

    const type: InquiryType = validTypes.includes(inquiryType) ? inquiryType : "general"

    await prisma.leadCapture.create({
      data: {
        id: `lead_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
        companyName: company || name,
        email: email.toLowerCase(),
        sector: "HOTEL",
        role: type,
        message,
        source: "contact-form",
        status: "new",
        updatedAt: new Date(),
      },
    })

    const sent = await sendContactEmail({ name, email, company, message, type })

    return ok({
      message: "Message received. We'll get back to you within 24 hours.",
      emailSent: sent,
    })
  } catch (err) {
    console.error("[CONTACT]", err)
    return error("Failed to send message. Please try again.", 500)
  }
}
