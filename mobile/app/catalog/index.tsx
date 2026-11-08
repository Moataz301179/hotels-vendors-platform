import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@clerk/expo';
import * as SQLite from 'expo-sqlite';
import * as Crypto from 'expo-crypto';

import { createHovinClient, resolveOrigin, HovinApiError, type CatalogProduct, type CreateRfqInput } from '../../src/api/hovin';
import { idempotencyKey } from '../../src/workflow';
import { isRTL, t, type Language } from '../../src/i18n';
import { theme } from '../../src/theme';
import { Card, Field, Header, PrimaryButton, Screen, SecondaryButton, StateView, StatusPill } from '../../src/components/ui';
import { initializeDrafts, saveDraft } from '../../src/sync/drafts';

type Mode = 'catalog' | 'unlisted';

/**
 * Hotel requirement/RFQ creation. The catalog is supplier-neutral: the
 * response never exposes supplier identity, price, stock or provenance.
 */
export default function CatalogScreen() {
  const router = useRouter();
  const { isSignedIn, getToken } = useAuth();
  const [lang] = useState<Language>('en');
  const rtl = isRTL(lang);
  const [mode, setMode] = useState<Mode>('catalog');
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<CatalogProduct | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);

  const [itemName, setItemName] = useState('');
  const [unitOfMeasure, setUnitOfMeasure] = useState('');
  const [quantity, setQuantity] = useState('');
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);

  const origin = useMemo(() => resolveOrigin(), []);
  const api = useMemo(() => (origin.ok ? createHovinClient(() => getToken()) : null), [getToken, origin]);

  const loadProducts = useCallback(async () => {
    if (!api) return;
    setLoading(true);
    setError(null);
    try {
      const result = await api.marketplace(query);
      setProducts(result.products ?? []);
    } catch (err) {
      setError(err instanceof HovinApiError ? err.code : 'MARKETPLACE_UNAVAILABLE');
    } finally {
      setLoading(false);
    }
  }, [api, query]);

  useEffect(() => {
    if (!isSignedIn) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      if (cancelled) return;
      void loadProducts();
      void (async () => {
        try {
          const ctx = await api?.context();
          setTenantId(ctx?.user.tenantId ?? null);
        } catch {
          setTenantId(null);
        }
      })();
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [api, isSignedIn, loadProducts]);

  function resetForm() {
    setItemName('');
    setUnitOfMeasure('');
    setQuantity('');
    setDeliveryLocation('');
    setTargetPrice('');
    setNotes('');
    setDraftSaved(false);
  }

  function buildInput(): CreateRfqInput | { error: string } {
    const parsedQuantity = Number(quantity);
    if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0) return { error: 'QUANTITY_REQUIRED' };
    if (mode === 'unlisted' && (!itemName.trim() || !unitOfMeasure.trim())) return { error: 'ITEM_AND_UNIT_REQUIRED' };
    if (mode === 'catalog' && !selected) return { error: 'PRODUCT_REQUIRED' };
    return {
      productId: mode === 'catalog' ? selected?.id : undefined,
      itemName: mode === 'unlisted' ? itemName.trim() : undefined,
      unitOfMeasure: mode === 'unlisted' ? unitOfMeasure.trim() : undefined,
      quantity: parsedQuantity,
      deliveryLocation: deliveryLocation.trim() || undefined,
      targetPrice: targetPrice ? Number(targetPrice) : undefined,
      notes: notes.trim() || undefined,
      responseWindowHours: 24,
    };
  }

  async function submit() {
    if (!api) return;
    const input = buildInput();
    if ('error' in input) {
      setError(input.error);
      return;
    }
    const key = idempotencyKey('hovin-rfq', () => Crypto.randomUUID());
    setSubmitting(true);
    setError(null);
    try {
      await api.createRfq(input, key);
      resetForm();
      setSelected(null);
      router.push('/rfq');
    } catch (err) {
      const code = err instanceof HovinApiError ? err.code : 'RFQ_FAILED';
      // A draft is never presented as sent. It is stored locally with the same
      // idempotency key so a later retry cannot create a duplicate.
      if (tenantId) {
        try {
          const db = await SQLite.openDatabaseAsync('hovin-receiving.db');
          await initializeDrafts(db);
          await saveDraft(db, {
            id: key,
            tenantId,
            kind: 'RFQ',
            payload: JSON.stringify(input),
            createdAt: Math.floor(Date.now() / 1000),
          });
          setDraftSaved(true);
        } catch {
          // Storage failure must not masquerade as a sent RFQ.
        }
      }
      setError(code);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.root}>
      <Header title={t(lang, 'requirements')} subtitle={t(lang, 'newRequirement')} rtl={rtl} onBack={() => router.back()} />
      <Screen>
        <View style={styles.modeRow}>
          <Pressable accessibilityRole="button" onPress={() => setMode('catalog')} style={[styles.modeButton, mode === 'catalog' && styles.modeActive]}>
            <Text style={[styles.modeLabel, mode === 'catalog' && styles.modeLabelActive]}>{t(lang, 'search')}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => setMode('unlisted')} style={[styles.modeButton, mode === 'unlisted' && styles.modeActive]}>
            <Text style={[styles.modeLabel, mode === 'unlisted' && styles.modeLabelActive]}>{t(lang, 'newRequirement')}</Text>
          </Pressable>
        </View>

        {mode === 'catalog' ? (
          <>
            <Field label={t(lang, 'search')} value={query} onChangeText={setQuery} placeholder="SKU, name" rtl={rtl} />
            <SecondaryButton label={t(lang, 'search')} onPress={() => void loadProducts()} />
            {loading ? <StateView kind="loading" title={t(lang, 'loading')} rtl={rtl} /> : null}
            {!loading && products.length === 0 && !error ? <StateView kind="empty" title={t(lang, 'empty')} rtl={rtl} /> : null}
            {error ? <StateView kind="error" title={t(lang, 'error')} message={error} rtl={rtl} onRetry={() => void loadProducts()} /> : null}
            {products.map((product) => (
              <Pressable key={product.id} accessibilityRole="button" onPress={() => setSelected(product)} style={[styles.productCard, selected?.id === product.id && styles.productSelected]}>
                <View style={styles.productRow}>
                  <View style={styles.productCopy}>
                    <Text style={styles.productName}>{product.name}</Text>
                    <Text style={styles.productMeta}>{product.sku} · {product.category} · {product.unitOfMeasure}</Text>
                  </View>
                  <StatusPill label={product.requestForQuote ? t(lang, 'rfq') : '—'} tone="accent" />
                </View>
              </Pressable>
            ))}
          </>
        ) : null}

        <Card>
          <Text style={styles.cardTitle}>{t(lang, 'newRequirement')}</Text>
          {mode === 'unlisted' ? (
            <>
              <Field label={t(lang, 'itemName')} value={itemName} onChangeText={setItemName} rtl={rtl} />
              <Field label={t(lang, 'unitOfMeasure')} value={unitOfMeasure} onChangeText={setUnitOfMeasure} rtl={rtl} />
            </>
          ) : null}
          <Field label={t(lang, 'quantity')} value={quantity} onChangeText={setQuantity} keyboardType="number-pad" rtl={rtl} />
          <Field label="Delivery location" value={deliveryLocation} onChangeText={setDeliveryLocation} rtl={rtl} />
          <Field label="Target price (EGP)" value={targetPrice} onChangeText={setTargetPrice} keyboardType="decimal-pad" rtl={rtl} />
          <Field label="Notes" value={notes} onChangeText={setNotes} rtl={rtl} />
          {draftSaved ? <Text style={styles.draftNote}>{t(lang, 'draftNotSent')}</Text> : null}
          <PrimaryButton label={submitting ? t(lang, 'sending') : t(lang, 'createRfq')} onPress={() => void submit()} loading={submitting} />
        </Card>
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.paper },
  modeRow: { flexDirection: 'row', gap: 8 },
  modeButton: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 10, borderWidth: 1, borderColor: theme.borderStrong, backgroundColor: theme.card },
  modeActive: { backgroundColor: theme.accent, borderColor: theme.accent },
  modeLabel: { color: theme.ink, fontSize: 14 },
  modeLabelActive: { color: theme.accentInk },
  productCard: { backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, borderRadius: 10, padding: 14 },
  productSelected: { borderColor: theme.accent, borderWidth: 2 },
  productRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  productCopy: { flex: 1, gap: 4 },
  productName: { color: theme.ink, fontSize: 15 },
  productMeta: { color: theme.muted, fontSize: 12 },
  cardTitle: { color: theme.ink, fontSize: 16 },
  draftNote: { color: theme.danger, fontSize: 12 },
});
