import Link from "next/link";
import { Spotlight } from "@/components/ui/spotlight";
import { ScanGrid } from "@/components/ui/scan-grid";
import { TextReveal } from "@/components/ui/text-reveal";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, ScanLine, ShieldCheck } from "lucide-react";

export default function Home() {
  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center px-6 overflow-hidden">
      <ScanGrid />
      <Spotlight />

      <div className="relative z-10 flex flex-col items-center text-center max-w-2xl">
        <Badge variant="default" className="mb-6">
          <ScanLine size={12} /> On-device GHS pictogram detection
        </Badge>

        <h1 className="font-display text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.05]">
          <TextReveal text="Recognize chemical hazards" />
          <br />
          <TextReveal
            text="the instant your camera sees them."
            className="text-hazard"
          />
        </h1>

        <p className="text-steel mt-6 max-w-md text-balance">
          GHS-Lens detects hazard pictograms directly in your browser — no photo
          ever leaves your device. Built for factory floors and kitchen cabinets alike.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-12 w-full max-w-xl">
          <Link href="/scan">
            <Card className="group h-full p-1 hover:border-hazard/40 transition-colors">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <ScanLine className="text-hazard" size={20} />
                  <ArrowUpRight
                    size={16}
                    className="text-steel group-hover:text-hazard group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all"
                  />
                </div>
                <CardTitle>Scan a household product</CardTitle>
                <CardDescription>
                  Check cleaning products or chemicals at home. No account needed.
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/login">
            <Card className="group h-full p-1 hover:border-hazard/40 transition-colors">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <ShieldCheck className="text-hazard" size={20} />
                  <ArrowUpRight
                    size={16}
                    className="text-steel group-hover:text-hazard group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all"
                  />
                </div>
                <CardTitle>Workplace safety mode</CardTitle>
                <CardDescription>
                  Zone assessment, required PPE, and live compliance monitoring.
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </div>
    </main>
  );
}
