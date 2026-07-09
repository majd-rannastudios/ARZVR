import { ImageResponse } from "next/og"
import { readFile } from "node:fs/promises"
import { join } from "node:path"

export const alt = "EVO 360 — VR Hunting Lounge in Byblos, Lebanon"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function Image() {
  const headPng = await readFile(join(process.cwd(), "public/evo360-duck-head.png"))
  const headSrc = `data:image/png;base64,${headPng.toString("base64")}`

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#000000",
          backgroundImage:
            "radial-gradient(ellipse 70% 70% at 30% 50%, rgba(94,196,176,0.18), transparent), radial-gradient(ellipse 60% 60% at 85% 30%, rgba(107,143,238,0.16), transparent)",
        }}
      >
        {/* next/og's ImageResponse (Satori) requires a plain <img>, not next/image */}
        <img
          src={headSrc}
          alt=""
          width={420}
          height={480}
          style={{ objectFit: "contain", marginRight: 48 }}
        />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 108, fontWeight: 700, color: "#ffffff", letterSpacing: -2 }}>
            EVO 360
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 30,
              color: "#5EC4B0",
              letterSpacing: 6,
              textTransform: "uppercase",
              marginTop: 8,
            }}
          >
            Enter the Hunt
          </div>
          <div style={{ display: "flex", fontSize: 24, color: "#999999", marginTop: 20 }}>
            VR Hunting Lounge · Byblos, Lebanon
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
