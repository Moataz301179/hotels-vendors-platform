"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePrefs } from "@/i18n/provider";
import { useApp } from "@/lib/store";
import AppShell, { Guard, RequireAuth } from "@/components/AppShell";
import { IcCart, IcPen } from "@/components/icons";
import { Button as Btn } from "@/components/ui/button";
import { Card as PageHead, CardHeader as PageHeadHeader, CardTitle as PageHeadTitle } from "@/components/ui/card";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge as StatePill } from "@/components/ui/badge";

export default function ProductDetailPage({ params }: { params: Promise<{ product: string }> }) {
  const { t, lang } = usePrefs();
  const { data, cartAdd, cart, toast, user } = useApp();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params.then((p) => {
      const found = data?.products?.find((pr: any) => pr.id === p.product);
      setProduct(found || data?.products?.[0]);
      setLoading(false);
    });
  }, [params, data]);

  if (loading) {
    return (
      <RequireAuth>
        <AppShell active="/marketplace">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="skeleton h-8 w-64 rounded-lg" />
          </div>
        </AppShell>
      </RequireAuth>
    );
  }

  if (!product) {
    return (
      <RequireAuth>
        <AppShell active="/marketplace">
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <h2 className="text-xl font-semibold">Product not found</h2>
            <p className="mt-2 text-ink-400">This product may have been removed or is unavailable.</p>
            <Link href="/marketplace" className="mt-6 rounded-lg border border-line bg-white px-6 py-2 text-[13px] font-medium text-ink-700 hover:border-ink-400 dark:border-linedark dark:bg-ink-900 dark:text-ink-300">
              Back to Marketplace
            </Link>
          </div>
        </AppShell>
      </RequireAuth>
    );
  }

  const inCart = cart?.find((l: any) => l.productId === product.id);
  const isHotel = user && ["hotel_admin", "gm", "finance_director"].includes(user.role);

  return (
    <RequireAuth>
      <AppShell active="/marketplace">
        <Guard roles={["hotel_admin", "gm", "finance_director", "platform_admin"]}>
          <PageHead kicker={t("market.detailK") ?? "Product Detail"} title={product.name} sub={product.sku} />

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Image */}
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-fog-100">
              <img
                src={product.image || `/images/suppliers/${product.supplierId?.slice(-1) || "1"}.jpg`}
                alt={product.name}
                className="h-full w-full object-cover"
              />
              <StatePill
                s={product.stock || "in"}
                label={t(`state.${product.stock === "in" ? "in_stock" : product.stock === "low" ? "low_stock" : "out_of_stock"}`)}
                className="absolute start-3 top-3"
              />
            </div>

            {/* Details */}
            <div className="flex flex-col">
              <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-400">
                (product.supplier?.name || t("market.supplier")) ?? "Supplier"
              </div>
              <h1 className="mt-1 text-2xl font-semibold">{product.name}</h1>
              <div className="mt-1 text-sm text-ink-400">
                {product.sku} · {product.unit || "piece"} · {t("market.leadD", { n: product.leadDays }) ?? `Lead time: ${product.leadDays || 0} days`}
              </div>

              <div className="mt-4 flex items-baseline gap-3">
                <span className="tnum text-3xl font-medium text-ink-950 dark:text-white">
                  {product.price?.toFixed(2)}
                </span>
                <span className="text-[13px] text-ink-400">{t("market.moq") ?? "MOQ"}: {product.moq || 1}</span>
              </div>

              {product.description && (
                <p className="mt-4 text-[13px] leading-relaxed text-ink-400">{product.description}</p>
              )}

              {/* Supplier info */}
              <div className="mt-5 rounded-lg border border-line bg-white p-4 dark:border-linedark dark:bg-ink-900">
                <h3 className="text-sm font-semibold">{t("market.supplierInfo") ?? "Supplier Information"}</h3>
                <div className="mt-2 space-y-1 text-[13px] text-ink-500">
                  <div className="flex justify-between">
                    <span>{t("market.supplier") ?? "Supplier"}</span>
                    <span className="font-medium text-ink-700 dark:text-ink-300">{product.supplier?.name || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("market.rating") ?? "Rating"}</span>
                    <span className="font-medium text-ink-700 dark:text-ink-300">
                      {product.supplier?.rating ? `${product.supplier.rating.toFixed(1)} ⭐` : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("market.reviews") ?? "Reviews"}</span>
                    <span className="font-medium text-ink-700 dark:text-ink-300">{product.supplier?.reviewCount || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("market.tier") ?? "Tier"}</span>
                    <span className="font-medium text-ink-700 dark:text-ink-300">{product.supplier?.tier || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("market.city") ?? "Location"}</span>
                    <span className="font-medium text-ink-700 dark:text-ink-300">{product.supplier?.city || "—"}</span>
                  </div>
                </div>
              </div>

              {/* Specs if available */}
              {product.specs && Object.keys(product.specs).length > 0 && (
                <div className="mt-5 rounded-lg border border-line bg-white p-4 dark:border-linedark dark:bg-ink-900">
                  <h3 className="text-sm font-semibold">{t("market.specs") ?? "Specifications"}</h3>
                  <dl className="mt-3 grid grid-air lg:grid-cols-2 text-[13px]">
                    {Object.entries(product.specs).map(([k, v]) => (
                      <div key={k} className="flex justify-between">
                        <dt className="text-ink-500">{k}</dt>
                        <dd className="font-medium text-ink-700 dark:text-ink-300">{v}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}

              {/* Actions */}
              {isHotel && (
                <div className="mt-6 flex gap-3">
                  <Btn
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      const addQty = inCart ? product.moq : product.moq;
                      cartAdd(product.id, addQty);
                      toast?.(t("toast.cartAdd", { p: product.name }) ?? "Added to cart");
                    }}
                  >
                    <IcCart size={14} /> {inCart ? t("market.added") ?? "Added" : t("market.addToCart") ?? "Add to cart"}
                  </Btn>
                  <Link href={`#rfq`} className="rounded-lg border border-line px-4 py-2 text-[13px] font-medium text-ink-700 hover:border-ink-400 dark:border-linedark dark:bg-ink-900 dark:text-ink-300">
                    <IcPen size={14} /> {t("market.requestQuote") ?? "Request Quote"}
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* RFQ section */}
          <div id="rfq" className="mt-8 rounded-lg border border-line bg-white p-6 dark:border-linedark dark:bg-ink-900">
            <h2 className="text-base font-semibold">{t("market.requestQuote") ?? "Request a Quote"}</h2>
            <p className="mt-1 text-sm text-ink-400">
              {t("market.rfqSub") ?? `Request a custom quote for "${product.name}" from ${product.supplier?.name}.`}
            </p>
            <Btn variant="outline" size="sm" className="mt-4">
              {t("market.openRFQ") ?? "Open RFQ Form"}
            </Btn>
          </div>
        </Guard>
      </AppShell>
    </RequireAuth>
  );
}
