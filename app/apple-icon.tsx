import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "linear-gradient(135deg, #0f172a, #1e293b)",
          borderRadius: "32px",
          display: "flex",
          height: "100%",
          justifyContent: "center",
          width: "100%",
        }}
      >
        <div
          style={{
            alignItems: "center",
            background: "#86efac",
            border: "10px solid #f8fafc",
            borderRadius: "9999px",
            display: "flex",
            height: 124,
            justifyContent: "center",
            width: 124,
          }}
        >
          <div style={{ fontSize: 72, lineHeight: 1 }}>🦕</div>
        </div>
      </div>
    ),
    size
  );
}
