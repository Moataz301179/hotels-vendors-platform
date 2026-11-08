import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useHovinAuth } from '../../src/testAuth';

import { createHovinClient, resolveOrigin, HovinApiError, type MobileContextUser, type QuoteRecord, type RfqRecord } from '../../src/api/hovin';
import { canAcceptQuote, formatMoney, quoteTotal, rfqTitle } from '../../src/workflow';
import { isRTL, t, type Language } from '../../src/i18n';
import { theme } from '../../src/theme';
import { Card, Field, Header, PrimaryButton, Screen, StateView, StatusPill } from '../../src/components/ui';

/**
 * RFQ detail.
 * Hotel: anonymous comparison + accept within authority.
 * Supplier: fixed commercial response to a granted RFQ.
 */
export default function RfqDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isSignedIn, getToken } = useHovinAuth();
  const [lang] = useState<Language>('en');
  const rtl = isRTL(lang);
  const [user, setUser] = useState<MobileContextUser | null>(null);
  const [rfq, setRfq] = useState<RfqRecord | null>(null);
  const [quotes, setQuotes] = useState<QuoteRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const [unitPrice, setUnitPrice] = useState('');
  const [deliveryFee, setDeliveryFee] = useState('');
  const [taxAmount, setTaxAmount] = useState('');
  const [leadTimeDays, setLeadTimeDays] = useState('');
  const [notes, setNotes] = useState('');

  const origin = useMemo(() => resolveOrigin(), []);
  const api = useMemo(() => (origin.ok ? createHovinClient(() => getToken()) : null), [getToken, origin]);

  const load = useCallback(async () => {
    if (!api || !id) return;
    setLoading(true);
    setError(null);
    try {
      const [ctx, rfqResult, quoteResult] = await Promise.all([
        api.context().catch(() => null),
        api.rfqs(),
        api.quotes().catch(() => null),
      ]);
      const currentUser = ctx?.user ?? null;
      setUser(currentUser);
      const found = (rfqResult.rfqs ?? []).find((item) => item.id === id) ?? null;
      setRfq(found);
      if (quoteResult) {
        setQuotes((quoteResult.quotes ?? []).filter((quote) => quote.rfq.id === id));
      }
    } catch (err) {
      setError(err instanceof HovinApiError ? err.code : 'RFQ_DETAIL_UNAVAILABLE');
    } finally {
      setLoading(false);
    }
  }, [api, id]);

  useEffect(() => {
    if (!isSignedIn) return;
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [isSignedIn, load]);

  const isSupplier = user?.platformRole === 'SUPPLIER';

  async function submitQuote() {
    if (!api || !rfq) return;
    setSubmitting(true);
    setActionError(null);
    try {
      await api.submitQuote({
        rfqId: rfq.id,
        unitPrice: Number(unitPrice),
        quantity: rfq.requestedQty,
        deliveryFee: Number(deliveryFee || 0),
        taxAmount: Number(taxAmount || 0),
        leadTimeDays: leadTimeDays ? Number(leadTimeDays) : undefined,
        notes: notes.trim() || undefined,
      });
      await load();
    } catch (err) {
      setActionError(err instanceof HovinApiError ? err.code : 'QUOTE_FAILED');
    } finally {
      setSubmitting(false);
    }
  }

  async function acceptQuote(quoteId: string) {
    if (!api) return;
    setSubmitting(true);
    setActionError(null);
    try {
      await api.acceptQuote(quoteId);
      router.push('/orders');
    } catch (err) {
      setActionError(err instanceof HovinApiError ? err.code : 'ACCEPT_FAILED');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.root}>
      <Header title={rfq ? rfqTitle(rfq) : t(lang, 'rfq')} subtitle={rfq?.status} rtl={rtl} onBack={() => router.back()} />
      <Screen>
        {loading ? <StateView kind="loading" title={t(lang, 'loading')} rtl={rtl} /> : null}
        {error ? <StateView kind="error" title={t(lang, 'error')} message={error} rtl={rtl} onRetry={() => void load()} /> : null}
        {!loading && !error && !rfq ? <StateView kind="empty" title={t(lang, 'empty')} rtl={rtl} /> : null}

        {rfq && !isSupplier ? (
          <>
            <Card>
              <Text style={styles.label}>{t(lang, 'quantity')}</Text>
              <Text style={styles.value}>{rfq.requestedQty} {rfq.unitOfMeasure ?? ''}</Text>
              {rfq.targetPrice !== null ? (
                <>
                  <Text style={styles.label}>Target price</Text>
                  <Text style={styles.value}>{formatMoney(Number(rfq.targetPrice))}</Text>
                </>
              ) : null}
              {rfq.deliveryLocation ? (
                <>
                  <Text style={styles.label}>Delivery location</Text>
                  <Text style={styles.value}>{rfq.deliveryLocation}</Text>
                </>
              ) : null}
            </Card>

            <Text style={styles.section}>{t(lang, 'quotes')}</Text>
            {quotes.length === 0 ? <StateView kind="empty" title={t(lang, 'empty')} rtl={rtl} /> : null}
            {quotes.map((quote, index) => {
              const check = canAcceptQuote(quote);
              const reference = quote.reference ?? `${t(lang, 'comparableOffer')} ${String(index + 1).padStart(2, '0')}`;
              return (
                <Card key={quote.id}>
                  <View style={styles.quoteRow}>
                    <Text style={styles.quoteRef}>{reference}</Text>
                    <StatusPill label={quote.currency} tone="neutral" />
                  </View>
                  <Text style={styles.quoteTotal}>{formatMoney(quoteTotal(quote), quote.currency)}</Text>
                  <Text style={styles.meta}>
                    {quote.quantity} × {formatMoney(quote.unitPrice, quote.currency)}
                  </Text>
                  {quote.leadTimeDays ? <Text style={styles.meta}>Lead time {quote.leadTimeDays} days</Text> : null}
                  {quote.validUntil ? <Text style={styles.meta}>Valid until {new Date(quote.validUntil).toLocaleDateString()}</Text> : null}
                  <PrimaryButton
                    label={t(lang, 'acceptQuote')}
                    onPress={() => void acceptQuote(quote.id)}
                    disabled={!check.ok || submitting}
                    loading={submitting}
                  />
                </Card>
              );
            })}
          </>
        ) : null}

        {rfq && isSupplier ? (
          <Card>
            <Text style={styles.section}>{t(lang, 'submitQuote')}</Text>
            <Text style={styles.meta}>
              {t(lang, 'quantity')}: {rfq.requestedQty} {rfq.unitOfMeasure ?? ''}
            </Text>
            <Field label="Unit price (EGP)" value={unitPrice} onChangeText={setUnitPrice} keyboardType="decimal-pad" rtl={rtl} />
            <Field label="Delivery fee (EGP)" value={deliveryFee} onChangeText={setDeliveryFee} keyboardType="decimal-pad" rtl={rtl} />
            <Field label="Tax amount (EGP)" value={taxAmount} onChangeText={setTaxAmount} keyboardType="decimal-pad" rtl={rtl} />
            <Field label="Lead time (days)" value={leadTimeDays} onChangeText={setLeadTimeDays} keyboardType="number-pad" rtl={rtl} />
            <Field label="Notes" value={notes} onChangeText={setNotes} rtl={rtl} />
            {actionError ? <Text style={styles.error}>{actionError}</Text> : null}
            <PrimaryButton label={submitting ? t(lang, 'sending') : t(lang, 'submitQuote')} onPress={() => void submitQuote()} loading={submitting} />
          </Card>
        ) : null}
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.paper },
  label: { color: theme.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginTop: 8 },
  value: { color: theme.ink, fontSize: 15, marginTop: 2 },
  section: { color: theme.ink, fontSize: 16, marginTop: 8 },
  quoteRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  quoteRef: { color: theme.ink, fontSize: 14 },
  quoteTotal: { color: theme.accent, fontSize: 20, marginTop: 6 },
  meta: { color: theme.muted, fontSize: 12, marginTop: 2 },
  error: { color: theme.danger, fontSize: 12 },
});
