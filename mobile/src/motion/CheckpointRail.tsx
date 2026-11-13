import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import type { PhoneCheckpoint } from "../api/hovin";
import { useLocale } from "../i18n";
import type { MessageKey } from "../i18n/messages";
import { colors, space } from "../theme";
import { T } from "../components/ui";
import { checkpointProgress, checkpointVisualState } from "./checkpoint";
import { motionDuration, motionEasing, type CheckpointVisualState } from "./tokens";
import { useReduceMotion } from "./useReduceMotion";

function markerColor(state: CheckpointVisualState): string {
  if (state === "done") return colors.green;
  if (state === "current") return colors.blue;
  if (state === "delayed") return colors.lime;
  if (state === "exception") return colors.danger;
  return colors.line;
}

function labelTone(state: CheckpointVisualState): "ink" | "muted" {
  return state === "waiting" ? "muted" : "ink";
}

function bezier(easing: { x1: number; y1: number; x2: number; y2: number }) {
  return Easing.bezier(easing.x1, easing.y1, easing.x2, easing.y2);
}

/**
 * Delivery status rail: Confirmed → Preparing → Picked up → In transit → Delivered.
 * Progress only between known checkpoints. No fabricated live GPS motion.
 */
export function CheckpointRail({
  checkpoints,
  orderStatus,
  testID = "checkpoint-rail",
}: {
  checkpoints: PhoneCheckpoint[];
  orderStatus?: string | null;
  testID?: string;
}) {
  const { t } = useLocale();
  const reduceMotion = useReduceMotion();
  const progress = checkpointProgress(checkpoints);
  const fill = useSharedValue(reduceMotion ? progress : 0);

  useEffect(() => {
    if (reduceMotion) {
      fill.value = progress;
      return;
    }
    fill.value = withTiming(progress, {
      duration: motionDuration.progress,
      easing: bezier(motionEasing.progress),
    });
  }, [fill, progress, reduceMotion]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${Math.max(0, Math.min(1, fill.value)) * 100}%`,
  }));

  return (
    <View testID={testID} style={{ gap: space.md }} accessibilityRole="summary">
      <View
        style={{
          height: 3,
          borderRadius: 2,
          backgroundColor: colors.lineSoft,
          overflow: "hidden",
        }}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <Animated.View
          style={[
            {
              height: "100%",
              borderRadius: 2,
              backgroundColor: colors.blue,
            },
            fillStyle,
          ]}
        />
      </View>
      <View style={{ gap: 10 }}>
        {checkpoints.map((step) => {
          const visual = checkpointVisualState(step, orderStatus);
          const when = step.at
            ? step.at.slice(0, 16).replace("T", " ")
            : t(`checkpoint.${step.state}` as MessageKey);
          return (
            <View
              key={step.key}
              style={{ flexDirection: "row", alignItems: "center", gap: space.md }}
              accessibilityLabel={`${t(`checkpoint.${step.key}` as MessageKey)}, ${when}, ${visual}`}
            >
              <View
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: markerColor(visual),
                  borderWidth: visual === "waiting" ? 1 : 0,
                  borderColor: colors.line,
                }}
              />
              <View style={{ flex: 1, gap: 2 }}>
                <T kind="label" tone={labelTone(visual)}>
                  {t(`checkpoint.${step.key}` as MessageKey)}
                </T>
                <T kind="caption" tone="muted">
                  {when}
                </T>
              </View>
              {visual === "delayed" ? <T kind="caption" tone="muted">{t("checkpoint.delayed")}</T> : null}
              {visual === "exception" ? <T kind="caption" tone="muted">{t("checkpoint.exception")}</T> : null}
            </View>
          );
        })}
      </View>
    </View>
  );
}
