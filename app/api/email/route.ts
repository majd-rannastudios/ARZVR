import { Resend } from "resend"
import { NextRequest, NextResponse } from "next/server"

const FROM = "VRZ Byblos <noreply@vrz.lb>"

export interface EmailBooking {
  id: string
  name: string
  email: string
  date: string
  start_time: string
  end_time: string
  session_type: string
  machine_count: number
  total_price: number
  duration_minutes: number
}

type EmailType = "confirmed" | "updated" | "cancelled" | "completed"

function sessionLabel(b: EmailBooking) {
  return b.session_type === "private"
    ? "Private Full-Space (6 stations)"
    : `${b.machine_count} station${b.machine_count > 1 ? "s" : ""}`
}

function buildHtml(type: EmailType, b: EmailBooking): { subject: string; html: string } {
  const configs: Record<EmailType, { subject: string; headline: string; color: string; message: string }> = {
    confirmed: {
      subject: `Booking Confirmed — ${b.id}`,
      headline: "You're locked in. 🎯",
      color: "#00FF7F",
      message: "Your VR hunting session is confirmed. Show up ready — sessions start on time.",
    },
    updated: {
      subject: `Booking Updated — ${b.id}`,
      headline: "Your booking has been updated.",
      color: "#FFBA00",
      message: "Your reservation details have been changed by our team. Review below and contact us if anything looks off.",
    },
    cancelled: {
      subject: `Booking Cancelled — ${b.id}`,
      headline: "Booking cancelled.",
      color: "#ff4444",
      message: "Your booking has been cancelled. If this was a mistake, reach out to us on WhatsApp.",
    },
    completed: {
      subject: `Thanks for hunting with VRZ — ${b.id}`,
      headline: "Good session. 🔫",
      color: "#00FF7F",
      message: "Hope the hunt was intense. Come back anytime — your stats are waiting.",
    },
  }

  const { subject, headline, color, message } = configs[type]

  const detailRow = (label: string, value: string) => `
    <tr>
      <td style="padding:8px 0;color:#888;font-size:13px;border-bottom:1px solid #1a1a1a;">${label}</td>
      <td style="padding:8px 0;color:#eee;font-size:13px;text-align:right;border-bottom:1px solid #1a1a1a;">${value}</td>
    </tr>`

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#000;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#000;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">

        <!-- Logo -->
        <tr><td style="padding-bottom:32px;text-align:center;">
          <span style="font-size:36px;font-weight:900;letter-spacing:8px;color:#fff;">VRZ</span>
          <div style="width:32px;height:2px;background:${color};margin:8px auto 0;border-radius:2px;box-shadow:0 0 8px ${color};"></div>
        </td></tr>

        <!-- Card -->
        <tr><td style="background:#0d0d0d;border:1px solid #1f1f1f;border-radius:12px;padding:32px;">

          <!-- Headline -->
          <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#fff;">${headline}</p>
          <p style="margin:0 0 28px;font-size:14px;color:#666;">${message}</p>

          <!-- Booking ID badge -->
          <div style="background:#111;border:1px solid #222;border-radius:8px;padding:10px 14px;margin-bottom:24px;display:inline-block;">
            <span style="font-family:monospace;font-size:15px;color:${color};letter-spacing:1px;">${b.id}</span>
          </div>

          ${type !== "cancelled" && type !== "completed" ? `
          <!-- Details table -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            ${detailRow("Date", new Date(b.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }))}
            ${detailRow("Time", `${b.start_time} – ${b.end_time} (${b.duration_minutes} min)`)}
            ${detailRow("Session", sessionLabel(b))}
            ${detailRow("Guest", b.name)}
            ${detailRow("Amount", `$${b.total_price}`)}
          </table>` : ""}

          <!-- Location -->
          <div style="background:#111;border-radius:8px;padding:14px;margin-bottom:24px;">
            <p style="margin:0 0 4px;font-size:12px;color:#555;text-transform:uppercase;letter-spacing:1px;">Location</p>
            <p style="margin:0;font-size:14px;color:#ccc;">VRZ — VR Hunting Lounge, Byblos, Lebanon</p>
            <p style="margin:4px 0 0;font-size:13px;color:#555;">Open daily 3 PM – 11 PM</p>
          </div>

          <!-- WhatsApp CTA -->
          <p style="margin:0;font-size:13px;color:#555;">
            Questions? <a href="https://wa.me/96170000000" style="color:${color};text-decoration:none;">WhatsApp us →</a>
          </p>

        </td></tr>

        <!-- Footer -->
        <tr><td style="padding-top:24px;text-align:center;">
          <p style="margin:0;font-size:11px;color:#333;">VRZ · Byblos, Lebanon · vrz.lb</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`

  return { subject, html }
}

export async function POST(req: NextRequest) {
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ ok: false, error: "Email not configured" }, { status: 200 })
  }

  const { type, booking }: { type: EmailType; booking: EmailBooking } = await req.json()
  if (!booking?.email) return NextResponse.json({ ok: false, error: "No email" }, { status: 200 })

  const { subject, html } = buildHtml(type, booking)

  const resend = new Resend(process.env.RESEND_API_KEY)
  const { error } = await resend.emails.send({ from: FROM, to: booking.email, subject, html })
  if (error) {
    console.error("Email send error:", error)
    return NextResponse.json({ ok: false, error: error.message }, { status: 200 })
  }

  return NextResponse.json({ ok: true })
}
