import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Concrete Build — Real Estate Tokenization Platform | Join the Waitlist",
  description: "Concrete Build is a tokenization-as-a-service platform that transforms physical real estate into digital tokens. Join our waitlist to get early access to the future of real estate investing.",
  keywords: "real estate tokenization, blockchain, RWA, fractional ownership, concrete build, CBLD, waitlist",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "Concrete Build — Real Estate Tokenization Platform",
    description: "Digitize properties, attract global investors, and automate payouts on the blockchain. Join the waitlist today.",
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>{children}</body>
    </html>
  );
}
