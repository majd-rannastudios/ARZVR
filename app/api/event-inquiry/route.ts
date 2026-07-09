import { Resend } from "resend"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { EMAIL_FROM, OWNER_EMAIL, SITE_NAME } from "@/lib/site"

const inquirySchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(7),
  email: z.email(),
  eventType: z.string().min(1),
  eventDate: z.string().min(1),
  location: z.string().min(3),
  guestCount: z.string().min(1),
  message: z.string().optional(),
})

const detailRow = (label: string, value: string) => `
  <tr>
    <td style="padding:8px 0;color:#888;font-size:13px;border-bottom:1px solid #1a1a1a;">${label}</td>
    <td style="padding:8px 0;color:#eee;font-size:13px;text-align:right;border-bottom:1px solid #1a1a1a;">${value}</td>
  </tr>`

function ownerEmailHtml(i: z.infer<typeof inquirySchema>) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#000;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#000;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">
        <tr><td style="padding-bottom:32px;text-align:center;">
          <span style="font-size:36px;font-weight:900;letter-spacing:8px;color:#fff;">EVO 360</span>
          <div style="width:32px;height:2px;background:#5EC4B0;margin:8px auto 0;border-radius:2px;box-shadow:0 0 8px #5EC4B0;"></div>
        </td></tr>
        <tr><td style="background:#0d0d0d;border:1px solid #1f1f1f;border-radius:12px;padding:32px;">
          <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#fff;">New event inquiry</p>
          <p style="margin:0 0 28px;font-size:14px;color:#666;">Someone wants to book EVO 360 for an off-site event.</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            ${detailRow("Event type", i.eventType)}
            ${detailRow("Date", i.eventDate)}
            ${detailRow("Location", i.location)}
            ${detailRow("Guests", i.guestCount)}
            ${detailRow("Name", i.name)}
            ${detailRow("Phone", i.phone)}
            ${detailRow("Email", i.email)}
          </table>
          ${i.message ? `<div style="background:#111;border-radius:8px;padding:14px;">
            <p style="margin:0 0 4px;font-size:12px;color:#555;text-transform:uppercase;letter-spacing:1px;">Message</p>
            <p style="margin:0;font-size:14px;color:#ccc;">${i.message}</p>
          </div>` : ""}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function requesterEmailHtml(i: z.infer<typeof inquirySchema>) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#000;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#000;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">
        <tr><td style="padding-bottom:32px;text-align:center;">
          <span style="font-size:36px;font-weight:900;letter-spacing:8px;color:#fff;">EVO 360</span>
          <div style="width:32px;height:2px;background:#5EC4B0;margin:8px auto 0;border-radius:2px;box-shadow:0 0 8px #5EC4B0;"></div>
        </td></tr>
        <tr><td style="background:#0d0d0d;border:1px solid #1f1f1f;border-radius:12px;padding:32px;">
          <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#fff;">Got your request. 🎯</p>
          <p style="margin:0 0 24px;font-size:14px;color:#666;">
            Thanks for reaching out about bringing ${SITE_NAME} to your ${i.eventType.toLowerCase()}.
            We'll be in touch shortly to work out details and a quote.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0">
            ${detailRow("Event type", i.eventType)}
            ${detailRow("Date", i.eventDate)}
            ${detailRow("Location", i.location)}
            ${detailRow("Guests", i.guestCount)}
          </table>
        </td></tr>
        <tr><td style="padding-top:24px;text-align:center;">
          <p style="margin:0;font-size:11px;color:#333;">EVO 360 · Byblos, Lebanon</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export async function POST(req: NextRequest) {
  const parsed = inquirySchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.message }, { status: 400 })
  }
  const inquiry = parsed.data

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ ok: false, error: "Email not configured" }, { status: 200 })
  }

  const resend = new Resend(process.env.RESEND_API_KEY)

  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: OWNER_EMAIL,
    replyTo: inquiry.email,
    subject: `Event inquiry — ${inquiry.eventType} on ${inquiry.eventDate}`,
    html: ownerEmailHtml(inquiry),
  })
  if (error) {
    console.error("Event inquiry email error:", error.message)
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  await resend.emails.send({
    from: EMAIL_FROM,
    to: inquiry.email,
    subject: "We got your event request — EVO 360",
    html: requesterEmailHtml(inquiry),
  })

  return NextResponse.json({ ok: true })
}
