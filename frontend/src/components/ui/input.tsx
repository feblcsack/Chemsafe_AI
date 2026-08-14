import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "flex h-11 w-full rounded-md border border-white/10 bg-white/[0.03] px-3.5 text-sm text-paper placeholder:text-steel focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-hazard focus-visible:border-hazard/50 transition-colors",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "flex w-full rounded-md border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-sm text-paper placeholder:text-steel focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-hazard focus-visible:border-hazard/50 transition-colors",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-display font-medium",
  {
    variants: {
      variant: {
        default: "border-hazard/30 bg-hazard/10 text-hazard",
        danger: "border-corrosive/40 bg-corrosive/10 text-corrosive",
        safe: "border-safe/40 bg-safe/10 text-safe",
        muted: "border-white/10 bg-white/[0.03] text-steel",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Input, Textarea, Badge, badgeVariants };
