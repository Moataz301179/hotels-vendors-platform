import { type ReactNode } from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import type { PhoneCheckpoint, PhoneHome, PhoneNotification, PhoneOrder, PhoneOrderDetail, PhoneProposal, PhoneTask } from "../api/hovin";
import { recordedQuoteSpan, type RecordedQuote } from "../intelligence/quotes";
import { useLocale } from "../i18n";
import type { MessageKey } from "../i18n/messages";
import { colors, radius, space } from "../theme";
import { CommodityStrap } from "../components/CommodityStrap";
import { Button, Field, Group, Notice, Pan, Row, Status, T, Wordmark, factLabel } from "../components/ui";
import { reviewBundlePromotions, type BundlePromotion } from "../market/commodities";

export function ChromeBar() {
  return (
    <View style={{ backgroundColor: colors.chrome }}>
      <View style={{ paddingHorizontal: space.lg, paddingVertical: 20, alignItems: "center" }}>
        <Wordmark width={124} />
      </View>
      <View style={{ height: 1, backgroundColor: colors.lineSoft, opacity: 0.55 }} />
    </View>
  );
}

export function Page({
  children,
  refreshing = false,
  onRefresh,
  testID,
}: {
  children: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  testID?: string;
}) {
  return (
    <ScrollView
      testID={testID}
      contentContainerStyle={{ paddingHorizontal: space.lg, paddingTop: space.md + 4, paddingBottom: space.xl + 12, gap: 22, backgroundColor: colors.paper }}
      style={{ flex: 1, backgroundColor: colors.paper }}
      showsVerticalScrollIndicator={false}
      refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.ink} /> : undefined}
    >
      {children}
    </ScrollView>
  );
}

export function ProposalBlock({ proposal, onPress }: { proposal: PhoneProposal; onPress: () => void }) {
  const { t } = useLocale();
  const title = t(`proposal.${proposal.action}.title` as MessageKey);
  const reason = t(`proposal.${proposal.action}.reason` as MessageKey);
  return (
    <Pan style={{ gap: space.md }}>
      <T kind="caption" tone="muted">{t("proposal.kicker")}</T>
      <T kind="title">{title}</T>
      <T kind="body" tone="muted">{reason}</T>
      <View style={{ gap: space.sm, paddingVertical: space.xs }}>
        {proposal.evidence.map((fact) => (
          <View key={`${fact.key}-${fact.value}`} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: space.md }}>
            <T kind="label" tone="muted">{t(factLabel(fact.key))}</T>
            <T kind="headline">{fact.value}</T>
          </View>
        ))}
      </View>
      {proposal.action === "wait" ? null : <Button label={t("action.continue")} onPress={onPress} testID="proposal-continue" />}
      <T kind="caption" tone="muted">{t("proposal.authority")}</T>
    </Pan>
  );
}

export function HomeSurface({
  home,
  onOpenProposal,
  onOpenTask,
  refreshing,
  onRefresh,
  review = false,
  queued = 0,
  testID = "screen-home",
}: {
  home: PhoneHome;
  onOpenProposal: (proposal: PhoneProposal) => void;
  onOpenTask: (task: PhoneTask) => void;
  refreshing?: boolean;
  onRefresh?: () => void;
  review?: boolean;
  queued?: number;
  testID?: string;
}) {
  const { t } = useLocale();
  return (
    <Page testID={testID} refreshing={refreshing} onRefresh={onRefresh}>
      {review ? <Notice>{t("state.review")}</Notice> : null}
      {queued ? <Notice>{`${queued} · ${t("home.queued")}`}</Notice> : null}
      {home.plan.workspace === "hotel" || home.plan.workspace === "supplier" ? <CommodityStrap /> : null}
      <Pan style={{ gap: space.sm }}>
        <T kind="caption" tone="muted">{t(workspaceTitle(home.plan.workspace))}</T>
        <T kind="title">{home.account.name || home.account.email || home.account.role}</T>
        <T kind="body" tone="muted">{t(workspaceSummary(home.plan.workspace))}</T>
      </Pan>
      <ProposalBlock proposal={home.proposal} onPress={() => onOpenProposal(home.proposal)} />
      <View style={{ gap: space.sm }}>
        <T kind="caption" tone="muted">{t("home.queue")}</T>
        {home.tasks.length === 0 ? <Notice>{t("home.empty")}</Notice> : (
          <Group>
            {home.tasks.map((task, index) => {
              const copy = taskCopy(task, t);
              return (
              <Row
                key={task.id}
                title={copy.title}
                detail={`${copy.detail} · ${task.status}`}
                onPress={() => onOpenTask(task)}
                hairline={index < home.tasks.length - 1}
                testID={`task-${task.id}`}
              />
              );
            })}
          </Group>
        )}
      </View>
      {home.plan.workspace === "desk" ? null : (
        <View style={{ gap: space.sm }}>
          <T kind="caption" tone="muted">{t("home.withheld")}</T>
          <Notice>{t(withheldKey(home.plan.workspace))}</Notice>
        </View>
      )}
    </Page>
  );
}

