import { ImageResponse } from "next/og";
import { LOGO_DATA_URI } from "@/lib/logo-data";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0d0d0d",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={LOGO_DATA_URI} alt="" width={160} height={160} style={{ objectFit: "contain" }} />
      </div>
    ),
    size
  );
}
