import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ConditionalFooter } from "@/components/layout/ConditionalFooter";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
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
  // Was hardcoded to localhost - now derived from NEXT_PUBLIC_SITE_URL
  // (see src/lib/env.ts) so OpenGraph/Twitter absolute image URLs and
  // any relative canonical resolve against the real deployed origin.
  metadataBase: new URL(env.site.url),
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Resolved server-side so the client's AuthProvider starts already
  // knowing the real auth state - no "Sign In -> Profile" flash in the
  // Header on first paint (middleware.ts keeps this session fresh on
  // every request). Wrapped defensively: a transient Supabase outage or
  // misconfiguration must not take down every single page via an
  // unhandled exception in the root layout - fall back to "signed out"
  // and let the rest of the app render normally.
  let session = null;
  try {
    const supabase = await createClient();
    const {
      data: { session: resolvedSession },
    } = await supabase.auth.getSession();
    session = resolvedSession;
  } catch (error) {
    console.error("[RootLayout] Failed to resolve auth session:", error);
  }

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider initialSession={session}>
          {children}
          <ConditionalFooter />
        </AuthProvider>
      </body>
    </html>
  );
}
