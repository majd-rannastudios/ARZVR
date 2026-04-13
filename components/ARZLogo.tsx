"use client"

import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

interface ARZLogoProps {
  className?: string
  style?: React.CSSProperties
}

export default function ARZLogo({ className, style }: ARZLogoProps) {
  const [isV, setIsV] = useState(false)
  const [isElectric, setIsElectric] = useState(false)

  const timers = useRef<{
    t0?: ReturnType<typeof setTimeout>
    t1?: ReturnType<typeof setTimeout>
    flip?: ReturnType<typeof setInterval>
    electric?: ReturnType<typeof setInterval>
  }>({})

  function zap() {
    setIsElectric(true)
    setTimeout(() => setIsElectric(false), 560)
  }

  useEffect(() => {
    // Initial reveal: ARZ → VRZ after 1 s
    timers.current.t0 = setTimeout(() => {
      setIsV(true)

      // Flip V→A→V every 4 s
      timers.current.flip = setInterval(() => {
        setIsV(false)
        setTimeout(() => setIsV(true), 680)
      }, 4000)

      // First electric zap at 2.5 s after reveal, then every 5.5 s
      timers.current.t1 = setTimeout(() => {
        zap()
        timers.current.electric = setInterval(zap, 5500)
      }, 2500)
    }, 1000)

    return () => {
      clearTimeout(timers.current.t0)
      clearTimeout(timers.current.t1)
      clearInterval(timers.current.flip)
      clearInterval(timers.current.electric)
    }
  }, [])

  return (
    <span
      className={cn(isElectric ? "vrz-electrify" : "vrz-glitch", className)}
      style={style}
    >
      {/* Flip container — only the first letter animates */}
      <span style={{ display: "inline-block", perspective: "600px" }}>
        <span
          style={{
            display: "inline-block",
            transformStyle: "preserve-3d",
            transition: "transform 0.7s cubic-bezier(0.68, -0.4, 0.27, 1.4)",
            transform: isV ? "rotateX(180deg)" : "rotateX(0deg)",
            position: "relative",
            lineHeight: "inherit",
          }}
        >
          {/* Front face — "A" */}
          <span
            style={{
              display: "inline-block",
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
            }}
          >
            A
          </span>

          {/* Back face — "V" */}
          <span
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateX(180deg)",
              color: "#00FF7F",
              textShadow: "0 0 30px #00FF7F80, 0 0 60px #00FF7F30",
            }}
          >
            V
          </span>
        </span>
      </span>

      {/* Static letters */}
      RZ
    </span>
  )
}
