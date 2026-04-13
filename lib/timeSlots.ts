export interface TimeSlot {
  startTime: string // "HH:MM"
  endTime: string   // "HH:MM"
  label: string     // "3:00 PM – 3:15 PM"
}

/** Generate all possible 15-min-granularity slots for a given session duration.
 *  Operating hours: 15:00 – 23:00. Last slot must END by 23:00. */
export function generateSlots(durationMinutes: number): TimeSlot[] {
  const slots: TimeSlot[] = []
  const startMinutes = 15 * 60  // 15:00
  const closingMinutes = 23 * 60 // 23:00

  let cursor = startMinutes
  while (cursor + durationMinutes <= closingMinutes) {
    const endCursor = cursor + durationMinutes
    slots.push({
      startTime: minutesToHHMM(cursor),
      endTime: minutesToHHMM(endCursor),
      label: `${minutesTo12h(cursor)} – ${minutesTo12h(endCursor)}`,
    })
    cursor += 15 // 15-min granularity
  }
  return slots
}

function minutesToHHMM(total: number): string {
  const h = Math.floor(total / 60)
  const m = total % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

function minutesTo12h(total: number): string {
  const h = Math.floor(total / 60)
  const m = total % 60
  const suffix = h >= 12 ? "PM" : "AM"
  const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h
  return m === 0 ? `${h12} ${suffix}` : `${h12}:${String(m).padStart(2, "0")} ${suffix}`
}
