import { type ReactNode } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, paperFade } from "../theme";

/** Darker-grey fading field behind phone screens. */
export function FieldShade({
  children,
  style,
  testID,
}: {
  children: ReactNode;
  style?: ViewStyle;
  testID?: string;
}) {
  return (
    <View testID={testID} style={[{ flex: 1, backgroundColor: colors.paperDeep }, style]}>
      <LinearGradient
        colors={[...paperFade]}
        locations={[0, 0.22, 0.5, 0.78, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />
      <LinearGradient
        colors={["rgba(15,16,17,0.72)", "rgba(48,50,52,0)", "rgba(18,19,20,0.58)"]}
        locations={[0, 0.48, 1]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />
      {children}
    </View>
  );
}
