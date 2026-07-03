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
  // The source PNG is a tall sheet of 4 logo variants stacked.
  // At display width W, natural height = W * (9665/4500).
  // First variant occupies the top ~25% of that.
  // We clip to show only the first logo (duck + EVO/360 text).
  const sheetW = iconSize * 2.2          // display width of the full sheet image
  const sheetH = sheetW * (9665 / 4500)  // natural display height of the full sheet
  const clipH  = sheetH * 0.235          // first variant height (≈ top 23.5%)

  const Icon = (
    <div
      style={{ width: iconSize * 2.2, height: clipH, overflow: "hidden", flexShrink: 0 }}
      className="rounded-lg bg-white"
    >
      <Image
        src="/evo360-logo.png"
        alt="EVO 360"
        width={4500}
        height={9665}
        style={{ width: sheetW, height: "auto", display: "block" }}
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
