import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as SQLite from 'expo-sqlite';

import { initializeOutbox } from '../src/sync/offlineQueue';

type OutboxState = 'checking' | 'ready' | 'error';

/**
 * HOVIN deliberately has no sample orders or fabricated receipt data. The
 * authenticated receiving handoff is supplied by the HotelsVendors session;
 * until that bridge is present, this screen exposes only the safe offline
 * capability and directs the user to the protected workspace.
 */
export default function ReceivingHome() {
  const [outboxState, setOutboxState] = useState<OutboxState>('checking');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const database = await SQLite.openDatabaseAsync('hovin-receiving.db');
        await initializeOutbox(database);
        if (!cancelled) setOutboxState('ready');
      } catch {
        if (!cancelled) {
          setOutboxState('error');
          setMessage('Offline receipt storage is unavailable on this device. No receipt can be recorded until it is restored.');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function openWorkspace() {
    try {
      await Linking.openURL('https://www.hotelsvendors.com/login?redirect_url=%2Forders');
    } catch {
      setMessage('The protected workspace could not be opened. Check this device connection and try again.');
    }
  }

  const statusLabel = outboxState === 'checking'
    ? 'Preparing device receipt storage'
    : outboxState === 'ready'
      ? 'Offline receipt storage ready'
      : 'Offline receipt storage unavailable';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topline}>
          <Text style={styles.brand}>HOVIN</Text>
          <Text style={styles.context}>Receiving workspace</Text>
        </View>

        <View style={styles.hero}>
          <Text style={styles.eyebrow}>Assigned delivery handoff</Text>
          <Text style={styles.title}>No receiving handoff is open on this device.</Text>
          <Text style={styles.body}>
            HOVIN loads only orders assigned to a signed-in hotel receiving role. It does not create sample orders, stock, or supplier records.
          </Text>
          <Pressable accessibilityRole="button" style={styles.primaryAction} onPress={openWorkspace}>
            <Text style={styles.primaryActionText}>Open protected workspace</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Controlled receiving sequence</Text>
          <WorkflowRow number="01" title="Assigned handoff" detail="A signed-in receiving role opens only the order assigned to its hotel." />
          <WorkflowRow number="02" title="Line receipt" detail="Ordered, previously received and remaining quantities are checked line by line." />
          <WorkflowRow number="03" title="Exception and condition" detail="A shortage, rejection or condition note belongs to the affected line; it is not silently netted away." />
          <WorkflowRow number="04" title="Proof of delivery" detail="Receipt evidence is attached to the GRN record after the permitted receiving check." />
        </View>

        <View style={styles.controlSurface}>
          <Text style={[styles.sectionTitle, styles.controlSurfaceTitle]}>Field controls</Text>
          <Text style={styles.controlSurfaceText}>This device is ready to hold a protected receipt draft locally. The assignment, line items, exception reasons and proof links appear only after the HotelsVendors authenticated handoff is available.</Text>
          <View style={styles.controlTags}>
            <Text style={styles.controlTag}>ASSIGNMENT</Text>
            <Text style={styles.controlTag}>LINE RECEIPT</Text>
            <Text style={styles.controlTag}>EXCEPTION</Text>
            <Text style={styles.controlTag}>POD</Text>
          </View>
        </View>

        <View style={styles.outbox}>
          <View style={styles.outboxHeader}>
            <Text style={styles.outboxTitle}>Offline receipt outbox</Text>
            {outboxState === 'checking' ? <ActivityIndicator color="#1d5f84" /> : <StatusPill error={outboxState === 'error'} />}
          </View>
          <Text style={styles.outboxText}>{statusLabel}</Text>
          <Text style={styles.outboxNote}>
            A receipt is queued only after the authenticated session provides its tenant, order and idempotency key. HOVIN never invents a receipt while offline.
          </Text>
        </View>

        {message ? <Text accessibilityRole="alert" style={styles.alert}>{message}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function WorkflowRow({ number, title, detail }: { number: string; title: string; detail: string }) {
  return (
    <View style={styles.workflowRow}>
      <Text style={styles.workflowNumber}>{number}</Text>
      <View style={styles.workflowCopy}>
        <Text style={styles.workflowTitle}>{title}</Text>
        <Text style={styles.workflowDetail}>{detail}</Text>
      </View>
    </View>
  );
}

function StatusPill({ error }: { error: boolean }) {
  return <Text style={[styles.statusPill, error ? styles.statusPillError : styles.statusPillReady]}>{error ? 'Attention' : 'Ready'}</Text>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f7f7f4' },
  content: { padding: 24, gap: 24 },
  topline: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  brand: { color: '#18252e', fontSize: 18, fontWeight: '800', letterSpacing: 1.8 },
  context: { color: '#58707e', fontSize: 13, fontWeight: '600' },
  hero: { gap: 14, padding: 24, backgroundColor: '#dfeaf0', borderWidth: 1, borderColor: '#c4d6df' },
  eyebrow: { color: '#1d5f84', fontSize: 11, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase' },
  title: { color: '#18252e', fontSize: 30, lineHeight: 36, fontWeight: '700', letterSpacing: -0.7 },
  body: { color: '#405660', fontSize: 16, lineHeight: 24 },
  primaryAction: { alignSelf: 'flex-start', marginTop: 4, paddingHorizontal: 18, minHeight: 48, justifyContent: 'center', backgroundColor: '#1d5f84' },
  primaryActionText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  section: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#d5dede', paddingHorizontal: 18 },
  sectionTitle: { paddingVertical: 18, color: '#18252e', fontSize: 17, fontWeight: '700' },
  workflowRow: { flexDirection: 'row', gap: 14, paddingVertical: 18, borderTopWidth: 1, borderTopColor: '#e2e8e9' },
  workflowNumber: { color: '#1d5f84', fontSize: 12, fontWeight: '800', letterSpacing: 0.8 },
  workflowCopy: { flex: 1, gap: 5 },
  workflowTitle: { color: '#18252e', fontSize: 16, fontWeight: '700' },
  workflowDetail: { color: '#58707e', fontSize: 14, lineHeight: 20 },
  outbox: { gap: 8, padding: 18, backgroundColor: '#f0f4f5', borderWidth: 1, borderColor: '#d3dee1' },
  controlSurface: { gap: 11, padding: 18, backgroundColor: '#eef5f8', borderWidth: 1, borderColor: '#b9d3e0' },
  controlSurfaceTitle: { paddingVertical: 0, color: '#18252e' },
  controlSurfaceText: { color: '#405b6a', fontSize: 14, lineHeight: 21 },
  controlTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  controlTag: { paddingHorizontal: 8, paddingVertical: 5, color: '#28698d', borderWidth: 1, borderColor: '#a8cde0', backgroundColor: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: .8 },
  outboxHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  outboxTitle: { color: '#18252e', fontSize: 16, fontWeight: '700' },
  outboxText: { color: '#1d5f84', fontSize: 14, fontWeight: '700' },
  outboxNote: { color: '#58707e', fontSize: 13, lineHeight: 19 },
  statusPill: { paddingHorizontal: 9, paddingVertical: 5, fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  statusPillReady: { color: '#165c48', backgroundColor: '#d8eee5' },
  statusPillError: { color: '#8f2d26', backgroundColor: '#f8dfdc' },
  alert: { color: '#8f2d26', backgroundColor: '#f8dfdc', borderWidth: 1, borderColor: '#efc5c0', padding: 14, fontSize: 14, lineHeight: 20 },
});
