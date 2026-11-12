import { Vibration } from "react-native";

/** Confirmation pulse. Visual state still stands if the device has no vibrator. */
export function confirmPulse() {
  Vibration.vibrate(20);
}
