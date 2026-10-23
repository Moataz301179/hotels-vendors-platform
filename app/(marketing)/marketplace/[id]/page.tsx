import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ClipboardCheck, PackageCheck } from 'lucide-react';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { publicMarketplaceDirectoryProfileWhere } from '@/lib/directory/public-marketplace';
import { MarketplaceSelectionAction } from '@/components/marketing/marketplace-selection-action';

export const dynamic = 'force-dynamic';

function firstImage(images: unknown) {
  return Array.isArray(images)
    ? images.find((image): image is string => typeof image === 'string' && /^https:\/\//i.test(image)) ?? null
    : null;
}

function stringAttribute(attributes: unknown, key: string) {
  if (!attributes || typeof attributes !== 'object' || Array.isArray(attributes)) return null;
  const value = (attributes as Record<string, unknown>)[key];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

export default async function MarketplaceReferencePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const entry = await prisma.directoryProfile.findFirst({
    where: { ...publicMarketplaceDirectoryProfileWhere, id },
    select: {
      id: true, itemType: true, name: true, nameAr: true, category: true,
      subcategory: true, description: true, unitOfMeasure: true, purchaseUnit: true,
      images: true, attributes: true,
    },
  }).catch(() => null);

  if (!entry) notFound();

  const image = firstImage(entry.images);
  const manufacturer = stringAttribute(entry.attributes, 'manufacturer');
  const material = stringAttribute(entry.attributes, 'material');

  return <main className="hv-public-page hv-marketplace-reference">
    <section className="hv-public-section"><div className="shell">
      <Link href="/marketplace" className="hv-public-text-link"><ArrowLeft size={16} /> Back to catalogue</Link>
      <div className="hv-reference-layout">
        <div className="hv-reference-media">
          {image ? <Image src={image} alt="" fill sizes="(max-width: 860px) 100vw, 48vw" priority /> : <PackageCheck size={62} aria-hidden="true" />}
        </div>
        <div className="hv-reference-summary">
          <span className="eyebrow">{entry.category}{entry.subcategory ? ` · ${entry.subcategory}` : ''}</span>
          <h1>{entry.name}</h1>
          {entry.nameAr ? <p lang="ar" dir="rtl">{entry.nameAr}</p> : null}
          <p>{entry.description ?? 'A reviewed HoReCa reference ready to be specified in a controlled procurement requirement.'}</p>
          <dl className="hv-reference-specs">
            <div><dt>Procurement unit</dt><dd>{entry.purchaseUnit ?? entry.unitOfMeasure ?? 'Specified in requirement'}</dd></div>
            <div><dt>Reference type</dt><dd>{entry.itemType === 'SERVICE' ? 'Service requirement' : 'Product requirement'}</dd></div>
            {manufacturer ? <div><dt>Manufacturer</dt><dd>{manufacturer}</dd></div> : null}
            {material ? <div><dt>Material</dt><dd>{material}</dd></div> : null}
          </dl>
          <MarketplaceSelectionAction className="btn btn-blue" itemId={entry.id} category={entry.category} subcategory={entry.subcategory} label="Add to requirement" />
          <p className="hv-market-footnote"><ClipboardCheck size={14} aria-hidden="true" /> This is a supplier-neutral product reference. Vendor identity, availability, private terms and order records are not public.</p>
        </div>
      </div>
    </div></section>
  </main>;
}
