import { createContext, useContext, type ReactNode } from "react";
import { Image, Pressable, Text, TextInput, View, type TextInputProps, type ViewStyle } from "react-native";
import { useLocale } from "../i18n";
import { colors, fonts, onBlueType, panStyle, panWhiteStyle, pillCtaStyle, radius, space, type as typeScale } from "../theme";
import type { MessageKey } from "../i18n/messages";

const wordmark = require("../../assets/hovin-wordmark.png");

type PanSurface = "dark" | "light";
const PanSurfaceContext = createContext<PanSurface>("dark");

export function Wordmark({ width = 132 }: { width?: number }) {
  return (
    <Image
      source={wordmark}
      accessibilityLabel="HOVIN"
      resizeMode="contain"
      style={{ width, height: width * (49 / 132), backgroundColor: "transparent" }}
    />
  );
}

/**
 * Primary pan = charcoal + thin outline.
 * Secondary pan (`tone="white"`) = white fill when two pans share a screen.
 */
export function Pan({
  children,
  style,
  tone = "dark",
}: {
  children: ReactNode;
  style?: ViewStyle;
  tone?: PanSurface | "white";
}) {
  const surface: PanSurface = tone === "white" || tone === "light" ? "light" : "dark";
  return (
    <PanSurfaceContext.Provider value={surface}>
      <View style={[surface === "light" ? panWhiteStyle : panStyle, style]}>{children}</View>
    </PanSurfaceContext.Provider>
  );
}

export function T({
  kind = "body",
  tone = "ink",
  children,
  style,
}: {
  kind?: keyof typeof typeScale;
  tone?: "ink" | "muted" | "chrome" | "danger";
  children: string;
  style?: ViewStyle | object;
}) {
  const { isRtl } = useLocale();
  const surface = useContext(PanSurfaceContext);
  const onLight = surface === "light";
  const color = tone === "danger" ? colors.danger
    : tone === "chrome" ? colors.chromeText
      : tone === "muted" ? (onLight ? colors.mutedOnWhite : colors.muted)
        : (onLight ? colors.inkOnWhite : colors.ink);
  return (
    <Text
      allowFontScaling
      style={[typeScale[kind], { color, writingDirection: isRtl ? "rtl" : "ltr", textAlign: "auto" }, style]}
    >
      {children}
    </Text>
  );
}

function ctaFill(tone: "blue" | "chrome" | "quiet") {
  if (tone === "chrome") {
    return {
      backgroundColor: "#e8e9ea",
      borderWidth: 1,
      borderColor: "rgba(0,0,0,0.12)",
    };
  }
  if (tone === "quiet") {
    return {
      backgroundColor: "transparent",
      borderWidth: 1,
      borderColor: colors.frame,
    };
  }
  return { backgroundColor: colors.blue, borderWidth: 0 };
}

export function Button({
  label,
  onPress,
  tone = "blue",
  disabled = false,
  testID,
}: {
  label: string;
  onPress: () => void;
  tone?: "blue" | "chrome" | "quiet";
  disabled?: boolean;
  testID?: string;
}) {
  const surface = useContext(PanSurfaceContext);
  const blackType = tone === "blue" || tone === "chrome";
  const quietOnLight = tone === "quiet" && surface === "light";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => ({
        ...pillCtaStyle,
        alignItems: "center",
        justifyContent: "center",
        ...ctaFill(tone),
        ...(quietOnLight ? { borderColor: colors.frameOnWhite, backgroundColor: colors.cardWhite } : null),
        opacity: disabled ? 0.45 : pressed ? 0.82 : 1,
        transform: [{ scale: pressed && !disabled ? 0.985 : 1 }],
      })}
    >
      <Text
        allowFontScaling
        style={blackType
          ? onBlueType
          : [typeScale.body, {
            color: quietOnLight ? colors.inkOnWhite : colors.ink,
            fontFamily: fonts.bodyRegular,
            fontWeight: "400",
          }]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function Field({ label, ...props }: { label: string } & TextInputProps) {
  const { isRtl } = useLocale();
  return (
    <View style={{ gap: space.xs }}>
      <T kind="label" tone="muted">{label}</T>
      <TextInput
        allowFontScaling
        placeholderTextColor={colors.muted}
        {...props}
        style={{
          minHeight: 52,
          borderWidth: 1,
          borderColor: colors.frame,
          borderRadius: radius.md,
          backgroundColor: colors.card,
          color: colors.ink,
          paddingHorizontal: space.md,
          fontSize: 15,
          fontFamily: fonts.bodyRegular,
          fontWeight: "400",
          textAlign: isRtl ? "right" : "left",
          writingDirection: isRtl ? "rtl" : "ltr",
        }}
      />
    </View>
  );
}

/** List widget — charcoal frame only; white fill is for pans, not widgets. */
export function Group({ children }: { children: ReactNode }) {
  return (
    <PanSurfaceContext.Provider value="dark">
      <View style={[panStyle, { padding: 0, overflow: "hidden" }]}>
        {children}
      </View>
    </PanSurfaceContext.Provider>
  );
}

export function Row({
  title,
  detail,
  onPress,
  hairline = true,
  testID,
}: {
  title: string;
  detail?: string;
  onPress?: () => void;
  hairline?: boolean;
  testID?: string;
}) {
  const { isRtl } = useLocale();
  const surface = useContext(PanSurfaceContext);
  const hair = surface === "light" ? colors.lineOnWhite : colors.lineSoft;
  const chevron = surface === "light" ? colors.mutedOnWhite : colors.muted;
  const body = (
    <View style={{
      minHeight: 60,
      paddingHorizontal: space.md,
      paddingVertical: space.md,
      borderBottomWidth: hairline ? 1 : 0,
      borderBottomColor: hair,
      flexDirection: isRtl ? "row-reverse" : "row",
      alignItems: "center",
      gap: space.md,
    }}>
      <View style={{ flex: 1, gap: 3 }}>
        <T kind="headline">{title}</T>
        {detail ? <T kind="caption" tone="muted">{detail}</T> : null}
      </View>
      {onPress ? <Text style={{ color: chevron, fontSize: 20, fontFamily: fonts.bodyRegular }}>{isRtl ? "‹" : "›"}</Text> : null}
    </View>
  );
  if (!onPress) return body;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} testID={testID} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
      {body}
    </Pressable>
  );
}

