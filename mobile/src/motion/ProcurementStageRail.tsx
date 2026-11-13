import { View } from "react-native";
import { colors, space } from "../theme";
import { T } from "../components/ui";
import { procurementStageIndex } from "./checkpoint";
import { MotionEnter } from "./MotionEnter";
import { procurementStages, type ProcurementStage } from "./tokens";

const stageLabel: Record<ProcurementStage, string> = {
  request: "Request",
  review: "Review",
  approval: "Approval",
  "payment-guarantee": "Payment guarantee",
  fulfilment: "Fulfilment",
  delivery: "Delivery",
};

/**
 * Subtle stage strip for procurement workflow context.
 * No bounce; current stage is a calm marker only.
 */
export function ProcurementStageRail({
  stage,
  testID = "procurement-stage-rail",
}: {
  stage: ProcurementStage;
  testID?: string;
}) {
  const active = procurementStageIndex(stage);
  return (
    <MotionEnter>
      <View testID={testID} style={{ gap: space.sm }} accessibilityRole="summary">
        <View style={{ flexDirection: "row", gap: 4 }}>
          {procurementStages.map((item, index) => {
            const done = index < active;
            const current = index === active;
            return (
              <View
                key={item}
                style={{
                  flex: 1,
                  height: 3,
                  borderRadius: 2,
                  backgroundColor: done || current ? colors.blue : colors.lineSoft,
                  opacity: current ? 1 : done ? 0.7 : 1,
                }}
              />
            );
          })}
        </View>
        <T kind="caption" tone="muted">
          {stageLabel[stage]}
        </T>
      </View>
    </MotionEnter>
  );
}
