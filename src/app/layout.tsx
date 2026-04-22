import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});


export const metadata: Metadata = {
  title: "Sneyder Studio",
  description: "Innovative Digital Studio - Creating premium experiences.",
  icons: {
    icon: "https://i.postimg.cc/kXw7hpYj/Picsart-25-04-01-13-42-29-671.png",
    shortcut: "https://i.postimg.cc/kXw7hpYj/Picsart-25-04-01-13-42-29-671.png",
    apple: "https://i.postimg.cc/kXw7hpYj/Picsart-25-04-01-13-42-29-671.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

import VisitTracker from "@/components/VisitTracker";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${spaceGrotesk.variable} ${inter.variable} h-full antialiased dark`}
    >
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" />
      </head>
      <body className="min-h-full flex flex-col">
        <VisitTracker />
        {children}
      </body>
    </html>

  );
}