export function Status({ label, tone }: { label: string; tone: "blue" | "green" | "quiet" | "lime" }) {
  if (tone === "lime") {
    return (
      <View style={{
        alignSelf: "flex-start",
        backgroundColor: colors.lime,
        borderRadius: radius.pill,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.14)",
      }}>
        <Text allowFontScaling style={[onBlueType, { fontSize: 12, lineHeight: 16, color: colors.onLime }]}>{label}</Text>
      </View>
    );
  }
  const background = tone === "green" ? "#14301f" : tone === "quiet" ? colors.paperRaised : colors.blue;
  const color = tone === "green" ? colors.green : tone === "quiet" ? colors.ink : colors.onBlue;
  const isBlue = tone === "blue";
  return (
    <View style={{
      alignSelf: "flex-start",
      backgroundColor: background,
      borderRadius: radius.pill,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderWidth: 1,
      borderColor: isBlue ? "rgba(0,0,0,0.18)" : tone === "green" ? "#1f4a30" : colors.frame,
    }}>
      <Text
        allowFontScaling
        style={isBlue
          ? [onBlueType, { fontSize: 12, lineHeight: 16 }]
          : [typeScale.caption, { color, fontFamily: fonts.bodyRegular, fontWeight: "400" }]}
      >
        {label}
      </Text>
    </View>
  );
}

export function Notice({ children, tone = "paper" }: { children: string; tone?: "paper" | "danger" | "special" }) {
  if (tone === "special") {
    return (
      <View style={{
        backgroundColor: colors.lime,
        borderRadius: radius.md,
        paddingHorizontal: space.md,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.14)",
      }}>
        <Text
          allowFontScaling
          style={[typeScale.body, { color: colors.onLime, fontFamily: fonts.bodyRegular, fontWeight: "400" }]}
        >
          {children}
        </Text>
      </View>
    );
  }
  return (
    <View style={{
      backgroundColor: tone === "danger" ? colors.dangerSoft : colors.card,
      borderRadius: radius.md,
      paddingHorizontal: space.md,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: tone === "danger" ? "#6a342c" : colors.frame,
    }}>
      <T kind="body" tone={tone === "danger" ? "danger" : "muted"}>{children}</T>
    </View>
  );
}

export function ScreenState({ title, action, onPress }: { title: string; action?: string; onPress?: () => void }) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.paperDeep, padding: space.lg, justifyContent: "center", gap: space.md }}>
      <T kind="title">{title}</T>
      {action && onPress ? <Button label={action} onPress={onPress} /> : null}
    </View>
  );
}

export function factLabel(key: string): MessageKey {
  const known: Record<string, MessageKey> = {
    order: "fact.order",
    remaining: "fact.remaining",
    item: "fact.item",
    quantity: "fact.quantity",
    responses: "fact.responses",
    status: "fact.status",
    requests: "fact.requests",
    desk: "fact.desk",
  };
  return known[key] ?? "fact.status";
}
