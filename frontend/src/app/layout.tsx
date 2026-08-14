import "./globals.css";
import Script from "next/script";
import LayoutWrapper from "@/components/LayoutWrapper";

export const metadata = {
  title: "ChemSafe — GHS-Lens",
  description: "Real-time chemical hazard detection, running entirely on your device.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
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
        <LayoutWrapper>
          {children}
        </LayoutWrapper>
      </body>
    </html>
  );
}
