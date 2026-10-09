import type { Metadata, Viewport } from "next";
import { Montserrat, Noto_Sans } from "next/font/google";
import { ServiceWorker } from "@/components/ServiceWorker";
import { Splash } from "@/components/Splash";
import { ViewportSync } from "@/components/ViewportSync";
import "./globals.css";

const ui = Noto_Sans({
  variable: "--font-ui",
  subsets: ["latin"],
});

const word = Montserrat({
  variable: "--font-word",
  subsets: ["latin"],
});

/**
 * What iOS shows while the app starts, one picture per screen: paper with the icon in the middle,
 * so the splash (Splash.tsx) takes over without a change. Width and height in points, and pixels
 * per point. scripts/brand-assets.mjs draws these: keep its DEVICES list in step.
 */
const LAUNCH_SCREENS = [
  [440, 956, 3],
  [430, 932, 3],
  [428, 926, 3],
  [420, 912, 3],
  [414, 896, 3],
  [414, 896, 2],
  [402, 874, 3],
  [393, 852, 3],
  [390, 844, 3],
  [375, 812, 3],
  [375, 667, 2],
  [414, 736, 3],
  [768, 1024, 2],
  [820, 1180, 2],
  [834, 1194, 2],
  [1024, 1366, 2],
].map(([width, height, ratio]) => ({
  url: `/splash/apple-splash-${width * ratio}x${height * ratio}.png`,
  media: `(device-width: ${width}px) and (device-height: ${height}px) and (-webkit-device-pixel-ratio: ${ratio}) and (orientation: portrait)`,
}));

export const metadata: Metadata = {
  title: "Omasuomi",
  description: "{{tagline}}",
  applicationName: "Omasuomi",
  appleWebApp: {
    capable: true,
    title: "Omasuomi",
    // The page runs under the status bar and pads for it itself (viewportFit: cover).
    statusBarStyle: "black-translucent",
    startupImage: LAUNCH_SCREENS,
  },
  // A personal study aid, not something to be found through search.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // The screen stays at its size, as an app's does. Safari in a tab ignores this; the styles and
  // ViewportSync say it again for that case. A photo is enlarged in its own frame (BookPages.tsx).
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  // Android: let the on-screen keyboard shrink the page so the bottom buttons stay in view.
  interactiveWidget: "resizes-content",
  themeColor: "#000000",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${ui.variable} ${word.variable} antialiased`}>
      <body>
        {/* First in the page, so it is painted before anything it covers. */}
        <Splash />
        {children}
        <ServiceWorker />
        <ViewportSync />
      </body>
    </html>
  );
}
