import { type ReactNode } from "react";
import { Image, Pressable, Text, TextInput, View, type TextInputProps, type ViewStyle } from "react-native";
import { useLocale } from "../i18n";
import { bluePanStyle, colors, fonts, onBlueType, panStyle, pillCtaStyle, radius, space, type as typeScale } from "../theme";
import type { MessageKey } from "../i18n/messages";

const wordmark = require("../../assets/hovin-wordmark.png");

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

export function Pan({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[panStyle, style]}>{children}</View>;
}

/** Light-blue action pan — bottom frame edge, regular black type for children via caller. */
export function BluePan({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return (
    <View style={[bluePanStyle, style]}>
      {children}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 4,
          backgroundColor: colors.blueEdge,
          borderBottomLeftRadius: radius.lg,
          borderBottomRightRadius: radius.lg,
        }}
      />
    </View>
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
  const color = tone === "chrome" ? colors.chromeText
    : tone === "muted" ? colors.muted
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

function ctaFill(tone: "blue" | "chrome" | "quiet" | "inset") {
  if (tone === "chrome") return { backgroundColor: colors.paperRaised, borderBottomWidth: 0 };
  if (tone === "quiet") {
    return {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.line,
      borderBottomWidth: 1,
      borderBottomColor: colors.line,
    };
  }
  if (tone === "inset") {
    return {
      backgroundColor: "rgba(0,0,0,0.14)",
      borderBottomWidth: 3,
      borderBottomColor: colors.blueEdge,
    };
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
  tone?: "blue" | "chrome" | "quiet" | "inset";
  disabled?: boolean;
  testID?: string;
}) {
  const blackType = tone === "blue" || tone === "inset";
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
        opacity: disabled ? 0.45 : pressed ? 0.82 : 1,
        transform: [{ scale: pressed && !disabled ? 0.985 : 1 }],
      })}
    >
      <Text
        allowFontScaling
        style={blackType
          ? onBlueType
          : [typeScale.body, { color: colors.ink, fontFamily: fonts.bodyRegular, fontWeight: "400" }]}
      >
        {label}
      </Text>
      {blackType ? (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 4,
            backgroundColor: colors.blueEdge,
          }}
        />
      ) : null}
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
          minHeight: 54,
          borderWidth: 1,
          borderColor: colors.lineSoft,
          borderRadius: radius.md,
          backgroundColor: colors.card,
          color: colors.ink,
          paddingHorizontal: space.md,
          fontSize: 16,
          fontFamily: fonts.bodyMedium,
          textAlign: isRtl ? "right" : "left",
          writingDirection: isRtl ? "rtl" : "ltr",
        }}
      />
    </View>
  );
}

export function Group({ children }: { children: ReactNode }) {
  return (
    <View style={[panStyle, { padding: 0, overflow: "hidden" }]}>
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
      minHeight: 64,
      paddingHorizontal: space.md,
      paddingVertical: space.md,
      borderBottomWidth: hairline ? 1 : 0,
      borderBottomColor: colors.lineSoft,
      flexDirection: isRtl ? "row-reverse" : "row",
      alignItems: "center",
      gap: space.md,
    }}>
      <View style={{ flex: 1, gap: 3 }}>
        <T kind="headline">{title}</T>
        {detail ? <T kind="body" tone="muted">{detail}</T> : null}
      </View>
      {onPress ? <Text style={{ color: colors.muted, fontSize: 22, fontFamily: fonts.medium }}>{isRtl ? "‹" : "›"}</Text> : null}
    </View>
  );
  if (!onPress) return body;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} testID={testID} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
      {body}
    </Pressable>
  );
}

export function Status({ label, tone }: { label: string; tone: "blue" | "green" | "quiet" }) {
  const background = tone === "green" ? "#14301f" : tone === "quiet" ? colors.paperRaised : colors.blue;
  const color = tone === "green" ? colors.green : tone === "quiet" ? colors.ink : colors.onBlue;
  const isBlue = tone === "blue";
  return (
    <View style={{
      alignSelf: "flex-start",
      backgroundColor: background,
      borderRadius: radius.pill,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderWidth: tone === "quiet" || tone === "green" ? 1 : 0,
      borderColor: tone === "green" ? "#1f4a30" : tone === "quiet" ? colors.lineSoft : "transparent",
      borderBottomWidth: isBlue ? 3 : tone === "quiet" || tone === "green" ? 1 : 0,
      borderBottomColor: isBlue ? colors.blueEdge : tone === "green" ? "#1f4a30" : colors.lineSoft,
    }}>
      <Text
        allowFontScaling
        style={isBlue
          ? [onBlueType, { fontSize: 12, lineHeight: 16 }]
          : [typeScale.caption, { color, letterSpacing: 0.4, fontFamily: fonts.bodyRegular, fontWeight: undefined }]}
      >
        {label}
      </Text>
    </View>
  );
}

export function Notice({ children, tone = "paper" }: { children: string; tone?: "paper" | "danger" }) {
  return (
    <View style={{
      backgroundColor: tone === "danger" ? colors.dangerSoft : colors.paperRaised,
      borderRadius: radius.md,
      paddingHorizontal: space.md,
      paddingVertical: 14,
      borderWidth: 1,
      borderColor: tone === "danger" ? "#6a342c" : colors.lineSoft,
    }}>
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
