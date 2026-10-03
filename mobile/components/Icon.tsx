// components/Icon.tsx – Unified Professional Vector Icon Component with Luxury Badge Support
import React from "react";
import { View, StyleSheet, StyleProp, ViewStyle } from "react-native";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { COLORS, RADIUS } from "../constants/theme";

export type IconFamily = "ionicons" | "mci" | "feather";

export interface IconProps {
  name: string;
  family?: IconFamily;
  size?: number;
  color?: string;
  badge?: boolean;
  badgeBg?: string;
  badgeBorder?: string;
  badgeSize?: number;
  badgeRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export default function Icon({
  name,
  family = "ionicons",
  size = 20,
  color = COLORS.primary,
  badge = false,
  badgeBg,
  badgeBorder,
  badgeSize,
  badgeRadius,
  style,
}: IconProps) {
  let IconComponent: any = Ionicons;
  if (family === "mci") IconComponent = MaterialCommunityIcons;
  else if (family === "feather") IconComponent = Feather;

  const iconElement = <IconComponent name={name as any} size={size} color={color} />;

  if (!badge) {
    return <View style={style}>{iconElement}</View>;
  }

  const containerSize = badgeSize ?? size + 16;
  const containerRadius = badgeRadius ?? RADIUS.md;

  return (
    <View
      style={[
        styles.badge,
        {
          width: containerSize,
          height: containerSize,
          borderRadius: containerRadius,
          backgroundColor: badgeBg ?? `${color}15`,
          borderColor: badgeBorder ?? `${color}30`,
          borderWidth: badgeBorder ? 1 : 0.5,
        },
        style,
      ]}
    >
      {iconElement}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    justifyContent: "center",
    alignItems: "center",
  },
});
