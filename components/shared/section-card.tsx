/**
 * Section Card — Glassmorphism content container
 */

import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

interface SectionCardProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  glass?: boolean;
  action?: React.ReactNode;
}

export function SectionCard({
  title,
  description,
  children,
  className,
  glass = false,
  action,
}: SectionCardProps) {
  return (
    <Card glass={glass} className={cn("", className)}>
      {(title || description || action) && (
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            {title && <CardTitle>{title}</CardTitle>}
            {description && <CardDescription className="mt-1">{description}</CardDescription>}
          </div>
          {action && <div>{action}</div>}
        </CardHeader>
      )}
      <CardContent>{children}</CardContent>
    </Card>
  );
}
