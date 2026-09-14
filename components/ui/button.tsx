/**
 * Button Primitive
 *
 * CVA-based with glassmorphism variants.
 * G7: Dark Mode Glassmorphism — institutional-grade fintech interface.
 */

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent-600)] disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--accent-500)] text-white hover:bg-[var(--accent-600)] active:scale-[0.98]",
        destructive:
          "bg-[var(--error)] text-white hover:opacity-90 active:scale-[0.98]",
        outline:
          "border border-[var(--border-default)] bg-transparent text-foreground hover:bg-surface-hover hover:border-[var(--border-strong)]",
        secondary:
          "bg-surface-raised text-foreground hover:bg-surface-hover",
        ghost:
          "text-foreground-secondary hover:text-foreground hover:bg-surface-hover",
        glass:
          "bg-[var(--glass-bg)] backdrop-blur-md border border-[var(--glass-border)] text-foreground hover:bg-white/[0.07] hover:border-white/10",
        link:
          "text-[var(--accent-500)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-11 rounded-lg px-6 text-base",
        icon: "h-9 w-9",
        "icon-sm": "h-8 w-8",
        "icon-lg": "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
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
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
