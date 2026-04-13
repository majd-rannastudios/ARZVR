import type { Booking } from "@/hooks/useBookings"

/** True if two time ranges overlap (exclusive end boundary) */
function timesOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  return start1 < end2 && end1 > start2
}

/** Returns bookings on a specific date that overlap the given window */
function overlappingBookings(
  bookings: Booking[],
  date: string,
  startTime: string,
  endTime: string
): Booking[] {
  return bookings.filter(
    (b) =>
      b.date === date &&
      timesOverlap(startTime, endTime, b.startTime, b.endTime)
  )
}

/** How many machines are free for a given date/time window.
 *  Returns 0 if a private booking occupies that window. */
export function getAvailableMachineCount(
  bookings: Booking[],
  date: string,
  startTime: string,
  endTime: string
): number {
  const overlapping = overlappingBookings(bookings, date, startTime, endTime)
  if (overlapping.some((b) => b.sessionType === "private")) return 0
  const taken = overlapping
    .filter((b) => b.sessionType === "single")
    .reduce((sum, b) => sum + b.machineCount, 0)
  return Math.max(0, 6 - taken)
}

/** Hard conflict check for single-machine bookings.
 *  Returns true if not enough machines are free. */
export function hasSingleConflict(
  bookings: Booking[],
  date: string,
  startTime: string,
  endTime: string,
  requestedCount: number
): boolean {
  return getAvailableMachineCount(bookings, date, startTime, endTime) < requestedCount
}

/** Soft conflict check for private bookings.
 *  Returns true if ANY existing booking overlaps the window. */
export function hasPrivateConflict(
  bookings: Booking[],
  date: string,
  startTime: string,
  endTime: string
): boolean {
  return overlappingBookings(bookings, date, startTime, endTime).length > 0
}

/** Legacy helper kept for MachineCard display use. */
export function getAvailableMachines(
  bookings: Booking[],
  date: string,
  startTime: string,
  endTime: string
): number[] {
  const count = getAvailableMachineCount(bookings, date, startTime, endTime)
  return Array.from({ length: count }, (_, i) => i + 1)
}
