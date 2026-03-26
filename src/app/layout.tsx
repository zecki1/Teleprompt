import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { PreferencesProvider } from "@/components/providers/preferences-provider";
import { VlibrasWidget } from "@/components/accessibility/vlibras-widget";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { AOSInit } from "@/components/providers/aos-init";
import { ThemeProvider } from "next-themes";
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
  title: {
    default: "SuperTemplate | Template Robusto Next.js 15+",
    template: "%s | SuperTemplate",
  },
  description: "Um template Next.js 15+ de alta performance, acessível e rico em funcionalidades com Tailwind CSS, Framer Motion e suporte a i18n.",
  keywords: ["Next.js", "React", "Tailwind CSS", "TypeScript", "Template", "Boilerplate", "Accessibility", "i18n"],
  authors: [{ name: "Ezequiel" }],
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://template-next-robust.vercel.app/",
    siteName: "SuperTemplate",
    title: "SuperTemplate | Next.js 15+ Robust Template",
    description: "A high-performance, accessible, and feature-rich Next.js 15+ template.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Prévia do SuperTemplate",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SuperTemplate | Next.js 15+ Robust Template",
    description: "A high-performance, accessible, and feature-rich Next.js 15+ template.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt" suppressHydrationWarning>
     
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-background font-sans antialiased flex flex-col overflow-x-hidden`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <PreferencesProvider>
            <AOSInit />
            <SiteHeader />
            {/* O main cresce para empurrar o footer, mas não força scroll interno */}
            <main className="flex-1 w-full max-w-[100vw]">
              {children}
            </main>
            <SiteFooter />
            <VlibrasWidget />
          </PreferencesProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}