import type { EmailBooking } from "@/app/api/email/route"

type EmailType = "confirmed" | "updated" | "cancelled" | "completed"

export async function sendBookingEmail(type: EmailType, booking: EmailBooking) {
  try {
    await fetch("/api/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, booking }),
    })
  } catch {
    // Non-critical — don't block UI on email failures
  }
}
