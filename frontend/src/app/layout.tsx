import "./globals.css";
import Script from "next/script";
import { Rajdhani } from "next/font/google";
import Navbar from "@/components/Navbar";
import LayoutWrapper from "@/components/LayoutWrapper";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

// Rajdhani: condensed, technical, sci-fi-adjacent display face — used for
// card titles, stat numbers, and headings to give the Hazmon cards and
// dashboards a "trading card / HUD" feel without hurting body readability.
const rajdhani = Rajdhani({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-rajdhani",
  display: "swap",
});

export const metadata = {
  title: "ChemSafe — GHS-Lens",
  description: "Real-time chemical hazard detection, running entirely on your device.",
  keywords: "chemical safety, GHS, hazard detection, PPE monitoring, workplace safety",
  authors: [{ name: "ChemSafe Team" }],
  openGraph: {
    title: "ChemSafe — GHS-Lens",
    description: "Real-time chemical hazard detection with AI-powered insights",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={rajdhani.variable}>
      <head>
        {/* Preconnect to improve performance */}
        <link rel="preconnect" href={process.env.NEXT_PUBLIC_API_URL} />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" />
        {/* DNS prefetch for external resources */}
        <link rel="dns-prefetch" href="https://cdn.jsdelivr.net" />
      </head>
      <body className="bg-ink text-paper font-body min-h-screen antialiased">
        {/*
          Loaded via CDN script tag, not `import`ed as an npm module.
          onnxruntime-web's bundle ships pre-minified .mjs files that use
          `import.meta` in a way that breaks Next's webpack build when
          pulled into the module graph — this is the documented workaround.
          Exposes a `window.ort` global; see lib/onnx/inference.ts.
        */}
        <Script
          src="https://cdn.jsdelivr.net/npm/onnxruntime-web@1.19.2/dist/ort.min.js"
          strategy="beforeInteractive"
        />
        <ServiceWorkerRegister />
        <Navbar />
        <LayoutWrapper>
          {children}
        </LayoutWrapper>
      </body>
    </html>
  );
}
