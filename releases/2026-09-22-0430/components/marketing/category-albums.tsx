"use client";

/* CategoryAlbums — album-cover grid for the marketplace categories.
   Renders on the HOMEPAGE (after the hero) as the single "catalog" navigation.
   Covers are marketing photography (NO-FAKE-DATA-exempt); product images remain
   real supplier images only. Each cover opens the marketplace pre-selected:
       /marketplace?category=CODE
   (There is no separate /categories page — this section IS the catalog index.) */

import Link from "next/link";
import Image from "next/image";
import { CATEGORY_COVERS } from "@/lib/marketplace/covers";

export function CategoryAlbums() {
  return (
    <section className="bg-white border-t border-slate-200" id="catalog">
      <div className="max-w-7xl mx-auto px-5 lg:px-8 py-16">
        <div className="mb-8">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-[#8a6d3b]">
            Catalog
          </div>
          <h2 className="text-3xl font-bold text-[#111827] mt-1.5 tracking-tight">
            Browse the catalog by category
          </h2>
          <p className="text-slate-600 text-sm mt-2 max-w-2xl">
            One catalog for every line your property buys. Pick an album to open the
            marketplace filtered to that category — transparent bulk pricing across suppliers.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {CATEGORY_COVERS.map((cat) => (
            <Link
              key={cat.code}
              href={`/marketplace?category=${cat.code}`}
              className="group relative block overflow-hidden rounded-xl border border-slate-200 bg-slate-100 aspect-[4/5] transition-shadow hover:shadow-lg"
            >
              {cat.img ? (
                <Image
                  src={cat.img}
                  alt={`${cat.label} — hospitality supplies`}
                  fill
                  sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : null}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 pb-3 pt-10">
                <span className="block text-sm font-semibold text-white">{cat.label}</span>
                <span className="block text-[10px] text-white/80 mt-0.5 line-clamp-2">{cat.blurb}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}