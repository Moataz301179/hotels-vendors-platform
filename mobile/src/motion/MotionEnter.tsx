import { type ReactNode } from "react";
import Animated, { Easing, FadeOut, Keyframe } from "react-native-reanimated";
import { staggerDelayMs } from "./checkpoint";
import { motionDistance, motionDuration, motionEasing, motionStagger } from "./tokens";
import { useReduceMotion } from "./useReduceMotion";

type Props = {
  children: ReactNode;
  /** Stagger index for list rows; capped by motionStagger.maxItems */
  index?: number;
  /** When false, render children without motion (e.g. dense tables). */
  enabled?: boolean;
  testID?: string;
};

function bezier(easing: { x1: number; y1: number; x2: number; y2: number }) {
  return Easing.bezier(easing.x1, easing.y1, easing.x2, easing.y2);
}

/**
 * Subtle enter: fade + 6–12px rise, ≤280ms. Disabled under reduce-motion.
 * Do not wrap critical confirmations, errors, or approval decisions.
 */
export function MotionEnter({ children, index = 0, enabled = true, testID }: Props) {
  const reduceMotion = useReduceMotion();
  if (!enabled || reduceMotion) {
    return <>{children}</>;
  }

  const delay = staggerDelayMs(index, motionStagger.stepMs, motionStagger.maxItems);
  const entering = new Keyframe({
    0: {
      opacity: 0,
      transform: [{ translateY: motionDistance.enterY }],
    },
    100: {
      opacity: 1,
      transform: [{ translateY: 0 }],
      easing: bezier(motionEasing.enter),
    },
  }).duration(motionDuration.enter).delay(delay);

  return (
    <Animated.View
      testID={testID}
      entering={entering}
      exiting={FadeOut.duration(motionDuration.feedback).easing(bezier(motionEasing.standard))}
    >
      {children}
    </Animated.View>
  );
}
