import type { Metadata } from "next";
import { Geist, Geist_Mono, Newsreader } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AppProviders } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  display: "swap",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Beonix OS — Business Intelligence Platform",
  description:
    "Beonix OS is an AI-powered business operating system with CRM, Memory Engine, Workflows, Finance, and Compliance.",
  keywords: ["CRM", "AI", "Business OS", "Lead Management", "Workflows"],
  openGraph: {
    title: "Beonix OS",
    description: "AI-powered business operating system",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${newsreader.variable} antialiased light`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider>
          <AppProviders>
            {/* Clean relative content container */}
            <div className="relative z-[1] min-h-screen flex flex-col">
              {children}
            </div>
          </AppProviders>
        </ThemeProvider>
      </body>
    </html>
  );
}