export function WorkSurface({
  workspace,
  onOpen,
  testID = "screen-work",
}: {
  workspace: PhoneHome["plan"]["workspace"];
  onOpen: (path: "catalog" | "quotes" | "orders" | "requests") => void;
  testID?: string;
}) {
  const { t } = useLocale();
  const rows = workspace === "supplier"
    ? [{ id: "requests" as const, title: t("work.requests"), detail: t("proposal.respond.reason") }, { id: "orders" as const, title: t("work.orders"), detail: t("orders.sealed") }]
    : workspace === "carrier-code"
      ? [{ id: "orders" as const, title: t("work.codes"), detail: t("tracking.portal") }]
      : [
          { id: "catalog" as const, title: t("work.catalog"), detail: t("catalog.anonymous") },
          { id: "quotes" as const, title: t("work.quotes"), detail: t("quotes.desk") },
          { id: "orders" as const, title: t("work.orders"), detail: t("orders.sealed") },
        ];
  return (
    <Page testID={testID}>
      <T kind="title">{t("nav.work")}</T>
      <Group>
        {rows.map((row, index) => (
          <Row key={row.id} title={row.title} detail={row.detail} onPress={() => onOpen(row.id)} hairline={index < rows.length - 1} testID={`work-${row.id}`} />
        ))}
      </Group>
    </Page>
  );
}

export function AlertsSurface({
  notifications,
  onMark,
  refreshing,
  onRefresh,
  testID = "screen-alerts",
}: {
  notifications: PhoneNotification[];
  onMark: (id: string) => void;
  refreshing?: boolean;
  onRefresh?: () => void;
  testID?: string;
}) {
  const { t } = useLocale();
  return (
    <Page testID={testID} refreshing={refreshing} onRefresh={onRefresh}>
      <T kind="title">{t("alerts.title")}</T>
      {notifications.length === 0 ? <Notice>{t("alerts.empty")}</Notice> : (
        <Group>
          {notifications.map((note, index) => (
            <Row
              key={note.id}
              title={note.subject || note.type}
              detail={note.body || ""}
              onPress={note.readAt ? undefined : () => onMark(note.id)}
              hairline={index < notifications.length - 1}
            />
          ))}
        </Group>
      )}
    </Page>
  );
}

export function AccountSurface({
  account,
  onSignOut,
  testID = "screen-account",
}: {
  account: PhoneHome["account"];
  onSignOut: () => void;
  testID?: string;
}) {
  const { t, language, setLanguage } = useLocale();
  return (
    <Page testID={testID}>
      <T kind="title">{account.name || account.email || t("nav.account")}</T>
      <T kind="body" tone="muted">{account.email || ""}</T>
      <Notice>{`${t("account.role")}: ${account.role}`}</Notice>
      <View style={{ gap: space.sm }}>
        <T kind="caption" tone="muted">{t("account.language")}</T>
        <View style={{ flexDirection: "row", gap: space.sm }}>
          <View style={{ flex: 1 }}><Button label={t("account.english")} tone={language === "en" ? "blue" : "quiet"} onPress={() => setLanguage("en")} testID="language-en" /></View>
          <View style={{ flex: 1 }}><Button label={t("account.arabic")} tone={language === "ar" ? "blue" : "quiet"} onPress={() => setLanguage("ar")} testID="language-ar" /></View>
        </View>
      </View>
      <Button label={t("action.signOut")} tone="quiet" onPress={onSignOut} testID="sign-out" />
    </Page>
  );
}

