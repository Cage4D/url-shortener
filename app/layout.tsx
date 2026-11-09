import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shortcut — URL shortener",
  description: "Paste a long link and get a short one you can share anywhere.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
