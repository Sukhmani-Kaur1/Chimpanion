import { ImageResponse } from "next/og";

/** Brand colours, kept in step with app/globals.css. */
const INK = "#141412";
const PAPER = "#f5f5f0";
const LIME = "#bdf35a";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_TYPE = "image/png";

/** The brand's dot, drawn rather than typed — a text period becomes its own flex item and drifts. */
function Dot({ size, offset = 0 }: { size: number; offset?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size,
        background: LIME,
        marginLeft: size * 0.45,
        marginBottom: offset,
      }}
    />
  );
}

/**
 * The social share card, drawn at build time — no binary asset to keep in sync with the brand.
 * Echoes the hero: dark ground, lime disc bleeding off the top-right corner, the headline that
 * does the selling.
 */
export function ogCard() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: INK,
          color: PAPER,
          padding: 72,
          position: "relative",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -170,
            right: -120,
            width: 460,
            height: 460,
            borderRadius: 460,
            background: LIME,
          }}
        />
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            fontSize: 30,
            fontWeight: 700,
            letterSpacing: -1,
          }}
        >
          CHIMPANION
          <Dot size={9} offset={5} />
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 74,
            fontWeight: 700,
            lineHeight: 1.08,
            letterSpacing: -2.5,
            maxWidth: 900,
          }}
        >
          You paid for a website. What you wanted was customers.
        </div>
        <div style={{ display: "flex", fontSize: 25, color: "#a5a59a", letterSpacing: -0.3 }}>
          Web development · Custom software · Design · SEO · Market intelligence
        </div>
      </div>
    ),
    OG_SIZE
  );
}

/** The tab and bookmark mark: the wordmark's initial on the brand's dark ground. */
export function iconImage(size: number) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          background: INK,
          color: PAPER,
          fontFamily: "sans-serif",
          borderRadius: size * 0.22,
          paddingBottom: size * 0.17,
        }}
      >
        <div style={{ display: "flex", fontSize: size * 0.66, fontWeight: 700, lineHeight: 1 }}>C</div>
        <Dot size={size * 0.1} offset={size * 0.06} />
      </div>
    ),
    { width: size, height: size }
  );
}
