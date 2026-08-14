import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "safe" | "danger" | "muted";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-full",
        {
          "bg-white/10 text-paper": variant === "default",
          "bg-safe/20 text-safe": variant === "safe",
          "bg-corrosive/20 text-corrosive": variant === "danger",
          "bg-steel/20 text-steel": variant === "muted",
        },
        className
      )}
      {...props}
    />
  );
}