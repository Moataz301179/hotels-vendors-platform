import Link from "next/link";
import { HV_THEME } from "@/components/theme/tokens";
import Image from "next/image";

/**
 * SectionCard — mirrors ICE.com's hub sections (Exchanges, Fixed Income, Mortgage, Energy)
 * Pattern: title + description + Learn more link + image grid (1 main + 2 thumb)
 * Adapted: HotelsVendors business units (Procurement, Supplier Network, Logistics, Factoring)
 */
export interface SectionCardData {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  learnHref: string;
  learnLabel?: string;
  images: {
    main: string;
    thumb1: string;
    thumb2: string;
  };
}

export interface SectionCardProps {
  section: SectionCardData;
  theme?: "dark" | "light";
}

export function SectionCard({ section, theme = "dark" }: SectionCardProps) {
  const t = theme === "light" ? HV_THEME.light : HV_THEME.dark;
  return (
    <section
      className="border-b py-16"
      style={{
        borderBottomColor: t.border.subtle,
        backgroundColor: t.background,
        fontFamily: HV_THEME.font.family,
      }}
    >
      <div
        className="mx-auto flex flex-col gap-8 px-[--hv-px]"
        style={{ maxWidth: HV_THEME.layout.containerMax }}
      >
        {/* Header row — mirrors ICE's "Title + Description + Learn more" */}
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2
              className="text-3xl"
              style={{
                color: t.text.primary,
                fontWeight: 400,
              }}
            >
              {section.title}
            </h2>
            <p
              className="mt-1 text-lg"
              style={{
                color: t.text.secondary,
                fontWeight: 400,
              }}
            >
              {section.subtitle}
            </p>
          </div>
          <Link
            href={section.learnHref}
            className="text-sm underline decoration-1 underline-offset-2"
            style={{
              color: HV_THEME.dark.accent.base,
              fontWeight: 400,
              fontFamily: HV_THEME.font.family,
            }}
          >
            {section.learnLabel || "Learn more"}
          </Link>
        </div>

        <p
          className="max-w-2xl text-sm"
          style={{
            color: t.text.secondary,
            fontWeight: 400,
          }}
        >
          {section.description}
        </p>

        {/* Image grid — mirrors ICE's 1-main + 2-thumb collage */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="relative aspect-[4/3] overflow-hidden rounded-md">
            <Image
              src={section.images.main}
              alt={`${section.title} main`}
              fill
              className="object-cover"
              style={{ backgroundColor: t.surface }}
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-md">
            <Image
              src={section.images.thumb1}
              alt={`${section.title} thumb 1`}
              fill
              className="object-cover"
              style={{ backgroundColor: t.surface }}
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-md">
            <Image
              src={section.images.thumb2}
              alt={`${section.title} thumb 2`}
              fill
              className="object-cover"
              style={{ backgroundColor: t.surface }}
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Sample section data — mirrors ICE's 4 business unit sections
 * HotelsVendors: Procurement OS | Supplier Network | Shared Logistics | Credit Facility
 */
export const HV_SECTIONS: SectionCardData[] = [
  {
    id: "procurement",
    title: "Procurement Orchestration",
    subtitle: "Automate your purchasing workflow",
    description:
      "Connect to your PMS/ERP in 6 steps. HotelsVendors orchestrates procurement from PO to payment with full ETA compliance and dual-authorization approval chains.",
    learnHref: "/solutions/procurement",
    images: {
      main: "https://images.unsplash.com/photo-1454165804682-f11d4c2d3b1a?w=800&h=600&fit=crop",
      thumb1: "https://images.unsplash.com/photo-1498050149434-f6a9d0d5c84e?w=400&h=300&fit=crop",
      thumb2: "https://images.unsplash.com/photo-1532930393321-3a7c5f4b4b4b?w=400&h=300&fit=crop",
    },
  },
  {
    id: "supplier",
    title: "Supplier Network",
    subtitle: "Reach 68+ verified Egyptian suppliers",
    description:
      "SME suppliers compete directly with large distributors. Fixed pricing, no bidding. Get paid within 48 hours via our Oliv credit facility partnership.",
    learnHref: "/suppliers",
    images: {
      main: "https://images.unsplash.com/photo-warehouse-1571590939494-2c7b1bdb4249?w=800&h=600&fit=crop",
      thumb1: "https://images.unsplash.com/photo-1522204523234-8720d83a1e0f?w=400&h=300&fit=crop",
      thumb2: "https://images.unsplash.com/photo-1552667468-07706e3e99f4?w=400&h=300&fit=crop",
    },
  },
];
