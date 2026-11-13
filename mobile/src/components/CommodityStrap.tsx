import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, View, useWindowDimensions } from "react-native";
import { hotelCommodityBoard, type CommodityQuote } from "../market/commodities";
import { useLocale } from "../i18n";
import { colors, radius, space, type as typeScale } from "../theme";
import { T } from "./ui";

function Chip({ item, arabic }: { item: CommodityQuote; arabic: boolean }) {
  const name = arabic ? item.nameAr : item.nameEn;
  const unit = arabic ? item.unitAr : item.unitEn;
  const up = item.changePct >= 0;
  return (
    <View
      style={{
        flexDirection: arabic ? "row-reverse" : "row",
        alignItems: "center",
        gap: space.sm,
        backgroundColor: colors.card,
        borderRadius: radius.pill,
        paddingHorizontal: space.md,
        paddingVertical: 10,
        marginEnd: space.sm,
      }}
    >
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.yellow }} />
      <Animated.Text
        allowFontScaling
        style={[typeScale.label, { color: colors.ink, writingDirection: arabic ? "rtl" : "ltr" }]}
      >
        {name}
      </Animated.Text>
      <Animated.Text allowFontScaling style={[typeScale.headline, { color: colors.yellow }]}>
        {`${item.price} ${item.currency}`}
      </Animated.Text>
      <Animated.Text allowFontScaling style={[typeScale.caption, { color: colors.muted }]}>
        {`/ ${unit}`}
      </Animated.Text>
      <Animated.Text allowFontScaling style={[typeScale.caption, { color: up ? colors.green : colors.danger }]}>
        {`${up ? "+" : ""}${item.changePct.toFixed(1)}%`}
      </Animated.Text>
    </View>
  );
}

export function CommodityStrap({
  items = hotelCommodityBoard,
}: {
  items?: CommodityQuote[];
}) {
  const { t, isRtl } = useLocale();
  // Commodity names and prices stay Arabic; chrome labels follow the UI locale.
  const arabic = true;
  const { width } = useWindowDimensions();
  const offset = useRef(new Animated.Value(0)).current;
  const [trackWidth, setTrackWidth] = useState(0);
  const loop = useMemo(() => [...items, ...items], [items]);

  useEffect(() => {
    if (trackWidth <= 0) return;
    offset.setValue(0);
    const distance = trackWidth / 2;
    const animation = Animated.loop(
      Animated.timing(offset, {
        toValue: isRtl ? distance : -distance,
        duration: Math.max(18000, distance * 18),
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    animation.start();
    return () => animation.stop();
  }, [offset, trackWidth, isRtl]);

  return (
    <View style={{ gap: space.sm }} testID="commodity-strap">
      <View style={{ flexDirection: isRtl ? "row-reverse" : "row", justifyContent: "space-between", alignItems: "center" }}>
        <T kind="caption">{t("market.strap")}</T>
        <T kind="caption" tone="muted">{t("market.reference")}</T>
      </View>
      <View style={{ overflow: "hidden", width: "100%", borderRadius: radius.lg, backgroundColor: colors.paperRaised, paddingVertical: space.sm }}>
        <Animated.View
          onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
          style={{
            flexDirection: "row",
            transform: [{ translateX: offset }],
            paddingHorizontal: space.sm,
            minWidth: width,
          }}
        >
          {loop.map((item, index) => (
            <Chip key={`${item.id}-${index}`} item={item} arabic={arabic} />
          ))}
        </Animated.View>
      </View>
    </View>
  );
}
