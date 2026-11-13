import { useEffect } from "react";
import { type ReactNode } from "react";
import { View } from "react-native";
import { Redirect, useLocalSearchParams } from "expo-router";
import { ScreenState } from "../src/components/ui";
import { useLocale } from "../src/i18n";
import { colors } from "../src/theme";
import {
  carrierHome,
  emptyHome,
  hotelHome,
  reviewNotifications,
  reviewOrders,
  reviewProducts,
  reviewQuotes,
  reviewTracking,
  supplierHome,
} from "../src/review/fixtures";
import {
  AccountSurface,
  AlertsSurface,
  CatalogSurface,
  ChromeBar,
  ConfigSurface,
  DeskSurface,
  HomeSurface,
  OrdersSurface,
  QuotesSurface,
  ReceiveSurface,
  RespondSurface,
  SignInSurface,
  TrackingSurface,
  WorkSurface,
} from "../src/screens/surfaces";

export default function Review() {
  const { screen = "sign-in" } = useLocalSearchParams<{ screen?: string }>();
  const { setLanguage, t } = useLocale();
  if (process.env.EXPO_PUBLIC_HOVIN_VISUAL_REVIEW !== "1") return <Redirect href="/" />;
  const name = Array.isArray(screen) ? screen[0] : screen;
  useEffect(() => {
    setLanguage(name === "arabic-home" ? "ar" : "en");
  }, [name, setLanguage]);
  if (name === "sign-in") return <SignInSurface onSignIn={() => undefined} />;
  if (name === "hotel-home") return <Frame><HomeSurface home={hotelHome} review onOpenProposal={() => undefined} onOpenTask={() => undefined} /></Frame>;
  if (name === "supplier-home") return <Frame><HomeSurface home={supplierHome} review onOpenProposal={() => undefined} onOpenTask={() => undefined} testID="screen-supplier" /></Frame>;
  if (name === "carrier-home") return <Frame><HomeSurface home={carrierHome} review onOpenProposal={() => undefined} onOpenTask={() => undefined} testID="screen-carrier" /></Frame>;
  if (name === "empty") return <Frame><HomeSurface home={emptyHome} review onOpenProposal={() => undefined} onOpenTask={() => undefined} testID="screen-empty" /></Frame>;
  if (name === "arabic-home") return <Frame><HomeSurface home={hotelHome} review onOpenProposal={() => undefined} onOpenTask={() => undefined} testID="screen-arabic" /></Frame>;
  if (name === "work") return <Frame><WorkSurface workspace="hotel" onOpen={() => undefined} /></Frame>;
  if (name === "alerts") return <Frame><AlertsSurface notifications={reviewNotifications} onMark={() => undefined} /></Frame>;
  if (name === "account") return <Frame><AccountSurface account={hotelHome.account} onSignOut={() => undefined} /></Frame>;
  if (name === "catalog") return <CatalogSurface products={reviewProducts} query="" onQuery={() => undefined} quantity="4" onQuantity={() => undefined} onRequest={() => undefined} />;
  if (name === "quotes") return <QuotesSurface quotes={reviewQuotes} />;
  if (name === "orders") return <OrdersSurface orders={reviewOrders} onOpen={() => undefined} />;
  if (name === "tracking") return <TrackingSurface detail={reviewTracking} codeEntry="" onCode={() => undefined} onConfirm={() => undefined} />;
  if (name === "carrier-code") return <TrackingSurface detail={reviewTracking} codeEntry="" onCode={() => undefined} onConfirm={() => undefined} canConfirm={false} testID="screen-carrier-code" />;
  if (name === "receive") {
    return (
      <ReceiveSurface
        orderNumber="PO-1042"
        photoReady={false}
        onPhoto={() => undefined}
        onSubmit={() => undefined}
        onChange={() => undefined}
        lines={[{ id: "line-1", name: "Jasmine rice 5kg", remaining: 4, received: "4", accepted: "4", reason: "", notes: "" }]}
      />
    );
  }
  if (name === "respond") {
    return (
      <RespondSurface
        itemName="Jasmine rice 5kg"
        quantity={40}
        unitPrice="86"
        deliveryFee="0"
        taxAmount="0"
        leadTime="3"
        onChange={() => undefined}
        onSubmit={() => undefined}
      />
    );
  }
  if (name === "desk") return <DeskSurface deskPath="/orders" onOpen={() => undefined} onSignOut={() => undefined} />;
  if (name === "offline") return <ScreenState title={t("state.offline")} action={t("action.retry")} onPress={() => undefined} />;
  if (name === "error") return <ScreenState title={t("state.error")} action={t("action.retry")} onPress={() => undefined} />;
  if (name === "config") return <ConfigSurface />;
  return <SignInSurface onSignIn={() => undefined} />;
}

function Frame({ children }: { children: ReactNode }) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.paperDeep }}>
      <ChromeBar />
      {children}
    </View>
  );
}
