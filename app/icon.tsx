import { ImageResponse } from "next/og";

export const size = {
  width: 32,
  height: 32,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "linear-gradient(135deg, #0f172a, #1e293b)",
          borderRadius: "9999px",
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
            border: "2px solid #f8fafc",
            borderRadius: "9999px",
            display: "flex",
            height: 22,
            justifyContent: "center",
            width: 22,
          }}
        >
          <div style={{ fontSize: 13, lineHeight: 1 }}>🦕</div>
        </div>
      </div>
    ),
    size
  );
}
