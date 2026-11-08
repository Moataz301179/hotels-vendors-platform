import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Image, Linking, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useClerk } from '@clerk/expo';
import { useHovinAuth, useHovinUser } from '../../testAuth';
import { useHostedAuth } from '@clerk/expo/hosted-auth';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import * as SQLite from 'expo-sqlite';
import * as Crypto from 'expo-crypto';

import { createHovinClient, HovinApiError, isRetryableReceiptFailure, resolveOrigin, type CountableProduct, type ReceiptContext, type ReceivingHandoff, type ReceiptSubmission } from '../../api/hovin';
import { enqueueGrn, flushGrns, getOutboxSummary, initializeOutbox, recordSuccessfulSync, type OutboxSummary } from '../../sync/offlineQueue';

type OutboxState = 'checking' | 'ready' | 'error';
type ConnectionState = 'connected' | 'offline';
type ReceiptDraft = Record<string, { received: string; accepted: string; reason: string; notes: string }>;

/**
 * HOVIN is a receiving companion, not a catalogue or a second purchasing
 * system. It renders only the signed-in hotel's authorized handoffs.
 */
export default function ReceivingHome() {
  const [outboxState, setOutboxState] = useState<OutboxState>('checking');
  const [message, setMessage] = useState<string | null>(null);
  const [database, setDatabase] = useState<SQLite.SQLiteDatabase | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>('connected');
  const [outboxSummary, setOutboxSummary] = useState<OutboxSummary>({ queued: 0, lastSyncAt: null });
  const [handoffs, setHandoffs] = useState<ReceivingHandoff[]>([]);
  const [selected, setSelected] = useState<ReceiptContext | null>(null);
  const [draft, setDraft] = useState<ReceiptDraft>({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [authStartupError, setAuthStartupError] = useState<string | null>(null);
  const [retryingAuthStartup, setRetryingAuthStartup] = useState(false);
  const didRetryClerkStartup = useRef(false);
  const { isLoaded, isSignedIn, getToken } = useHovinAuth();
  const { user } = useHovinUser();
  const clerk = useClerk();
  const { signOut } = clerk;
  const { startHostedAuth } = useHostedAuth();
  const origin = useMemo(() => resolveOrigin(), []);
  const api = useMemo(
    () => (origin.ok ? createHovinClient(() => getToken()) : null),
    [getToken, origin],
  );

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const database = await SQLite.openDatabaseAsync('hovin-receiving.db');
        await initializeOutbox(database);
        const summary = await getOutboxSummary(database, null);
        if (!cancelled) {
          setDatabase(database);
          setOutboxSummary(summary);
          setOutboxState('ready');
        }
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

  useEffect(() => {
    if (isLoaded) {
      setAuthStartupError(null);
      return;
    }

    // Clerk has already completed its network requests at this point on a
    // cold native launch. Retry its resource load once, then expose a useful
    // recovery state instead of leaving a receiver at an indefinite spinner.
    if (!didRetryClerkStartup.current) {
      didRetryClerkStartup.current = true;
      const reloadResources = clerk.__internal_reloadInitialResources;
      if (typeof reloadResources === 'function') {
        void reloadResources().catch(() => undefined);
      } else {
        setAuthStartupError('Secure access could not initialize in this installed build. Retry after reopening HOVIN.');
      }
    }

    const timeout = setTimeout(() => {
      setAuthStartupError('Secure access could not finish starting on this device. Retry to reload the protected receiving session.');
    }, 8_000);
    return () => clearTimeout(timeout);
  }, [clerk, isLoaded]);

  async function retrySecureAccess() {
    setRetryingAuthStartup(true);
    setAuthStartupError(null);
    try {
      const reloadResources = clerk.__internal_reloadInitialResources;
      if (typeof reloadResources !== 'function') {
        throw new Error('Clerk resource reload is unavailable in this build.');
      }
      await reloadResources();
    } catch {
      setAuthStartupError('Secure access could not be refreshed. Check the device connection, then retry.');
    } finally {
      setRetryingAuthStartup(false);
    }
  }

  async function loadHandoffs() {
    if (!isSignedIn || !api) return;
    setLoading(true);
    setMessage(null);
    try {
      const [{ handoffs: nextHandoffs }, { user: identity }] = await Promise.all([api.handoffs(), api.identity()]);
      if (database) {
        await flushGrns(database, identity.tenantId, async (item, idempotencyKey) => {
          await api.submitReceipt(JSON.parse(item.payload) as ReceiptSubmission, idempotencyKey);
        });
        await recordSuccessfulSync(database);
        setOutboxSummary(await getOutboxSummary(database, identity.tenantId));
      }
      setConnectionState('connected');
      setHandoffs(nextHandoffs);
    } catch (error) {
      if (isRetryableReceiptFailure(error)) {
        setConnectionState('offline');
        if (database) setOutboxSummary(await getOutboxSummary(database, null));
      } else {
        setMessage(receiptMessage(error));
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isSignedIn && outboxState === 'ready') void loadHandoffs();
  // The refresh trigger is intentionally session and local-storage readiness only.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, outboxState]);

  async function openHandoff(handoff: ReceivingHandoff) {
    if (!api) return;
    setLoading(true);
    setMessage(null);
    try {
      const context = await api.receiptContext(handoff.orderId);
      setSelected(context);
      setDraft(Object.fromEntries(context.order.items.map((item) => [item.id, {
        received: String(item.remainingQuantity), accepted: String(item.remainingQuantity), reason: '', notes: '',
      }])));
    } catch (error) {
      setMessage(receiptMessage(error));
    } finally {
      setLoading(false);
    }
  }

  function changeDraft(itemId: string, key: keyof ReceiptDraft[string], value: string) {
    setDraft((current) => ({ ...current, [itemId]: { ...current[itemId], [key]: value } }));
  }

  async function submitReceipt() {
    if (!selected || !database || !api) return;
    setSubmitting(true);
    setMessage(null);
    try {
      const { user: identity } = await api.identity();
      const payload: ReceiptSubmission = {
        orderId: selected.order.id,
        lines: selected.order.items.map((item) => {
          const line = draft[item.id];
          return {
            orderItemId: item.id,
            receivedQuantity: Number(line?.received ?? 0),
            acceptedQuantity: Number(line?.accepted ?? 0),
            rejectionReason: line?.reason.trim() || null,
            conditionNotes: line?.notes.trim() || null,
          };
        }),
      };
      const idempotencyKey = `hovin-grn-${Crypto.randomUUID()}`;
      try {
        const result = await api.submitReceipt(payload, idempotencyKey);
        setMessage(result.idempotent ? `Receipt ${result.grn.grnNumber} was already recorded.` : `Receipt ${result.grn.grnNumber} recorded.`);
      } catch (error) {
        if (!isRetryableReceiptFailure(error)) throw error;
        await enqueueGrn(database, identity.tenantId, idempotencyKey, payload);
        setMessage('Connection interrupted. The authorized receipt is held in the device outbox and will retry after the next signed-in refresh.');
      }
      setSelected(null);
      await loadHandoffs();
    } catch (error) {
      setMessage(receiptMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  async function openWorkspace() {
    try {
      await Linking.openURL('https://www.hotelsvendors.com/login?redirect_url=%2Forders');
    } catch {
      setMessage('The protected workspace could not be opened. Check this device connection and try again.');
    }
  }

  async function authenticate() {
    setMessage(null);
    try {
      const result = await startHostedAuth({ mode: 'sign-in', authSessionOptions: { preferEphemeralSession: false } });
      if (!result.createdSessionId) setMessage('Sign-in was not completed. Return to HOVIN and try again.');
    } catch {
      setMessage('Secure sign-in could not open. Confirm this build is registered in the active Clerk instance and try again.');
    }
  }

  const statusLabel = outboxState === 'checking'
    ? 'Preparing device receipt storage'
    : outboxState === 'ready'
      ? 'Offline receipt storage ready'
      : 'Offline receipt storage unavailable';

  if (!process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || !origin.ok) {
    return <ConfigurationRequired origin={origin.ok ? null : origin} />;
  }

  if (outboxState === 'checking') {
    return <LoadingScreen label="Preparing receipt storage" />;
  }

  if (!isLoaded) {
    if (authStartupError) {
      return <SecureAccessRecovery message={authStartupError} retrying={retryingAuthStartup} onRetry={() => void retrySecureAccess()} />;
    }
    return <LoadingScreen label="Connecting secure access" />;
  }

  if (!isSignedIn) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <BrandBar />
          <View style={styles.hero}>
            <Text style={styles.eyebrow}>HotelsVendors receiving companion</Text>
            <Text style={styles.title}>Accept a delivery with the record, not a workaround.</Text>
            <Text style={styles.body}>Sign in with the invited hotel receiving account. HOVIN never shows supplier, pricing, invoice, or catalogue data.</Text>
            <Pressable accessibilityRole="button" style={styles.primaryAction} onPress={authenticate}>
              <Text style={styles.primaryActionText}>Secure sign in</Text>
            </Pressable>
          </View>
          <ControlSequence />
          {message ? <Text accessibilityRole="alert" style={styles.alert}>{message}</Text> : null}
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (connectionState === 'offline' && !selected && !scannerOpen) {
    return <OfflineReceivingState summary={outboxSummary} onRetry={() => void loadHandoffs()} loading={loading} />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topline}><BrandBar /><Pressable onPress={() => void signOut()} accessibilityRole="button"><Text style={styles.signOut}>Sign out</Text></Pressable></View>

        <View style={styles.identityBar}><Text style={styles.identityText}>{user?.primaryEmailAddress?.emailAddress ?? 'Signed-in receiver'}</Text><Text style={styles.identityContext}>Authorized receiving only</Text></View>

        {scannerOpen ? <PhysicalCountScanner api={api} onClose={() => setScannerOpen(false)} onMessage={setMessage} /> : selected ? <ReceiptEditor context={selected} draft={draft} onChange={changeDraft} onCancel={() => setSelected(null)} onSubmit={() => void submitReceipt()} submitting={submitting} /> : <>
          <View style={styles.sectionHeader}><View><Text style={styles.eyebrow}>Today’s controlled handoffs</Text><Text style={styles.sectionTitle}>Receiving queue</Text></View><Pressable accessibilityRole="button" onPress={() => void loadHandoffs()} style={styles.textAction}><Text style={styles.textActionLabel}>{loading ? 'Refreshing' : 'Refresh'}</Text></Pressable></View>
          {loading ? <LoadingScreen label="Loading assigned handoffs" compact /> : null}
          {!loading && handoffs.length === 0 ? <View style={styles.empty}><Text style={styles.emptyTitle}>No receivable orders assigned</Text><Text style={styles.emptyText}>A receiving handoff appears here only after an authorized hotel order reaches its controlled delivery state.</Text><Pressable accessibilityRole="button" style={styles.secondaryAction} onPress={openWorkspace}><Text style={styles.secondaryActionText}>Open workspace</Text></Pressable></View> : null}
          {handoffs.map((handoff) => <Pressable accessibilityRole="button" key={handoff.orderId} style={styles.handoffCard} onPress={() => void openHandoff(handoff)}><View><Text style={styles.handoffNumber}>{handoff.orderNumber}</Text><Text style={styles.handoffMeta}>{handoff.lineCount} lines · {handoff.remainingQuantity} remaining</Text></View><Text style={styles.handoffOpen}>Open ›</Text></Pressable>)}
          <Pressable accessibilityRole="button" style={styles.scanAction} onPress={() => setScannerOpen(true)}><Text style={styles.scanActionLabel}>Open camera verification</Text><Text style={styles.scanActionMeta}>Barcode · QR · explicit physical count</Text></Pressable>
          <ControlSequence />
        </>}

        <View style={styles.controlSurface}>
          <Text style={[styles.sectionTitle, styles.controlSurfaceTitle]}>Field controls</Text>
          <Text style={styles.controlSurfaceText}>This device never creates a purchase, supplier, price, or stock record. It only retries an already authorized receipt with the same protected idempotency key.</Text>
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
            <StatusPill error={outboxState === 'error'} />
          </View>
          <Text style={styles.outboxText}>{statusLabel}</Text>
          <Text style={styles.outboxNote}>A receipt is queued only after the authenticated session provides its tenant, order and idempotency key. HOVIN never invents a receipt while offline.</Text>
        </View>

        {message ? <Text accessibilityRole="alert" style={styles.alert}>{message}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function OfflineReceivingState({ summary, onRetry, loading }: { summary: OutboxSummary; onRetry: () => void; loading: boolean }) {
  return <SafeAreaView style={styles.safeArea}><View style={styles.offlineScreen}><BrandBar /><View style={styles.offlineHero}><View style={styles.offlineStatus}><View style={styles.offlineStatusDot} /><Text style={styles.offlineStatusText}>Offline</Text></View><Text style={styles.eyebrow}>Receiving companion</Text><Text style={styles.offlineTitle}>Your receiving record stays clear while the connection is away.</Text><Text style={styles.body}>No delivery, count, supplier, or stock data is fabricated offline. HOVIN keeps only authorized receipt work already on this device.</Text><View style={styles.offlineMetrics}><View style={styles.offlineMetric}><Text style={styles.offlineMetricValue}>{summary.queued}</Text><Text style={styles.offlineMetricLabel}>{summary.queued === 1 ? 'receipt queued' : 'receipts queued'}</Text></View><View style={styles.offlineDivider} /><View style={styles.offlineMetric}><Text style={styles.offlineMetricValue}>{summary.lastSyncAt ? formatLastSync(summary.lastSyncAt) : 'Not yet'}</Text><Text style={styles.offlineMetricLabel}>last successful sync</Text></View></View><Pressable accessibilityRole="button" style={styles.primaryAction} onPress={onRetry} disabled={loading}><Text style={styles.primaryActionText}>{loading ? 'Checking connection…' : 'Retry when online'}</Text></Pressable></View><View style={styles.offlineControl}><Text style={styles.offlineControlTitle}>Receiving remains controlled</Text><Text style={styles.offlineControlText}>Queued receipts retain the original protected idempotency key and are sent only after a signed-in hotel session reconnects.</Text></View></View></SafeAreaView>;
}

function formatLastSync(timestamp: number) {
  const deltaMinutes = Math.max(0, Math.round((Date.now() - timestamp) / 60_000));
  if (deltaMinutes < 1) return 'Just now';
  if (deltaMinutes < 60) return `${deltaMinutes} min ago`;
  return new Date(timestamp).toLocaleString();
}

function BrandBar() {
  return <View style={styles.brandBar}><View style={styles.brandMarkFrame}><Image accessibilityLabel="HotelsVendors mark" source={require('../../../assets/hv-mark.png')} style={styles.brandMark} /></View><View><Text style={styles.brand}>HOVIN</Text><Text style={styles.context}>HotelsVendors · receiving companion</Text></View></View>;
}

function LoadingScreen({ label, compact = false }: { label: string; compact?: boolean }) { return <View style={compact ? styles.inlineLoading : styles.loading}><ActivityIndicator color={palette.accent} /><Text style={styles.loadingText}>{label}</Text></View>; }

function SecureAccessRecovery({ message, retrying, onRetry }: { message: string; retrying: boolean; onRetry: () => void }) {
  return <SafeAreaView style={styles.safeArea}><View style={styles.content}><BrandBar /><View style={styles.hero}><Text style={styles.eyebrow}>Secure access needs attention</Text><Text style={styles.title}>Receiving is protected until the session is ready.</Text><Text accessibilityRole="alert" style={styles.body}>{message}</Text><Pressable accessibilityRole="button" style={styles.primaryAction} disabled={retrying} onPress={onRetry}><Text style={styles.primaryActionText}>{retrying ? 'Retrying secure access…' : 'Retry secure access'}</Text></Pressable></View></View></SafeAreaView>;
}

function ConfigurationRequired({ origin }: { origin?: { code: string; message: string } | null }) {
  return <SafeAreaView style={styles.safeArea}><View style={styles.configuration}><Text style={styles.brand}>HOVIN</Text><Text style={styles.title}>Mobile access is not configured.</Text><Text style={styles.body}>{origin ? origin.message : 'This build needs the active Clerk publishable key before protected receiving can be opened. No data is available until configuration is complete.'}</Text></View></SafeAreaView>;
}

function ControlSequence() { return <View style={styles.section}><Text style={styles.sectionTitle}>Controlled receiving sequence</Text><WorkflowRow number="01" title="Assigned handoff" detail="Only an authorized hotel receiver opens the handoff." /><WorkflowRow number="02" title="Line receipt" detail="Remaining quantities are checked line by line." /><WorkflowRow number="03" title="Exception" detail="Rejected units require an explicit reason." /><WorkflowRow number="04" title="Record" detail="The server validates the GRN and preserves the audit trail." /></View>; }

function ReceiptEditor({ context, draft, onChange, onCancel, onSubmit, submitting }: { context: ReceiptContext; draft: ReceiptDraft; onChange: (id: string, key: keyof ReceiptDraft[string], value: string) => void; onCancel: () => void; onSubmit: () => void; submitting: boolean }) {
  return <View style={styles.editor}><Pressable onPress={onCancel} accessibilityRole="button"><Text style={styles.back}>‹ Receiving queue</Text></Pressable><Text style={styles.eyebrow}>Record delivery</Text><Text style={styles.editorTitle}>{context.order.orderNumber}</Text><Text style={styles.editorMeta}>{context.order.status.replaceAll('_', ' ')} · {context.order.items.length} lines</Text>{context.order.items.map((item) => { const line = draft[item.id] ?? { received: '', accepted: '', reason: '', notes: '' }; return <View key={item.id} style={styles.lineCard}><Text style={styles.lineTitle}>{item.product.name}</Text><Text style={styles.lineMeta}>Remaining {item.remainingQuantity}{item.product.unitOfMeasure ? ` ${item.product.unitOfMeasure}` : ''}</Text><View style={styles.inputRow}><QuantityField label="Received" value={line.received} onChangeText={(value) => onChange(item.id, 'received', value)} /><QuantityField label="Accepted" value={line.accepted} onChangeText={(value) => onChange(item.id, 'accepted', value)} /></View><TextInput value={line.reason} onChangeText={(value) => onChange(item.id, 'reason', value)} placeholder="Rejection reason (required if different)" placeholderTextColor="#9AA5AC" style={styles.input} /><TextInput value={line.notes} onChangeText={(value) => onChange(item.id, 'notes', value)} placeholder="Condition note (optional)" placeholderTextColor="#9AA5AC" style={styles.input} /></View>; })}<Text style={styles.evidenceNote}>Photo evidence upload is not enabled in this build. Do not attach unverified links; the receipt is recorded only with data the server can validate.</Text><Pressable accessibilityRole="button" disabled={!context.order.canRecordReceipt || submitting} style={[styles.primaryAction, (!context.order.canRecordReceipt || submitting) && styles.disabledAction]} onPress={onSubmit}><Text style={styles.primaryActionText}>{submitting ? 'Recording receipt…' : 'Record controlled receipt'}</Text></Pressable></View>;
}

function QuantityField({ label, value, onChangeText }: { label: string; value: string; onChangeText: (value: string) => void }) { return <View style={styles.quantityField}><Text style={styles.inputLabel}>{label}</Text><TextInput value={value} onChangeText={onChangeText} keyboardType="number-pad" style={styles.input} /></View>; }

function PhysicalCountScanner({ api, onClose, onMessage }: { api: ReturnType<typeof createHovinClient> | null; onClose: () => void; onMessage: (value: string | null) => void }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [mode, setMode] = useState<'barcode' | 'qr'>('barcode');
  const [scanning, setScanning] = useState(true);
  const [product, setProduct] = useState<CountableProduct | null>(null);
  const [barcode, setBarcode] = useState<string | null>(null);
  const [quantity, setQuantity] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);

  async function scan(result: BarcodeScanningResult) {
    if (!scanning) return;
    setScanning(false);
    try {
      if (!api) return;
      const resolved = await api.resolveBarcode(result.data);
      setProduct(resolved.product);
      setBarcode(resolved.barcode);
      onMessage(null);
    } catch (error) {
      onMessage(error instanceof HovinApiError && error.code === 'COUNTABLE_PRODUCT_NOT_FOUND' ? 'This code is not a countable item in your hotel. No count was recorded.' : receiptMessage(error));
      setScanning(true);
    }
  }

  async function submitCount() {
    if (!api || !product || !barcode || !confirmed || saving) return;
    const observedQuantity = Number(quantity);
    if (!Number.isInteger(observedQuantity) || observedQuantity < 0) {
      onMessage('Enter the whole number physically counted. Camera output cannot infer a quantity.');
      return;
    }
    setSaving(true);
    try {
      const result = await api.submitPhysicalCount({ productId: product.id, clientSubmissionId: Crypto.randomUUID(), observedQuantity, barcode, capturedAt: new Date().toISOString() });
      onMessage(`${result.message} A distinct hotel manager must review this observation before any reconciliation.`);
      onClose();
    } catch (error) {
      onMessage(receiptMessage(error));
    } finally {
      setSaving(false);
    }
  }

  if (!permission) return <LoadingScreen label="Checking camera permission" />;
  if (!permission.granted) return <View style={styles.scannerSurface}><Text style={styles.editorTitle}>Camera verification</Text><Text style={styles.body}>HOVIN requests camera access only when a signed-in hotel user chooses barcode or QR verification. It never runs in the background.</Text><Pressable accessibilityRole="button" style={styles.primaryAction} onPress={() => void requestPermission()}><Text style={styles.primaryActionText}>Allow camera</Text></Pressable><Pressable accessibilityRole="button" onPress={onClose}><Text style={styles.back}>Cancel</Text></Pressable></View>;
  if (product) return <View style={styles.scannerSurface}><Pressable accessibilityRole="button" onPress={onClose}><Text style={styles.back}>‹ Receiving queue</Text></Pressable><Text style={styles.eyebrow}>Physical count · human assertion required</Text><Text style={styles.editorTitle}>{product.name}</Text><Text style={styles.editorMeta}>{barcode} · {product.sku ?? 'No SKU'}</Text><TextInput value={quantity} onChangeText={setQuantity} keyboardType="number-pad" placeholder="Counted quantity" placeholderTextColor="#9AA5AC" style={styles.input} /><Pressable accessibilityRole="checkbox" accessibilityState={{ checked: confirmed }} onPress={() => setConfirmed((value) => !value)} style={styles.confirmRow}><Text style={styles.confirmBox}>{confirmed ? '✓' : ''}</Text><Text style={styles.confirmText}>I physically counted this item now. This submits an observation, not a stock adjustment.</Text></Pressable><Pressable accessibilityRole="button" disabled={!confirmed || saving} style={[styles.primaryAction, (!confirmed || saving) && styles.disabledAction]} onPress={() => void submitCount()}><Text style={styles.primaryActionText}>{saving ? 'Submitting count…' : 'Submit for distinct review'}</Text></Pressable><Pressable accessibilityRole="button" onPress={() => { setProduct(null); setBarcode(null); setQuantity(''); setConfirmed(false); setScanning(true); }}><Text style={styles.back}>Scan another item</Text></Pressable></View>;
  return <View style={styles.scannerSurface}><Pressable accessibilityRole="button" onPress={onClose}><Text style={styles.back}>‹ Receiving queue</Text></Pressable><Text style={styles.editorTitle}>Camera verification</Text><Text style={styles.body}>Choose the code type. A scan identifies a permitted hotel item only; it never creates an item or supplies a count.</Text><View style={styles.modeRow}><Pressable accessibilityRole="button" style={[styles.modeButton, mode === 'barcode' && styles.modeButtonActive]} onPress={() => { setMode('barcode'); setScanning(true); }}><Text style={[styles.modeLabel, mode === 'barcode' && styles.modeLabelActive]}>Barcode</Text></Pressable><Pressable accessibilityRole="button" style={[styles.modeButton, mode === 'qr' && styles.modeButtonActive]} onPress={() => { setMode('qr'); setScanning(true); }}><Text style={[styles.modeLabel, mode === 'qr' && styles.modeLabelActive]}>QR code</Text></Pressable></View><View style={styles.cameraFrame}><CameraView style={styles.camera} facing="back" barcodeScannerSettings={{ barcodeTypes: mode === 'qr' ? ['qr'] : ['ean13', 'ean8', 'code128', 'code39', 'upc_a', 'upc_e', 'itf14'] }} onBarcodeScanned={scanning ? scan : undefined} /></View><Text style={styles.scannerNote}>Object recognition is intentionally unavailable: HOVIN does not infer product identity from an image. Use a registered code or continue the receiving record manually.</Text></View>;
}

function receiptMessage(error: unknown) {
  if (error instanceof HovinApiError) {
    // An authentication/authorization failure must never look like an empty
    // queue. Surface it plainly instead.
    if (error.status === 401 || error.status === 403) {
      return 'This device session is not authorized for hotel receiving. The signed-in account is not provisioned in this environment — sign in with a hotel receiving account.';
    }
    const messages: Record<string, string> = { UNAUTHENTICATED: 'Your protected session has ended. Sign in again.', Unauthorized: 'This device session is not authorized for hotel receiving. Sign in with a hotel receiving account.', RECEIVING_ROLE_REQUIRED: 'This account is not assigned to hotel receiving.', RECEIPT_PERMISSION_REQUIRED: 'Your hotel role does not have receipt permission.', ORDER_NOT_RECEIVABLE: 'This handoff can no longer be received.', ETA_CLEARANCE_REQUIRED_BEFORE_DELIVERY: 'Final delivery remains blocked until the required ETA clearance is recorded.' };
    return messages[error.code] ?? 'The receiving record could not be completed. Review the line quantities and try again.';
  }
  return 'The protected service is unavailable. Check your connection and try again.';
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

const palette = {
  canvas: '#F4F3ED',
  surface: '#FFFFFF',
  elevated: '#FFFFFF',
  inset: '#F4F3ED',
  border: '#E5E5E7',
  borderStrong: '#C9C9CD',
  text: '#212325',
  textSoft: '#4A4B4D',
  textMuted: '#6B6C6D',
  accent: '#276AA9',
  accentInk: '#FFFFFF',
  accentWash: '#E8F0F8',
  positive: '#1F7A4D',
  positiveWash: '#E6F4EC',
  danger: '#B3261E',
  dangerWash: '#FDECEA',
} as const;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: palette.canvas },
  content: { padding: 20, gap: 16, backgroundColor: palette.canvas },
  topline: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brandBar: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandMarkFrame: { width: 34, height: 40, borderRadius: 9, backgroundColor: palette.elevated, borderWidth: 1, borderColor: palette.borderStrong, justifyContent: 'center', alignItems: 'center' },
  brandMark: { width: 20, height: 24, resizeMode: 'contain' },
  brand: { color: palette.text, fontSize: 20, fontWeight: '800', letterSpacing: 2.4 },
  context: { color: palette.textMuted, fontSize: 12, fontWeight: '600', marginTop: 3 },
  signOut: { color: palette.textSoft, fontSize: 13, fontWeight: '700' },
  hero: { gap: 14, padding: 22, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, borderRadius: 18 },
  eyebrow: { color: palette.textMuted, fontSize: 10, fontWeight: '800', letterSpacing: 1.25, textTransform: 'uppercase' },
  title: { color: palette.text, fontSize: 31, lineHeight: 37, fontWeight: '700', letterSpacing: -0.8 },
  body: { color: palette.textSoft, fontSize: 16, lineHeight: 24 },
  primaryAction: { alignSelf: 'flex-start', marginTop: 4, paddingHorizontal: 18, minHeight: 48, justifyContent: 'center', backgroundColor: palette.accent, borderRadius: 10 },
  primaryActionText: { color: palette.accentInk, fontSize: 15, fontWeight: '800' },
  disabledAction: { opacity: 0.46 },
  section: { backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, borderRadius: 16, paddingHorizontal: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 2 },
  sectionTitle: { paddingVertical: 8, color: palette.text, fontSize: 19, fontWeight: '700' },
  textAction: { minHeight: 40, paddingHorizontal: 10, justifyContent: 'center' },
  textActionLabel: { color: palette.accent, fontSize: 14, fontWeight: '800' },
  workflowRow: { flexDirection: 'row', gap: 14, paddingVertical: 16, borderTopWidth: 1, borderTopColor: palette.border },
  workflowNumber: { color: palette.textMuted, fontSize: 12, fontWeight: '800', letterSpacing: 0.8 },
  workflowCopy: { flex: 1, gap: 5 },
  workflowTitle: { color: palette.text, fontSize: 16, fontWeight: '700' },
  workflowDetail: { color: palette.textSoft, fontSize: 14, lineHeight: 20 },
  identityBar: { gap: 4, borderLeftWidth: 2, borderLeftColor: palette.accent, paddingLeft: 12, paddingVertical: 2 },
  identityText: { color: palette.text, fontSize: 14, fontWeight: '700' },
  identityContext: { color: palette.textMuted, fontSize: 12 },
  empty: { gap: 10, padding: 20, backgroundColor: palette.surface, borderColor: palette.border, borderRadius: 16, borderWidth: 1 },
  emptyTitle: { color: palette.text, fontSize: 17, fontWeight: '700' },
  emptyText: { color: palette.textSoft, fontSize: 14, lineHeight: 21 },
  secondaryAction: { alignSelf: 'flex-start', paddingVertical: 11, paddingHorizontal: 14, borderColor: palette.borderStrong, borderWidth: 1, borderRadius: 9 },
  secondaryActionText: { color: palette.textSoft, fontWeight: '700' },
  handoffCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: 18, backgroundColor: palette.surface, borderColor: palette.border, borderWidth: 1, borderRadius: 16 },
  handoffNumber: { color: palette.text, fontSize: 17, fontWeight: '800' },
  handoffMeta: { color: palette.textSoft, marginTop: 5, fontSize: 13 },
  handoffOpen: { color: palette.accent, fontSize: 14, fontWeight: '800' },
  outbox: { gap: 8, padding: 18, backgroundColor: palette.inset, borderWidth: 1, borderColor: palette.border, borderRadius: 16 },
  offlineScreen: { flex: 1, padding: 20, gap: 18, backgroundColor: palette.canvas },
  offlineHero: { gap: 16, padding: 22, backgroundColor: palette.surface, borderColor: palette.border, borderWidth: 1, borderRadius: 20 },
  offlineStatus: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 7, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: palette.accentWash, borderColor: palette.borderStrong, borderWidth: 1 },
  offlineStatusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: palette.accent },
  offlineStatusText: { color: palette.accent, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 },
  offlineTitle: { color: palette.text, fontSize: 29, lineHeight: 36, fontWeight: '800', letterSpacing: -0.7 },
  offlineMetrics: { flexDirection: 'row', alignItems: 'stretch', padding: 16, backgroundColor: palette.inset, borderRadius: 12, borderWidth: 1, borderColor: palette.border },
  offlineMetric: { flex: 1, gap: 5 },
  offlineMetricValue: { color: palette.text, fontSize: 18, fontWeight: '800' },
  offlineMetricLabel: { color: palette.textMuted, fontSize: 11, lineHeight: 16, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.55 },
  offlineDivider: { width: 1, marginHorizontal: 14, backgroundColor: palette.border },
  offlineControl: { gap: 7, padding: 18, backgroundColor: palette.inset, borderColor: palette.border, borderWidth: 1, borderRadius: 16 },
  offlineControlTitle: { color: palette.text, fontSize: 16, fontWeight: '800' },
  offlineControlText: { color: palette.textSoft, fontSize: 14, lineHeight: 21 },
  controlSurface: { gap: 11, padding: 18, backgroundColor: palette.elevated, borderWidth: 1, borderColor: palette.border, borderRadius: 16 },
  controlSurfaceTitle: { paddingVertical: 0, color: palette.text },
  controlSurfaceText: { color: palette.textSoft, fontSize: 14, lineHeight: 21 },
  controlTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  controlTag: { paddingHorizontal: 8, paddingVertical: 5, color: palette.textSoft, borderWidth: 1, borderColor: palette.borderStrong, backgroundColor: palette.inset, borderRadius: 6, fontSize: 10, fontWeight: '800', letterSpacing: .8 },
  outboxHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  outboxTitle: { color: palette.text, fontSize: 16, fontWeight: '700' },
  outboxText: { color: palette.accent, fontSize: 14, fontWeight: '700' },
  outboxNote: { color: palette.textSoft, fontSize: 13, lineHeight: 19 },
  statusPill: { paddingHorizontal: 9, paddingVertical: 5, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', borderRadius: 6 },
  statusPillReady: { color: palette.positive, backgroundColor: palette.positiveWash },
  statusPillError: { color: palette.danger, backgroundColor: palette.dangerWash },
  alert: { color: palette.danger, backgroundColor: palette.dangerWash, borderWidth: 1, borderColor: '#744147', padding: 14, borderRadius: 12, fontSize: 14, lineHeight: 20 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 28, backgroundColor: palette.canvas },
  inlineLoading: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, backgroundColor: palette.surface, borderRadius: 12 },
  loadingText: { color: palette.textSoft, fontSize: 14 },
  configuration: { flex: 1, justifyContent: 'center', padding: 24, gap: 16, backgroundColor: palette.canvas },
  editor: { gap: 14, padding: 18, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, borderRadius: 16 },
  back: { color: palette.accent, fontSize: 14, fontWeight: '700' },
  editorTitle: { color: palette.text, fontSize: 25, fontWeight: '800' },
  editorMeta: { color: palette.textSoft, fontSize: 13 },
  lineCard: { gap: 10, paddingTop: 16, borderTopWidth: 1, borderTopColor: palette.border },
  lineTitle: { color: palette.text, fontSize: 16, fontWeight: '700' },
  lineMeta: { color: palette.textSoft, fontSize: 13 },
  inputRow: { flexDirection: 'row', gap: 10 },
  quantityField: { flex: 1, gap: 5 },
  inputLabel: { color: palette.textSoft, fontSize: 12, fontWeight: '700' },
  input: { minHeight: 44, borderRadius: 8, borderColor: palette.borderStrong, borderWidth: 1, paddingHorizontal: 11, color: palette.text, backgroundColor: palette.inset, fontSize: 15 },
  evidenceNote: { color: palette.textSoft, fontSize: 13, lineHeight: 19 },
  scanAction: { gap: 3, padding: 18, borderRadius: 16, backgroundColor: palette.elevated, borderColor: palette.borderStrong, borderWidth: 1 },
  scanActionLabel: { color: palette.text, fontSize: 16, fontWeight: '800' },
  scanActionMeta: { color: palette.textSoft, fontSize: 13 },
  scannerSurface: { gap: 14, padding: 18, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, borderRadius: 16 },
  modeRow: { flexDirection: 'row', gap: 8 },
  modeButton: { flex: 1, minHeight: 42, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: palette.borderStrong, borderRadius: 9, backgroundColor: palette.inset },
  modeButtonActive: { backgroundColor: palette.accent, borderColor: palette.accent },
  modeLabel: { color: palette.text, fontWeight: '700' },
  modeLabelActive: { color: palette.accentInk },
  cameraFrame: { height: 360, overflow: 'hidden', borderRadius: 14, borderWidth: 1, borderColor: palette.borderStrong },
  camera: { flex: 1 },
  scannerNote: { color: palette.textSoft, fontSize: 13, lineHeight: 19 },
  confirmRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', paddingVertical: 8 },
  confirmBox: { width: 22, height: 22, borderWidth: 1, borderColor: palette.accent, borderRadius: 5, color: palette.accentInk, backgroundColor: palette.accent, textAlign: 'center', fontWeight: '900' },
  confirmText: { flex: 1, color: palette.textSoft, fontSize: 13, lineHeight: 19 },
});
