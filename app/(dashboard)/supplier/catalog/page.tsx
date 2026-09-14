"use client";

import { useState } from "react";
import { usePrefs } from "@/i18n/provider";
import { useApp } from "@/lib/store";
import { CATEGORIES } from "@/lib/data";
import { fmtMoney } from "@/lib/format";
import AppShell, { Guard, RequireAuth } from "@/components/AppShell";
import {
  Btn,
  Card,
  Field,
  Img,
  Modal,
  PageHead,
  Select,
  StatePill,
  T,
  Td,
  TextArea,
  TextInput,
  Th,
  Toggle,
} from "@/components/ui";
import { IcCheck, IcPlus, IcX } from "@/components/icons";
import type { Product } from "@/lib/types";

export default function CatalogPage() {
  const { t, lang } = usePrefs();
  const { data, user, upsertProduct, toggleProductListed, toast } = useApp();
  const orgId = user?.orgId ?? "";
  const mine = data.products.filter((p) => p.supplierId === orgId);
  const nm = (e: string, a: string) => (lang === "ar" ? a : e);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", category: "fbn", unit: "", price: "", moq: "1", leadDays: "3", desc: "" });
  const [err, setErr] = useState<Record<string, string>>({});

  const create = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = t("common.required");
    if (!form.unit.trim()) e.unit = t("common.required");
    const price = Number(form.price);
    if (!price || price <= 0) e.price = t("common.required");
    setErr(e);
    if (Object.keys(e).length) return;
    const cat = CATEGORIES.find((c) => c.id === form.category)!;
    const p: Product = {
      id: `p${Date.now()}`,
      sku: `${cat.id.slice(0, 3).toUpperCase()}-9${Math.floor(Math.random() * 900) + 100}`,
      name: form.name.trim(),
      nameAr: form.name.trim(),
      categoryId: cat.id as Product["categoryId"],
      supplierId: orgId,
      unit: form.unit.trim(),
      unitAr: form.unit.trim(),
      price,
      moq: Math.max(1, Number(form.moq) || 1),
      leadDays: Math.max(1, Number(form.leadDays) || 3),
      stock: "in",
      img: cat.img,
      alt: form.name.trim(),
      desc: form.desc.trim() || form.name.trim(),
      descAr: form.desc.trim() || form.name.trim(),
      specs: [{ k: "Origin", kAr: "المصدر", v: "Egypt" }],
    };
    upsertProduct(p);
    setOpen(false);
    setForm({ name: "", category: "fbn", unit: "", price: "", moq: "1", leadDays: "3", desc: "" });
    toast(t("central.saveDone"));
  };

  return (
    <RequireAuth>
      <AppShell active="/supplier-central/catalog">
        <Guard roles={["supplier_manager"]}>
          <PageHead
            kicker={t("central.k")}
            title={t("nav.catalog")}
            sub={`${mine.length} ${t("home.prodCount")}`}
            actions={
              <Btn onClick={() => setOpen(true)}>
                <IcPlus /> {t("central.newProduct")}
              </Btn>
            }
          />

          <T minWidth="min-w-[860px]">
            <thead>
              <tr>
                <Th>{t("common.name")}</Th>
                <Th>{t("market.sku")}</Th>
                <Th>{t("central.cat")}</Th>
                <Th className="text-end">{t("central.priceV")}</Th>
                <Th className="text-end">{t("market.moq")}</Th>
                <Th className="text-end">{t("central.leadV")}</Th>
                <Th>{t("central.stock")}</Th>
                <Th>{t("common.status")}</Th>
              </tr>
            </thead>
            <tbody>
              {mine.map((p) => (
                <tr key={p.id} className="hover:bg-fog-50 dark:hover:bg-ink-850">
                  <Td>
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-14 shrink-0 overflow-hidden rounded bg-fog-100">
                        <Img src={p.img} alt={p.alt} className="h-full w-full" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold">{nm(p.name, p.nameAr)}</div>
                        <div className="text-xs text-ink-400">{nm(p.unit, p.unitAr)}</div>
                      </div>
                    </div>
                  </Td>
                  <Td className="tnum text-[13px]">{p.sku}</Td>
                  <Td className="text-[13px]">{nm(CATEGORIES.find((c) => c.id === p.categoryId)?.name ?? "", CATEGORIES.find((c) => c.id === p.categoryId)?.nameAr ?? "")}</Td>
                  <Td className="tnum text-end font-semibold">{fmtMoney(p.price, lang)}</Td>
                  <Td className="tnum text-end">{p.moq}</Td>
                  <Td className="tnum text-end">{p.leadDays}</Td>
                  <Td>
                    <Select
                      value={p.stock}
                      onChange={(e) => {
                        upsertProduct({ ...p, stock: e.target.value as Product["stock"] });
                        toast(t("central.saveDone"));
                      }}
                      className="!h-9 min-w-28 text-[13px]"
                      aria-label={t("central.stock")}
                    >
                      <option value="in">{t("state.in_stock")}</option>
                      <option value="low">{t("state.low_stock")}</option>
                      <option value="out">{t("state.out_of_stock")}</option>
                    </Select>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-2.5">
                      <Toggle
                        on={p.stock !== "out"}
                        onChange={() => {
                          toggleProductListed(p.id);
                          toast(t(p.stock === "out" ? "central.listed" : "central.delisted"), p.stock === "out" ? "ok" : "warn");
                        }}
                        label={t("central.delist")}
                      />
                      <span className="text-[12px] font-medium text-ink-500">
                        {p.stock === "out" ? t("state.out_of_stock") : t("state.in_stock")}
                      </span>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </T>

          <Modal
            open={open}
            onClose={() => setOpen(false)}
            title={t("central.newProduct")}
            wide
            footer={
              <>
                <Btn variant="ghost" onClick={() => setOpen(false)}>{t("common.cancel")}</Btn>
                <Btn onClick={create}>
                  <IcCheck /> {t("common.save")}
                </Btn>
              </>
            }
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field label={`${t("common.name")} *`} id="np-name" error={err.name}>
                  <TextInput id="np-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </Field>
              </div>
              <Field label={t("central.cat")} id="np-cat">
                <Select id="np-cat" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>{nm(c.name, c.nameAr)}</option>
                  ))}
                </Select>
              </Field>
              <Field label={t("market.unit")} id="np-unit" error={err.unit}>
                <TextInput id="np-unit" placeholder="10 kg sack" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
              </Field>
              <Field label={`${t("central.priceV")} (EGP) *`} id="np-price" error={err.price}>
                <TextInput id="np-price" type="number" min={1} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              </Field>
              <Field label={t("market.moq")} id="np-moq">
                <TextInput id="np-moq" type="number" min={1} value={form.moq} onChange={(e) => setForm({ ...form, moq: e.target.value })} />
              </Field>
              <Field label={t("central.leadV")} id="np-lead">
                <TextInput id="np-lead" type="number" min={1} value={form.leadDays} onChange={(e) => setForm({ ...form, leadDays: e.target.value })} />
              </Field>
              <div className="sm:col-span-2">
                <Field label={t("market.desc")} id="np-desc">
                  <TextArea id="np-desc" value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} />
                </Field>
              </div>
            </div>
          </Modal>
        </Guard>
      </AppShell>
    </RequireAuth>
  );
}