export function CatalogSurface({
  products,
  query,
  onQuery,
  quantity,
  onQuantity,
  onRequest,
  busy,
  note,
  promotions = reviewBundlePromotions,
  onOpenPromotion,
  testID = "screen-catalog",
}: {
  products: Array<{ id: string; name: string; category: string; unitOfMeasure: string }>;
  query: string;
  onQuery: (value: string) => void;
  quantity: string;
  onQuantity: (value: string) => void;
  onRequest: (productId: string) => void;
  busy?: boolean;
  note?: string;
  promotions?: BundlePromotion[];
  onOpenPromotion?: (promotion: BundlePromotion) => void;
  testID?: string;
}) {
  const { t, language } = useLocale();
  const arabic = language === "ar";
  return (
    <Page testID={testID}>
      <T kind="title">{t("catalog.title")}</T>
      <View style={{ gap: space.sm }}>
        <View style={{ flexDirection: arabic ? "row-reverse" : "row", justifyContent: "space-between", alignItems: "center" }}>
          <T kind="caption" tone="muted">{t("catalog.promotions")}</T>
          <T kind="caption" tone="muted">{t("catalog.anonymousShort")}</T>
        </View>
        {promotions.map((promo) => (
          <Pan key={promo.id} style={{ gap: space.sm }}>
            <Status label={arabic ? promo.badgeAr : promo.badgeEn} tone="quiet" />
            <T kind="headline">{arabic ? promo.titleAr : promo.titleEn}</T>
            <T kind="body" tone="muted">{arabic ? promo.detailAr : promo.detailEn}</T>
            <T kind="label">{arabic ? promo.itemsAr : promo.itemsEn}</T>
            <T kind="caption" tone="muted">{arabic ? promo.unitHintAr : promo.unitHintEn}</T>
            <Button
              label={t("catalog.request")}
              tone="blue"
              onPress={() => (onOpenPromotion ? onOpenPromotion(promo) : products[0] ? onRequest(products[0].id) : undefined)}
              disabled={busy || (!onOpenPromotion && products.length === 0)}
              testID={`promo-${promo.id}`}
            />
          </Pan>
        ))}
      </View>
      <Field label={t("catalog.search")} value={query} onChangeText={onQuery} />
      <Field label={t("catalog.quantity")} value={quantity} onChangeText={onQuantity} keyboardType="number-pad" />
      {note ? <Notice tone="danger">{note}</Notice> : null}
      {products.length === 0 ? <Notice>{t("catalog.empty")}</Notice> : (
        <Group>
          {products.map((product, index) => (
            <Row
              key={product.id}
              title={product.name}
              detail={`${product.category} · ${product.unitOfMeasure}`}
              onPress={busy ? undefined : () => onRequest(product.id)}
              hairline={index < products.length - 1}
              testID={`catalog-${product.id}`}
            />
          ))}
        </Group>
      )}
    </Page>
  );
}

export function QuotesSurface({ quotes, testID = "screen-quotes" }: { quotes: RecordedQuote[]; testID?: string }) {
  const { t } = useLocale();
  const span = recordedQuoteSpan(quotes);
  return (
    <Page testID={testID}>
      <T kind="title">{t("quotes.title")}</T>
      <Notice>{t("quotes.desk")}</Notice>
      {span ? (
        <View style={{ gap: space.sm }}>
          <Status label={t("quotes.span")} tone="blue" />
          <T kind="hero">{`${span.low.unitPrice} ${span.low.currency}`}</T>
          <T kind="body" tone="muted">{`${span.low.reference} · ${span.count}`}</T>
          <T kind="caption" tone="muted">{t("quotes.note")}</T>
        </View>
      ) : <Notice>{t("quotes.empty")}</Notice>}
      {quotes.length ? (
        <Group>
          {quotes.map((quote, index) => (
            <Row key={quote.reference} title={quote.reference} detail={`${quote.unitPrice} ${quote.currency}`} hairline={index < quotes.length - 1} />
          ))}
        </Group>
      ) : null}
    </Page>
  );
}

export function OrdersSurface({
  orders,
  onOpen,
  testID = "screen-orders",
}: {
  orders: PhoneOrder[];
  onOpen: (id: string) => void;
  testID?: string;
}) {
  const { t } = useLocale();
  return (
    <Page testID={testID}>
      <T kind="title">{t("orders.title")}</T>
      {orders.length === 0 ? <Notice>{t("orders.empty")}</Notice> : (
        <Group>
          {orders.map((order, index) => (
            <Row
              key={order.id}
              title={order.orderNumber}
              detail={order.supplierName ? `${order.status} · ${order.supplierName}` : order.status}
              onPress={() => onOpen(order.id)}
              hairline={index < orders.length - 1}
              testID={`order-${order.id}`}
            />
          ))}
        </Group>
      )}
      <Notice>{orders.some((order) => order.supplierName) ? t("orders.identity") : t("orders.sealed")}</Notice>
    </Page>
  );
}

