import { cn } from "@/lib/utils";

interface BrandLogoProps {
  className?: string;
  variant?: "dark" | "light";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  showTagline?: boolean;
}

const SIZE_MAP = {
  xs: { icon: 22, text: 12, tagline: 10 },
  sm: { icon: 28, text: 13, tagline: 11 },
  md: { icon: 36, text: 14, tagline: 12 },
  lg: { icon: 48, text: 16, tagline: 13 },
  xl: { icon: 64, text: 18, tagline: 14 },
};

export function BrandLogo({
  className,
  variant = "light",
  size = "md",
  showText = true,
  showTagline = false,
}: BrandLogoProps) {
  const dims = SIZE_MAP[size];
  const logoSrc = variant === "dark" ? "/logo-colored.svg" : "/logo-white.svg";

  return (
    <div className={cn("inline-flex flex-col items-center shrink-0", className)}>
      <img
        src={logoSrc}
        alt="HotelsVendors"
        width={dims.icon}
        height={dims.icon}
        className="object-contain shrink-0"
        style={{ width: dims.icon, height: dims.icon }}
      />
      {showText && (
        <div className="flex flex-col items-center gap-1 mt-2">
          <span
            className="font-semibold uppercase whitespace-nowrap"
            style={{
              fontSize: dims.text,
              color: "var(--foreground)",
              letterSpacing: "0.05em",
              fontFamily: "var(--font-display), system-ui, sans-serif",
            }}
          >
            Hotels Vendors
          </span>
          {showTagline && (
            <span
              className="uppercase whitespace-nowrap"
              style={{
                fontSize: dims.tagline,
                color: "var(--foreground-muted)",
                letterSpacing: "0.05em",
                fontFamily: "var(--font-display), system-ui, sans-serif",
              }}
            >
              The Market Changer
            </span>
          )}
        </div>
      )}
    </div>
  );
}
