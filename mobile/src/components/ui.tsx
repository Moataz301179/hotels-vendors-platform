import { type ReactNode } from "react";
import { Image, Platform, Pressable, Text, TextInput, View, type TextInputProps, type ViewStyle } from "react-native";
import { useLocale } from "../i18n";
import { colors, radius, space, type as typeScale } from "../theme";
import type { MessageKey } from "../i18n/messages";

const wordmark = require("../../assets/hovin-wordmark.png");

export function Wordmark({ width = 132 }: { width?: number }) {
  return (
    <Image
      source={wordmark}
      accessibilityLabel="HOVIN"
      resizeMode="contain"
      style={{ width, height: width * (49 / 132), backgroundColor: colors.chrome }}
    />
  );
}

export function T({
  kind = "body",
  tone = "ink",
  children,
  style,
}: {
  kind?: keyof typeof typeScale;
  tone?: "ink" | "muted" | "chrome" | "blue" | "danger" | "yellow";
  children: string;
  style?: ViewStyle | object;
}) {
  const { isRtl } = useLocale();
  const color = tone === "chrome" ? colors.chromeText
    : tone === "muted" ? colors.muted
      : tone === "blue" ? colors.blueBright
        : tone === "yellow" ? colors.yellow
          : tone === "danger" ? colors.danger
            : colors.ink;
  return (
    <Text
      allowFontScaling
      style={[typeScale[kind], { color, writingDirection: isRtl ? "rtl" : "ltr", textAlign: "auto" }, style]}
    >
      {children}
    </Text>
  );
}

function ctaFill(tone: "blue" | "chrome" | "quiet" | "yellow") {
  if (tone === "yellow") return { backgroundColor: colors.yellow };
  if (tone === "chrome") return { backgroundColor: colors.card };
  if (tone === "quiet") return { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line };
  // Electric blue CTA — horizontal gradient on web (matches reference), solid on native.
  if (Platform.OS === "web") {
    return {
      backgroundColor: colors.blue,
      backgroundImage: `linear-gradient(90deg, ${colors.blueBright} 0%, ${colors.blueStrong} 100%)`,
    } as ViewStyle;
  }
  return { backgroundColor: colors.blue };
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
  tone?: "blue" | "chrome" | "quiet" | "yellow";
  disabled?: boolean;
  testID?: string;
}) {
  const color = tone === "yellow" ? colors.chrome : colors.ink;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => ({
        minHeight: 52,
        paddingHorizontal: space.lg,
        borderRadius: radius.pill,
        alignItems: "center",
        justifyContent: "center",
        ...ctaFill(tone),
        opacity: disabled ? 0.45 : pressed ? 0.78 : 1,
      })}
    >
      <Text allowFontScaling style={[typeScale.headline, { color, letterSpacing: 0.2 }]}>{label}</Text>
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
          borderWidth: 0,
          borderRadius: radius.md,
          backgroundColor: colors.card,
          color: colors.ink,
          paddingHorizontal: space.md,
          fontSize: 16,
          fontWeight: "500",
          textAlign: isRtl ? "right" : "left",
          writingDirection: isRtl ? "rtl" : "ltr",
        }}
      />
    </View>
  );
}

export function Group({ children }: { children: ReactNode }) {
  return (
    <View style={{ backgroundColor: colors.card, borderRadius: radius.lg, overflow: "hidden" }}>
      {children}
    </View>
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
  const body = (
    <View style={{
      minHeight: 60,
      paddingHorizontal: space.md,
      paddingVertical: space.md,
      borderBottomWidth: hairline ? 1 : 0,
      borderBottomColor: colors.lineSoft,
      flexDirection: isRtl ? "row-reverse" : "row",
      alignItems: "center",
      gap: space.md,
    }}>
      <View style={{ flex: 1, gap: 2 }}>
        <T kind="headline">{title}</T>
        {detail ? <T kind="body" tone="muted">{detail}</T> : null}
      </View>
      {onPress ? <Text style={{ color: colors.muted, fontSize: 22 }}>{isRtl ? "‹" : "›"}</Text> : null}
    </View>
  );
  if (!onPress) return body;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} testID={testID} style={({ pressed }) => ({ opacity: pressed ? 0.65 : 1 })}>
      {body}
    </Pressable>
  );
}

export function Status({ label, tone }: { label: string; tone: "blue" | "amber" | "green" | "yellow" }) {
  const background = tone === "green" ? "#14301f" : tone === "amber" || tone === "yellow" ? colors.yellowSoft : colors.iceWash;
  const color = tone === "green" ? colors.green : tone === "amber" || tone === "yellow" ? colors.yellow : colors.blueBright;
  return (
    <View style={{ alignSelf: "flex-start", backgroundColor: background, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 5 }}>
      <Text allowFontScaling style={[typeScale.caption, { color }]}>{label}</Text>
    </View>
  );
}

export function Notice({ children, tone = "paper" }: { children: string; tone?: "paper" | "danger" }) {
  return (
    <View style={{ backgroundColor: tone === "danger" ? colors.dangerSoft : colors.paperRaised, borderRadius: radius.md, padding: space.md }}>
      <T kind="body" tone={tone === "danger" ? "danger" : "muted"}>{children}</T>
    </View>
  );
}

export function ScreenState({ title, action, onPress }: { title: string; action?: string; onPress?: () => void }) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.paper, padding: space.lg, justifyContent: "center", gap: space.md }}>
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
