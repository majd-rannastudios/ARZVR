import type { MetadataRoute } from "next"
import { SITE_NAME } from "@/lib/site"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} — VR Hunting Lounge`,
    short_name: SITE_NAME,
    description:
      "Book your VR hunting session at EVO 360 in Byblos, Lebanon. 6 immersive machines, single sessions and private full-space rentals.",
    start_url: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#5EC4B0",
    icons: [
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/apple-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  }
}
