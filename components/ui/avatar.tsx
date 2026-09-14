/**
 * Avatar Primitive
 */

import * as React from "react";
import { cn } from "@/lib/utils";

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  fallback?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeMap = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-lg",
};

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt = "", fallback, size = "md", ...props }, ref) => {
    const [error, setError] = React.useState(false);
    const initials = fallback
      ? fallback
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2)
      : "?";

    return (
      <div
        ref={ref}
        className={cn(
          "relative inline-flex items-center justify-center overflow-hidden rounded-full bg-surface-raised border border-[var(--border-default)] shrink-0",
          sizeMap[size],
          className
        )}
        {...props}
      >
        {src && !error ? (
          <img
            src={src}
            alt={alt}
            className="h-full w-full object-cover"
            onError={() => setError(true)}
          />
        ) : (
          <span className="font-medium text-foreground-secondary">
            {initials}
          </span>
        )}
      </div>
    );
  }
);
Avatar.displayName = "Avatar";

export { Avatar };
