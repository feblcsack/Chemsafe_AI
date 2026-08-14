"use client";

/**
 * Aceternity-style radial spotlight that follows a slow ambient drift.
 * Signature background element for the landing hero — evokes a sensor
 * sweeping the dark, which ties directly into the product's subject
 * (computer-vision hazard detection) rather than being decoration for
 * its own sake.
 */
export function Spotlight({ className = "" }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <div
        className="absolute -top-1/3 left-1/2 h-[60rem] w-[60rem] -translate-x-1/2 rounded-full opacity-[0.15] blur-[120px] animate-spotlight-drift"
        style={{
          background:
            "radial-gradient(circle, rgba(242,183,7,0.9) 0%, rgba(242,183,7,0.2) 35%, transparent 70%)",
        }}
      />
      <div
        className="absolute top-1/4 right-0 h-[40rem] w-[40rem] rounded-full opacity-[0.08] blur-[100px]"
        style={{
          background:
            "radial-gradient(circle, rgba(193,68,14,0.9) 0%, transparent 65%)",
        }}
      />
    </div>
  );
}