export function TrackingSurface({
  detail,
  codeEntry,
  onCode,
  onConfirm,
  canConfirm = true,
  note,
  testID = "screen-tracking",
}: {
  detail: PhoneOrderDetail;
  codeEntry: string;
  onCode: (value: string) => void;
  onConfirm: () => void;
  canConfirm?: boolean;
  note?: string;
  testID?: string;
}) {
  const { t } = useLocale();
  return (
    <Page testID={testID}>
      <T kind="caption" tone="muted">{t("tracking.referred")}</T>
      <T kind="title">{detail.orderNumber}</T>
      <Status label={detail.status} tone="blue" />
      <Group>
        {detail.checkpoints.map((step, index) => (
          <Row
            key={step.key}
            title={t(`checkpoint.${step.key}` as MessageKey)}
            detail={checkpointDetail(step, t)}
            hairline={index < detail.checkpoints.length - 1}
          />
        ))}
      </Group>
      <Notice>{t("tracking.portal")}</Notice>
      {detail.deliveryCode.available ? (
        <Pan style={{ gap: space.md }}>
          <T kind="caption" tone="muted">{t("tracking.code")}</T>
          <T kind="hero">{detail.deliveryCode.code}</T>
          {detail.deliveryCode.confirmedAt ? <Status label={t("tracking.confirm")} tone="green" /> : canConfirm ? (
            <>
              <Field label={t("tracking.enter")} value={codeEntry} onChangeText={onCode} keyboardType="number-pad" maxLength={6} />
              <Button label={t("tracking.confirm")} onPress={onConfirm} testID="confirm-code" />
            </>
          ) : null}
        </Pan>
      ) : <Notice>{t("tracking.unavailable")}</Notice>}
      {note ? <Notice tone="danger">{note}</Notice> : null}
    </Page>
  );
}

function workspaceTitle(workspace: PhoneHome["plan"]["workspace"]): MessageKey {
  if (workspace === "supplier") return "workspace.supplier.title";
  if (workspace === "carrier-code") return "workspace.carrier.title";
  if (workspace === "desk") return "workspace.desk.title";
  return "workspace.hotel.title";
}

function workspaceSummary(workspace: PhoneHome["plan"]["workspace"]): MessageKey {
  if (workspace === "supplier") return "workspace.supplier.summary";
  if (workspace === "carrier-code") return "workspace.carrier.summary";
  if (workspace === "desk") return "workspace.desk.summary";
  return "workspace.hotel.summary";
}

function withheldKey(workspace: PhoneHome["plan"]["workspace"]): MessageKey {
  if (workspace === "supplier") return "withheld.supplier";
  if (workspace === "carrier-code") return "withheld.carrier";
  if (workspace === "desk") return "withheld.desk";
  return "withheld.hotel";
}

function taskCopy(task: PhoneTask, t: (key: MessageKey) => string) {
  if (task.module === "quotes") return { title: t("work.quotes"), detail: `${t("fact.responses")} ${task.amount ?? 0}` };
  if (task.module === "receive") return { title: task.title, detail: `${t("fact.remaining")} ${task.amount ?? 0}` };
  if (task.module === "respond") return { title: task.title, detail: `${t("fact.quantity")} ${task.amount ?? 0}` };
  if (task.module === "tracking" || task.module === "code") return { title: task.title, detail: t("tracking.referred") };
  return { title: task.title, detail: task.detail };
}

function checkpointDetail(step: PhoneCheckpoint, t: (key: MessageKey) => string) {
  const when = step.at ? step.at.slice(0, 16).replace("T", " ") : t(`checkpoint.${step.state}` as MessageKey);
  return when;
}

export function DeskSurface({ deskPath, onOpen, onSignOut, testID = "screen-desk" }: { deskPath: string; onOpen: () => void; onSignOut?: () => void; testID?: string }) {
  const { t } = useLocale();
  return (
    <Page testID={testID}>
      <T kind="title">{t("workspace.desk.title")}</T>
      <T kind="body" tone="muted">{t("workspace.desk.summary")}</T>
      <Notice>{deskPath}</Notice>
      <Button label={t("action.openDesk")} onPress={onOpen} />
      {onSignOut ? <Button label={t("action.signOut")} tone="quiet" onPress={onSignOut} testID="sign-out" /> : null}
    </Page>
  );
}

