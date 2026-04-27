"use client"

import { useState, useEffect, useCallback } from "react"
import { format } from "date-fns"
import { createClient } from "@/lib/supabase/client"
import { sendBookingEmail } from "@/lib/sendEmail"

export interface Booking {
  id: string
  date: string           // "YYYY-MM-DD"
  startTime: string      // "HH:MM"
  endTime: string        // "HH:MM"
  sessionType: "single" | "private"
  machineCount: number   // 1–6 for single; 6 for private
  name: string
  phone: string
  email: string
  totalPrice: number
  durationMinutes: number
  createdAt: string      // ISO timestamp
  status?: string
}

const LS_KEY = "vrz_bookings"

export function generateBookingId(date: Date): string {
  const dateStr = format(date, "yyyyMMdd")
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  const random = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
  return `VRZ-${dateStr}-${random}`
}

function fromRow(row: Record<string, unknown>): Booking {
  return {
    id: row.id as string,
    date: row.date as string,
    startTime: row.start_time as string,
    endTime: row.end_time as string,
    sessionType: row.session_type as "single" | "private",
    machineCount: row.machine_count as number,
    name: row.name as string,
    phone: row.phone as string,
    email: row.email as string,
    totalPrice: row.total_price as number,
    durationMinutes: row.duration_minutes as number,
    createdAt: row.created_at as string,
    status: (row.status as string) ?? "confirmed",
  }
}

// Used by BookingSection for conflict checking + adding bookings
export function useBookings() {
  const [bookings, setBookings] = useState<Booking[]>([])

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from("bookings")
      .select("id, date, start_time, end_time, session_type, machine_count, status")
      .neq("status", "cancelled")
      .then(({ data }) => {
        if (data) setBookings(data.map(fromRow))
      })
  }, [])

  const addBooking = useCallback(async (booking: Booking) => {
    const supabase = createClient()
    await supabase.from("bookings").insert({
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
    })

    // Mirror to localStorage so /bookings page works without auth
    const stored: Booking[] = JSON.parse(localStorage.getItem(LS_KEY) ?? "[]")
    localStorage.setItem(LS_KEY, JSON.stringify([booking, ...stored]))

    setBookings((prev) => [booking, ...prev])

    sendBookingEmail("confirmed", {
      id: booking.id, name: booking.name, email: booking.email,
      date: booking.date, start_time: booking.startTime, end_time: booking.endTime,
      session_type: booking.sessionType, machine_count: booking.machineCount,
      total_price: booking.totalPrice, duration_minutes: booking.durationMinutes,
    })
  }, [])

  const cancelBooking = useCallback(async (id: string) => {
    const supabase = createClient()
    await supabase.from("bookings").update({ status: "cancelled" }).eq("id", id)
    const stored: Booking[] = JSON.parse(localStorage.getItem(LS_KEY) ?? "[]")
    localStorage.setItem(LS_KEY, JSON.stringify(stored.filter((b) => b.id !== id)))
    setBookings((prev) => prev.filter((b) => b.id !== id))
  }, [])

  return { bookings, addBooking, cancelBooking }
}

// Used by /bookings customer page — shows their own bookings from localStorage IDs
export function useLocalBookings() {
  const [bookings, setBookings] = useState<Booking[]>([])

  useEffect(() => {
    const supabase = createClient()
    const localBookings: Booking[] = JSON.parse(localStorage.getItem(LS_KEY) ?? "[]")
    const ids = localBookings.map((b) => b.id)
    if (ids.length === 0) { setBookings([]); return }

    supabase
      .from("bookings")
      .select("*")
      .in("id", ids)
      .then(({ data }) => {
        if (data) setBookings(data.map(fromRow))
      })
  }, [])

  const cancelBooking = useCallback(async (id: string) => {
    const supabase = createClient()
    await supabase.from("bookings").update({ status: "cancelled" }).eq("id", id)
    const stored: Booking[] = JSON.parse(localStorage.getItem(LS_KEY) ?? "[]")
    localStorage.setItem(LS_KEY, JSON.stringify(stored.filter((b) => b.id !== id)))
    setBookings((prev) => prev.filter((b) => b.id !== id))
  }, [])

  return { bookings, cancelBooking }
}
