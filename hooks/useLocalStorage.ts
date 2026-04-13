"use client"

import { useState, useEffect, useCallback } from "react"

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(initialValue)

  // Sync from storage once on mount
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key)
      if (item !== null) {
        setStoredValue(JSON.parse(item) as T)
      }
    } catch {
      // localStorage not available or JSON parse failed
    }
  }, [key])

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        setStoredValue((prev) => {
          const next = value instanceof Function ? value(prev) : value
          window.localStorage.setItem(key, JSON.stringify(next))
          return next
        })
      } catch {
        // localStorage write failed silently
      }
    },
    [key]
  )

  return [storedValue, setValue]
}
