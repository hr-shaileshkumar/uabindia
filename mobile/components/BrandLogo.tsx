// components/BrandLogo.tsx – Executive Brand Emblem & Wordmark for Uabindia HRMS
import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "../constants/theme";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg" | "hero";
  variant?: "dark" | "light";
  showWordmark?: boolean;
  showSubtitle?: boolean;
}

export default function BrandLogo({
  size = "md",
  variant = "dark",
  showWordmark = true,
  showSubtitle = true,
}: BrandLogoProps) {
  const isLight = variant === "light";

  const dimensions = {
    sm:   { box: 36, radius: 10, fontSize: 16, brandSize: 17, subSize: 9,  gap: 8 },
    md:   { box: 52, radius: 15, fontSize: 22, brandSize: 22, subSize: 11, gap: 12 },
    lg:   { box: 74, radius: 22, fontSize: 32, brandSize: 28, subSize: 13, gap: 16 },
    hero: { box: 92, radius: 28, fontSize: 40, brandSize: 34, subSize: 14, gap: 20 },
  }[size];

  return (
    <View style={[styles.container, size === "lg" || size === "hero" ? styles.vertical : styles.horizontal]}>
      {/* Outer Glow / Glass Frame */}
      <View
        style={[
          styles.emblemOuter,
          {
            width: dimensions.box + 6,
            height: dimensions.box + 6,
            borderRadius: dimensions.radius + 3,
            backgroundColor: isLight ? "rgba(15, 82, 186, 0.08)" : "rgba(255, 255, 255, 0.07)",
          },
        ]}
      >
        <LinearGradient
          colors={["#1E40AF", "#0F52BA", "#0284C7"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.emblemCore,
            {
              width: dimensions.box,
              height: dimensions.box,
              borderRadius: dimensions.radius,
            },
          ]}
        >
          {/* Subtle Top-left Specular Sheen */}
          <View
            style={[
              styles.specularSheen,
              {
                width: dimensions.box * 0.7,
                height: dimensions.box * 0.45,
                borderTopLeftRadius: dimensions.radius - 2,
              },
            ]}
          />

          {/* Monogram UA */}
          <View style={styles.monogramWrap}>
            <Text
              style={[
                styles.monogramText,
                { fontSize: dimensions.fontSize, letterSpacing: -0.5 },
              ]}
            >
              UA
            </Text>
          </View>

          {/* Micro Corner Accent Dot */}
          <View style={styles.accentDot} />
        </LinearGradient>
      </View>

      {/* Wordmark & Hierarchy */}
      {showWordmark && (
        <View style={[styles.textCol, { marginLeft: size === "sm" || size === "md" ? dimensions.gap : 0, marginTop: size === "lg" || size === "hero" ? dimensions.gap : 0 }]}>
          <View style={styles.brandRow}>
            <Text
              style={[
                styles.brandTitle,
                {
                  fontSize: dimensions.brandSize,
                  color: isLight ? COLORS.textPrimary : "#FFFFFF",
                },
              ]}
            >
              Uab<Text style={{ color: "#38BDF8" }}>india</Text>
            </Text>
            <View style={styles.badgePill}>
              <Text style={styles.badgeText}>HRMS</Text>
            </View>
          </View>
          {showSubtitle && (
            <Text
              style={[
                styles.brandSub,
                {
                  fontSize: dimensions.subSize,
                  color: isLight ? COLORS.textSecondary : "rgba(255,255,255,0.65)",
                },
              ]}
            >
              ENTERPRISE WORKFORCE CLOUD
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  horizontal: {
    flexDirection: "row",
  },
  vertical: {
    flexDirection: "column",
    alignItems: "center",
  },
  emblemOuter: {
    justifyContent: "center",
    alignItems: "center",
    padding: 3,
  },
  emblemCore: {
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    ...(Platform.OS === "web"
      ? { boxShadow: "0 6px 14px rgba(2, 132, 199, 0.4)" } as any
      : {
          shadowColor: "#0284C7",
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.4,
          shadowRadius: 10,
          elevation: 8,
        }),
  },
  specularSheen: {
    position: "absolute",
    top: 0,
    left: 0,
    backgroundColor: "rgba(255, 255, 255, 0.22)",
    borderBottomRightRadius: 20,
  },
  monogramWrap: {
    justifyContent: "center",
    alignItems: "center",
  },
  monogramText: {
    color: "#FFFFFF",
    fontWeight: "900",
    includeFontPadding: false,
    ...(Platform.OS === "web"
      ? { textShadow: "0 1px 3px rgba(0, 0, 0, 0.35)" } as any
      : {
          textShadowColor: "rgba(0, 0, 0, 0.35)",
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 3,
        }),
  },
  accentDot: {
    position: "absolute",
    bottom: 5,
    right: 5,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#38BDF8",
  },
  textCol: {
    justifyContent: "center",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  brandTitle: {
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  badgePill: {
    backgroundColor: "rgba(56, 189, 248, 0.16)",
    borderColor: "rgba(56, 189, 248, 0.35)",
    borderWidth: 1,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    marginLeft: 6,
  },
  badgeText: {
    color: "#38BDF8",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  brandSub: {
    fontWeight: "700",
    letterSpacing: 1.2,
    marginTop: 2,
    textTransform: "uppercase",
  },
});
