import { type ReactNode, useEffect } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { colors } from "../theme";
import { motionDuration, motionEasing } from "./tokens";
import { useReduceMotion } from "./useReduceMotion";

/**
 * Minimal validation highlight — opacity only, no shake.
 * Errors must remain immediate and accessible; this never delays the message.
 */
export function FieldHighlight({
  active,
  children,
  style,
}: {
  active: boolean;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const reduceMotion = useReduceMotion();
  const border = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    if (reduceMotion) {
      border.value = active ? 1 : 0;
      return;
    }
    border.value = withTiming(active ? 1 : 0, {
      duration: motionDuration.feedback,
      easing: Easing.bezier(
        motionEasing.standard.x1,
        motionEasing.standard.y1,
        motionEasing.standard.x2,
        motionEasing.standard.y2,
      ),
    });
  }, [active, border, reduceMotion]);

  const ring = useAnimatedStyle(() => ({
    borderColor: colors.danger,
    borderWidth: border.value > 0.5 ? 1 : 0,
    opacity: 0.85 + border.value * 0.15,
  }));

  if (reduceMotion) {
    return (
      <View
        style={[
          style,
          active ? { borderColor: colors.danger, borderWidth: 1, borderRadius: 8 } : null,
        ]}
      >
        {children}
      </View>
    );
  }

  return <Animated.View style={[style, { borderRadius: 8 }, ring]}>{children}</Animated.View>;
}
