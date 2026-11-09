import { Big_Shoulders, Geist, Geist_Mono } from "next/font/google";

// "Big Shoulders Display" now ships as the opsz axis of Big Shoulders;
// at hero sizes optical sizing picks the display cut automatically.
export const display = Big_Shoulders({
  subsets: ["latin"],
  weight: "variable",
  axes: ["opsz"],
  variable: "--font-display",
  fallback: ["Arial Narrow", "sans-serif"],
});

export const sans = Geist({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
});

export const mono = Geist_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});
