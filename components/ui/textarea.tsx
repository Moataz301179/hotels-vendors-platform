/**
 * Textarea Primitive
 */

import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-lg border border-[var(--border-default)] bg-surface px-3 py-2 text-sm text-foreground shadow-sm transition-colors",
          "placeholder:text-[var(--foreground-muted)]",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent-600)] focus-visible:border-[var(--accent-600)]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
