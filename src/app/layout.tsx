import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { NotesProvider } from "@/context/NotesContext";
import { PwaRegister } from "@/components/pwa/PwaRegister";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Note Nest — Personal Notes & Knowledge Management",
  description:
    "Organize, edit, and safely access everything you learn in one fast, beautiful, and distraction-free personal notes application.",
  keywords: ["notes", "knowledge management", "editor", "productivity", "tags", "markdown", "sharing", "pwa"],
  authors: [{ name: "Note Nest" }],
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/N%20Emblem.png", sizes: "any" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Note Nest",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#090d16" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.className}>
      <body
        suppressHydrationWarning
        className="min-h-screen bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 antialiased selection:bg-amber-500/20 selection:text-amber-700 dark:selection:text-amber-300"
      >
        <AuthProvider>
          <ThemeProvider>
            <NotesProvider>{children}</NotesProvider>
          </ThemeProvider>
        </AuthProvider>
        <PwaRegister />
      </body>
    </html>
  );
}
