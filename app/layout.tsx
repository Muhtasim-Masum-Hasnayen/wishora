import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wishora — Make Their Birthday Unforgettable",
  description: "Create a beautiful, personalized birthday website in minutes. Pick a relationship, choose a theme, add your memories, and share the surprise.",
  metadataBase: new URL("https://wishora.vercel.app"),
  openGraph: {
    title: "Wishora — Make Their Birthday Unforgettable",
    description: "A little website, filled with big feelings.",
    type: "website"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
