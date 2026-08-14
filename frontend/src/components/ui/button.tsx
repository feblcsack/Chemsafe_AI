import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-display font-semibold tracking-tight transition-all duration-200 disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hazard focus-visible:ring-offset-2 focus-visible:ring-offset-ink",
  {
    variants: {
      variant: {
        default:
          "bg-hazard text-ink shadow-[0_0_0_1px_rgba(242,183,7,0.3),0_4px_20px_-4px_rgba(242,183,7,0.5)] hover:shadow-[0_0_0_1px_rgba(242,183,7,0.5),0_8px_28px_-4px_rgba(242,183,7,0.7)] hover:-translate-y-0.5",
        destructive: "bg-corrosive text-white hover:bg-corrosive/90",
        outline:
          "border border-white/15 bg-white/[0.02] text-paper hover:bg-white/[0.06] hover:border-white/25",
        ghost: "text-paper hover:bg-white/[0.06]",
        link: "text-hazard underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-9 px-3.5 text-xs",
        lg: "h-[3.25rem] px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
