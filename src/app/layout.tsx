import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Footer } from "@/components/layout/Footer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteDescription =
  "Virexa is a modern AI news aggregation and newsletter platform covering technology, business, AI, games and world news.";

export const metadata: Metadata = {
  metadataBase: new URL("http://localhost:3000"),
  title: "Virexa",
  description: siteDescription,
  openGraph: {
    title: "Virexa",
    description: siteDescription,
    siteName: "Virexa",
    type: "website",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Virexa — AI-powered news, curated for you",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Virexa",
    description: siteDescription,
    images: ["/og-image.jpg"],
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
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Footer />
      </body>
    </html>
  );
}
