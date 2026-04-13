import { isSaturday, isSunday } from "date-fns"

export type SessionType = "single" | "private"

export type SingleDuration = 15 | 30 | 60
export type PrivateDuration = 60 | 120

const SINGLE_WEEKDAY: Record<number, number> = { 15: 7, 30: 12, 60: 15 }
const SINGLE_WEEKEND: Record<number, number> = { 15: 10, 30: 15, 60: 20 }
const PRIVATE_WEEKDAY: Record<number, number> = { 60: 77, 120: 145 }
const PRIVATE_WEEKEND: Record<number, number> = { 60: 99, 120: 180 }

export function isWeekend(date: Date): boolean {
  return isSaturday(date) || isSunday(date)
}

export function getPricing(
  date: Date,
  sessionType: SessionType,
  durationMinutes: number
): number {
  const weekend = isWeekend(date)
  if (sessionType === "single") {
    const table = weekend ? SINGLE_WEEKEND : SINGLE_WEEKDAY
    return table[durationMinutes] ?? 0
  } else {
    const table = weekend ? PRIVATE_WEEKEND : PRIVATE_WEEKDAY
    return table[durationMinutes] ?? 0
  }
}

export function getSingleDurations(): { label: string; value: SingleDuration; weekday: number; weekend: number }[] {
  return [
    { label: "15 min", value: 15, weekday: 7, weekend: 10 },
    { label: "30 min", value: 30, weekday: 12, weekend: 15 },
    { label: "1 hour", value: 60, weekday: 15, weekend: 20 },
  ]
}

export function getPrivateDurations(): { label: string; value: PrivateDuration; weekday: number; weekend: number }[] {
  return [
    { label: "1 hour", value: 60, weekday: 77, weekend: 99 },
    { label: "2 hours", value: 120, weekday: 145, weekend: 180 },
  ]
}
