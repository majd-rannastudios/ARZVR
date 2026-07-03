"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"

interface Evo360LogoProps {
  /** "full" = badge icon + gradient text (default, for nav/sidebar) */
  /** "icon" = just the badge icon */
  /** "text" = just the gradient text wordmark */
  variant?: "full" | "icon" | "text"
  className?: string
  style?: React.CSSProperties
  /** Size of the icon badge in px (default 36) */
  iconSize?: number
}

export default function Evo360Logo({
  variant = "full",
  className,
  style,
  iconSize = 36,
}: Evo360LogoProps) {
  // evo360-duck.png is the first logo variant, white-removed, transparent background.
  // Native size: 3984×2032 (≈1.96:1).
  const dispW = iconSize * 2.2
  const dispH = dispW * (2032 / 3984)

  const Icon = (
    <div style={{ width: dispW, height: dispH, flexShrink: 0 }}>
      <Image
        src="/evo360-duck.png"
        alt="EVO 360"
        width={3984}
        height={2032}
        style={{ width: dispW, height: "auto", display: "block" }}
        priority
      />
    </div>
  )

  const Text = (
    <span
      className="font-heading tracking-widest evo-gradient-text select-none"
      style={{ fontFamily: "var(--font-heading)", fontSize: "inherit" }}
    >
      EVO 360
    </span>
  )

  if (variant === "icon") return <div className={cn(className)} style={style}>{Icon}</div>
  if (variant === "text") return <span className={cn(className)} style={style}>{Text}</span>

  return (
    <div className={cn("flex items-center gap-2.5", className)} style={style}>
      {Icon}
      {Text}
    </div>
  )
}
