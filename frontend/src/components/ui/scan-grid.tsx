"use client";

/**
 * The signature visual motif of the app: a faint technical grid with a
 * scanning line sweeping across it, referencing the actual mechanism the
 * product uses (a CV model scanning a frame for pictograms). This is the
 * "one real risk" per the design brief — everything else stays quiet
 * around it.
 */
export function ScanGrid({ className = "" }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(242,183,7,1) 1px, transparent 1px), linear-gradient(90deg, rgba(242,183,7,1) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-hazard/70 to-transparent animate-scanline" />
    </div>
  );
}
