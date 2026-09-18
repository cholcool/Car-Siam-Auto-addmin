import localFont from "next/font/local";

/**
 * Noto Sans Thai — loaded as static per-weight TTFs (not the variable font)
 * for best runtime performance: the browser only downloads the exact
 * weights we actually use, instead of the full variable-axis file.
 * Matches the type scale approved in the mobile mockup (weights
 * 400 / 500 / 600 / 700 / 800).
 */
export const notoSansThai = localFont({
  src: [
    {
      path: "./NotoSansThai/NotoSansThai-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "./NotoSansThai/NotoSansThai-Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "./NotoSansThai/NotoSansThai-SemiBold.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "./NotoSansThai/NotoSansThai-Bold.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "./NotoSansThai/NotoSansThai-ExtraBold.ttf",
      weight: "800",
      style: "normal",
    },
  ],
  variable: "--font-sans",
  display: "swap",
  preload: true,
});
