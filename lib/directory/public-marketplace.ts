import type { Prisma } from "@prisma/client";

/**
 * Public marketplace discovery is intentionally narrower than the review
 * database. Open-data consumer records may be retained as private research,
 * but only reviewed HoReCa references from an allowed source class may render
 * to buyers.
 */
export const PUBLIC_HORECA_DIRECTORY_SOURCE_TYPES = [
  "INTERNAL_HOSPITALITY_SPECIFICATION",
  "VENDOR_AUTHORIZED_HORECA_CATALOG",
] as const;

export function isPublicHoRecaDirectorySourceType(sourceType: string): boolean {
  return (PUBLIC_HORECA_DIRECTORY_SOURCE_TYPES as readonly string[]).includes(sourceType);
}

export const publicMarketplaceDirectoryProfileWhere = {
  publicationStatus: "PUBLISHED",
  deletedAt: null,
  candidate: {
    is: {
      reviewStatus: "APPROVED",
      deletedAt: null,
      source: {
        is: {
          permissionStatus: "PERMITTED",
          deletedAt: null,
          sourceType: { in: [...PUBLIC_HORECA_DIRECTORY_SOURCE_TYPES] },
        },
      },
    },
  },
} satisfies Prisma.DirectoryProfileWhereInput;
