import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ClipboardCheck, PackageCheck } from 'lucide-react';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { publicMarketplaceDirectoryProfileWhere } from '@/lib/directory/public-marketplace';
import { MarketplaceSelectionAction } from '@/components/marketing/marketplace-selection-action';
import { operatingCategory } from '@/lib/directory/operating-category';
import { groupLabel, listingArabicName, listingImage } from '@/lib/directory/listing-visual';
import { publicDirectoryFields, publicDirectorySpecifications, publicDirectoryText } from '@/lib/directory/public-directory-profile';

export const dynamic = 'force-dynamic';

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

  const fields = publicDirectoryFields(entry);
  if (!fields) notFound();

  const area = operatingCategory(fields.category, fields.name);
  const specifications = publicDirectorySpecifications(entry.attributes);
  const material = specifications.material ?? null;
  const description = publicDirectoryText(entry.description);
  const image = listingImage(fields.name, fields.category);
  const arabic = listingArabicName(fields.name, fields.nameAr);

  return <main className="hv-public-page hv-marketplace-reference">
    <section className="hv-public-section"><div className="shell">
      <Link href="/marketplace" className="hv-public-text-link"><ArrowLeft size={16} /> Back to catalogue</Link>
      <div className="hv-reference-layout">
        <div className="hv-reference-media">
          {image ? <Image src={image} alt="" fill sizes="(max-width: 800px) 100vw, 50vw" /> : <PackageCheck size={62} aria-hidden="true" />}
        </div>
        <div className="hv-reference-summary">
          <span className="eyebrow">{groupLabel(area.group)}{fields.subcategory ? ` · ${fields.subcategory}` : ` · ${area.subcategory}`}</span>
          <h1>{fields.name}</h1>
          {arabic ? <p lang="ar" dir="rtl">{arabic}</p> : null}
          <p>{description ?? 'A reviewed HoReCa reference ready to be specified in a controlled procurement requirement.'}</p>
          <dl className="hv-reference-specs">
            <div><dt>Procurement unit</dt><dd>{fields.purchaseUnit ?? fields.unitOfMeasure ?? 'Specified in requirement'}</dd></div>
            <div><dt>Reference type</dt><dd>{entry.itemType === 'SERVICE' ? 'Service requirement' : 'Product requirement'}</dd></div>
            {material ? <div><dt>Material</dt><dd>{material}</dd></div> : null}
          </dl>
          <MarketplaceSelectionAction className="btn btn-blue" itemId={entry.id} category={fields.category} subcategory={fields.subcategory} label="Add to requirement" />
          <p className="hv-market-footnote"><ClipboardCheck size={14} aria-hidden="true" /> This is a Vendor-neutral product reference. Vendor identity, availability, private terms and order records are not public.</p>
        </div>
      </div>
    </div></section>
  </main>;
}
