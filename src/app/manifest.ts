import type { MetadataRoute } from "next";
import { BUSINESS } from "@/lib/business";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: BUSINESS.name,
    short_name: "Hiruwa Tech",
    description: "Inventory, billing, and warranty management for Hiruwa Tech & Service.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ea580c",
    icons: [{ src: "/icon", sizes: "512x512", type: "image/png" }],
  };
}
