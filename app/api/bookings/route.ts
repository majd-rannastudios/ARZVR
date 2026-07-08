import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createAdminClient } from "@/lib/supabase/admin"
import { sendConfirmationEmail } from "@/app/api/email/route"

const bookingSchema = z.object({
  id: z.string().min(1),
  date: z.string().min(1),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  sessionType: z.enum(["single", "private"]),
  machineCount: z.number().int().min(1).max(6),
  name: z.string().min(2),
  phone: z.string().min(7),
  email: z.email(),
  totalPrice: z.number().min(0),
  durationMinutes: z.number().int().min(1),
  createdAt: z.string().min(1),
})

// Finds or silently creates a Supabase Auth user for this email, so bookings
// are tied to a real account instead of only a browser-local ID list.
async function findOrCreateUserId(email: string): Promise<string | null> {
  const admin = createAdminClient()

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
  })
  if (!createErr) return created.user.id

  // Most likely cause: this email already has an account — look it up instead.
  const { data: list } = await admin.auth.admin.listUsers()
  const existing = list?.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
  if (existing) return existing.id

  console.error("Could not create or find user for booking:", createErr.message)
  return null
}

export async function POST(req: NextRequest) {
  const parsed = bookingSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.message }, { status: 400 })
  }
  const booking = parsed.data

  const admin = createAdminClient()
  const userId = await findOrCreateUserId(booking.email)

  const { error: insertError } = await admin.from("bookings").insert({
    id: booking.id,
    date: booking.date,
    start_time: booking.startTime,
    end_time: booking.endTime,
    session_type: booking.sessionType,
    machine_count: booking.machineCount,
    name: booking.name,
    phone: booking.phone,
    email: booking.email,
    total_price: booking.totalPrice,
    duration_minutes: booking.durationMinutes,
    status: "confirmed",
    created_at: booking.createdAt,
    user_id: userId,
  })

  if (insertError) {
    console.error("Booking insert error:", insertError.message)
    return NextResponse.json({ ok: false, error: insertError.message }, { status: 500 })
  }

  await sendConfirmationEmail("confirmed", {
    id: booking.id,
    name: booking.name,
    email: booking.email,
    date: booking.date,
    start_time: booking.startTime,
    end_time: booking.endTime,
    session_type: booking.sessionType,
    machine_count: booking.machineCount,
    total_price: booking.totalPrice,
    duration_minutes: booking.durationMinutes,
  })

  return NextResponse.json({ ok: true })
}
