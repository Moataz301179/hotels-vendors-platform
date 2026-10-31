import Link from 'next/link';
import { ArrowLeft, ClipboardCheck, PackageCheck } from 'lucide-react';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { publicMarketplaceDirectoryProfileWhere } from '@/lib/directory/public-marketplace';
import { MarketplaceSelectionAction } from '@/components/marketing/marketplace-selection-action';
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

  const specifications = publicDirectorySpecifications(entry.attributes);
  const material = specifications.material ?? null;
  const description = publicDirectoryText(entry.description);

  return <main className="hv-public-page hv-marketplace-reference">
    <section className="hv-public-section"><div className="shell">
      <Link href="/marketplace" className="hv-public-text-link"><ArrowLeft size={16} /> Back to catalogue</Link>
      <div className="hv-reference-layout">
        <div className="hv-reference-media">
          <PackageCheck size={62} aria-hidden="true" />
        </div>
        <div className="hv-reference-summary">
          <span className="eyebrow">{fields.category}{fields.subcategory ? ` · ${fields.subcategory}` : ''}</span>
          <h1>{fields.name}</h1>
          {fields.nameAr ? <p lang="ar" dir="rtl">{fields.nameAr}</p> : null}
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