export function ReceiveSurface({
  orderNumber,
  lines,
  onChange,
  photoReady,
  onPhoto,
  onSubmit,
  note,
  testID = "screen-receive",
}: {
  orderNumber: string;
  lines: Array<{ id: string; name: string; remaining: number; received: string; accepted: string; reason: string; notes: string }>;
  onChange: (id: string, field: "received" | "accepted" | "reason" | "notes", value: string) => void;
  photoReady: boolean;
  onPhoto: () => void;
  onSubmit: () => void;
  note?: string;
  testID?: string;
}) {
  const { t } = useLocale();
  return (
    <Page testID={testID}>
      <T kind="caption" tone="muted">{t("receive.title")}</T>
      <T kind="title">{orderNumber}</T>
      {lines.map((line) => (
        <View key={line.id} style={{ gap: space.sm }}>
          <T kind="headline">{line.name}</T>
          <T kind="body" tone="muted">{`${t("fact.remaining")} ${line.remaining}`}</T>
          <Field label={t("receive.received")} value={line.received} onChangeText={(value) => onChange(line.id, "received", value)} keyboardType="number-pad" />
          <Field label={t("receive.accepted")} value={line.accepted} onChangeText={(value) => onChange(line.id, "accepted", value)} keyboardType="number-pad" />
          <Field label={t("receive.reason")} value={line.reason} onChangeText={(value) => onChange(line.id, "reason", value)} />
          <Field label={t("receive.notes")} value={line.notes} onChangeText={(value) => onChange(line.id, "notes", value)} />
        </View>
      ))}
      <Button label={photoReady ? t("receive.photoHeld") : t("receive.photo")} tone={photoReady ? "quiet" : "chrome"} onPress={onPhoto} testID="receipt-photo" />
      {note ? <Notice tone={note === t("receive.saved") || note === t("receive.queued") ? "paper" : "danger"}>{note}</Notice> : null}
      <Button label={t("receive.record")} onPress={onSubmit} testID="record-receipt" />
    </Page>
  );
}

export function RespondSurface({
  itemName,
  quantity,
  unitPrice,
  deliveryFee,
  taxAmount,
  leadTime,
  onChange,
  onSubmit,
  note,
  testID = "screen-respond",
}: {
  itemName: string;
  quantity: number;
  unitPrice: string;
  deliveryFee: string;
  taxAmount: string;
  leadTime: string;
  onChange: (field: "unitPrice" | "deliveryFee" | "taxAmount" | "leadTime", value: string) => void;
  onSubmit: () => void;
  note?: string;
  testID?: string;
}) {
  const { t } = useLocale();
  return (
    <Page testID={testID}>
      <T kind="title">{t("respond.title")}</T>
      <T kind="headline">{itemName}</T>
      <Notice>{`${t("fact.quantity")} ${quantity}`}</Notice>
      <Field label={t("respond.price")} value={unitPrice} onChangeText={(value) => onChange("unitPrice", value)} keyboardType="decimal-pad" />
      <Field label={t("respond.delivery")} value={deliveryFee} onChangeText={(value) => onChange("deliveryFee", value)} keyboardType="decimal-pad" />
      <Field label={t("respond.tax")} value={taxAmount} onChangeText={(value) => onChange("taxAmount", value)} keyboardType="decimal-pad" />
      <Field label={t("respond.lead")} value={leadTime} onChangeText={(value) => onChange("leadTime", value)} keyboardType="number-pad" />
      {note ? <Notice>{note}</Notice> : null}
      <Button label={t("respond.submit")} onPress={onSubmit} testID="submit-response" />
    </Page>
  );
}

export function SignInSurface({ onSignIn, failed, testID = "screen-sign-in" }: { onSignIn: () => void; failed?: boolean; testID?: string }) {
  const { t } = useLocale();
  return (
    <View testID={testID} style={{ flex: 1, backgroundColor: colors.paper }}>
      <View style={{ paddingHorizontal: space.lg, paddingTop: space.xl + 8, paddingBottom: space.md }}>
        <Wordmark width={132} />
      </View>
      <View style={{ flex: 1, paddingHorizontal: space.lg, paddingBottom: space.xl, justifyContent: "center" }}>
        <Pan style={{ gap: space.lg }}>
          <T kind="title">{t("signin.title")}</T>
          <T kind="body" tone="muted">{t("signin.body")}</T>
          {failed ? <Notice tone="danger">{t("signin.failed")}</Notice> : null}
          <Button label={t("action.signIn")} onPress={onSignIn} testID="sign-in" />
        </Pan>
      </View>
    </View>
  );
}

export function ConfigSurface({ testID = "screen-config" }: { testID?: string }) {
  const { t } = useLocale();
  return (
    <View testID={testID} style={{ flex: 1, backgroundColor: colors.paper, padding: space.lg, justifyContent: "center", gap: space.md }}>
      <T kind="title">{t("config.title")}</T>
      <T kind="body">{t("config.body")}</T>
    </View>
  );
}
