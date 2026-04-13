"use client"

import { useEffect, useState } from "react"

type CursorMode = "default" | "pointer" | "text"

const CLICKABLE =
  "button, a, [role='button'], [tabindex]:not([tabindex='-1']), select, label, " +
  "input[type='checkbox'], input[type='radio'], input[type='submit'], input[type='button'], input[type='reset']"

const TEXT_ELS =
  "input:not([type='checkbox']):not([type='radio']):not([type='submit']):not([type='button']):not([type='reset']), " +
  "textarea, [contenteditable='true']"

export default function CustomCursor() {
  const [pos, setPos] = useState({ x: -200, y: -200 })
  const [mode, setMode] = useState<CursorMode>("default")
  const [visible, setVisible] = useState(false)
  const [pressing, setPressing] = useState(false)

  useEffect(() => {
    function getMode(el: Element): CursorMode {
      if (el.closest(TEXT_ELS)) return "text"
      if (el.closest(CLICKABLE)) return "pointer"
      return "default"
    }

    function onMove(e: MouseEvent) {
      setPos({ x: e.clientX, y: e.clientY })
      setVisible(true)
      setMode(getMode(e.target as Element))
    }

    const onLeave = () => setVisible(false)
    const onEnter = () => setVisible(true)
    const onDown = () => setPressing(true)
    const onUp = () => setPressing(false)

    document.addEventListener("mousemove", onMove)
    document.addEventListener("mouseleave", onLeave)
    document.addEventListener("mouseenter", onEnter)
    document.addEventListener("mousedown", onDown)
    document.addEventListener("mouseup", onUp)
    return () => {
      document.removeEventListener("mousemove", onMove)
      document.removeEventListener("mouseleave", onLeave)
      document.removeEventListener("mouseenter", onEnter)
      document.removeEventListener("mousedown", onDown)
      document.removeEventListener("mouseup", onUp)
    }
  }, [])

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        top: pos.y,
        left: pos.x,
        zIndex: 99999,
        pointerEvents: "none",
        transform: "translate(-50%, -50%)",
        willChange: "top, left",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.15s",
      }}
    >
      {/* ── Default: crosshair target ── */}
      {mode === "default" && (
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="16" cy="16" r="11" stroke="#00FF7F" strokeWidth="1.5" />
          <circle cx="16" cy="16" r="4"  stroke="#00FF7F" strokeWidth="1.5" />
          <circle cx="16" cy="16" r="1.5" fill="#00FF7F" />
          <line x1="16" y1="1"  x2="16" y2="10" stroke="#00FF7F" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="16" y1="22" x2="16" y2="31" stroke="#00FF7F" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="1"  y1="16" x2="10" y2="16" stroke="#00FF7F" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="22" y1="16" x2="31" y2="16" stroke="#00FF7F" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )}

      {/* ── Pointer: sniper scope ── */}
      {mode === "pointer" && (
        <div
          style={{
            position: "relative",
            width: 36,
            height: 36,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: pressing ? "scale(0.82)" : "scale(1)",
            transition: "transform 0.1s ease",
          }}
        >
          {/* outer rotating dashed ring */}
          <div className="vrz-cursor-ring-outer" />
          {/* inner static ring */}
          <div
            style={{
              position: "absolute",
              width: 14,
              height: 14,
              borderRadius: "50%",
              border: "1px solid #00FF7F80",
            }}
          />
          {/* pulsing center dot */}
          <div className="vrz-cursor-dot" />
        </div>
      )}

      {/* ── Text: green I-beam ── */}
      {mode === "text" && (
        <svg width="16" height="26" viewBox="0 0 16 26" fill="none" xmlns="http://www.w3.org/2000/svg">
          <line x1="3"  y1="2"  x2="13" y2="2"  stroke="#00FF7F" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="8"  y1="2"  x2="8"  y2="24" stroke="#00FF7F" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="3"  y1="24" x2="13" y2="24" stroke="#00FF7F" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )}
    </div>
  )
}
