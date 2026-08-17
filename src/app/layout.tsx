import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import ChatBotWidget from "@/components/assistant/ChatBotWidget";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NOVAX — Think Beyond Social",
  description: "NOVAX · Think Beyond Social — AI-first social media platform with intelligent feeds, voice-first interactions, community learning, and creator economy.",
  icons: {
    icon: "/favicon.ico?v=2",
    apple: "/apple-touch-icon.png",
    shortcut: "/favicon.ico?v=2",
  },
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} dark`} suppressHydrationWarning>
      <body className="min-h-dvh antialiased">
        <ThemeProvider>
          <AuthProvider>
            {children}
            <ChatBotWidget />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
