/**
 * The mark: the app's first letter with a pair of eyes above it, a face. Drawn on a 100 × 120
 * grid. The letter is one closed path (a heavy ring, its hole cut by the even-odd rule) so it
 * reads at 29px; the eyes are two circles symmetrical about the letter's middle.
 *
 * brand/*.svg and scripts/brand-assets.mjs draw the same shapes; the splash's seam in
 * globals.css (--splash-seam and .splash-eyes) is set to the eyes' height on the tile.
 */

/** The letter: an O, outer radius 42 and inner 20, centred at (50, 74). */
export const LETTER_PATH =
  "M50 32a42 42 0 1 1 0 84a42 42 0 1 1 0-84Z M50 54a20 20 0 1 0 0 40a20 20 0 1 0 0-40Z";

/** The eyes' centres and radius on the mark's grid. */
export const EYES = { y: 13, left: 33, right: 67, r: 9 };

/** Where the face sits on the 512-unit tile: 2.6 × the grid, centred. Eyes at y ≈ 136 (26.6%). */
export const ON_TILE = "translate(126 100) scale(2.6)";

export function MarkLetter() {
  return <path d={LETTER_PATH} fillRule="evenodd" />;
}

/** Two eyes, each closing about its own middle (.mark-eye in globals.css). */
export function MarkEyes() {
  return (
    <>
      {[EYES.left, EYES.right].map((x) => (
        <circle
          key={x}
          className="mark-eye"
          cx={x}
          cy={EYES.y}
          r={EYES.r}
          style={{ transformBox: "fill-box", transformOrigin: "center" }}
        />
      ))}
    </>
  );
}

/** The face at a given height, in the current text colour. Eyes shut when it is content. */
export function Mark({ height = 40, eyes = "open", className = "" }: { height?: number; eyes?: "open" | "closed"; className?: string }) {
  return (
    <svg
      viewBox="0 0 100 120"
      height={height}
      width={(height * 100) / 120}
      fill="currentColor"
      aria-hidden="true"
      className={`mark ${className}`}
      data-eyes={eyes}
    >
      <MarkLetter />
      <MarkEyes />
    </svg>
  );
}

/** The home-screen icon: the face on the Blurple tile. */
export function AppIcon({ size = 48, className = "" }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 512 512" width={size} height={size} aria-hidden="true" className={className}>
      <rect width="512" height="512" rx="112" className="fill-accent" />
      <g transform={ON_TILE} className="fill-accent-ink">
        <MarkLetter />
        <MarkEyes />
      </g>
    </svg>
  );
}
