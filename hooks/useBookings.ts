"use client"

import { useLocalStorage } from "./useLocalStorage"
import { format } from "date-fns"

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
}

const STORAGE_KEY = "vrz_bookings"

export function generateBookingId(date: Date): string {
  const dateStr = format(date, "yyyyMMdd")
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  const random = Array.from(
    { length: 4 },
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join("")
  return `VRZ-${dateStr}-${random}`
}

export function useBookings() {
  const [bookings, setBookings] = useLocalStorage<Booking[]>(STORAGE_KEY, [])

  function addBooking(booking: Booking) {
    setBookings((prev) => [...prev, booking])
  }

  function cancelBooking(id: string) {
    setBookings((prev) => prev.filter((b) => b.id !== id))
  }

  function getBookingById(id: string): Booking | undefined {
    return bookings.find((b) => b.id === id)
  }

  return { bookings, addBooking, cancelBooking, getBookingById }
}
