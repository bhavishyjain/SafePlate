import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Dimensions, StyleSheet, View } from "react-native";
import { useTheme } from "../utils/context/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function GlassTabBarBackground({
  height = 72,
  paddingHorizontal = 16,
}) {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === "dark";

  return (
    <View style={styles.root}>
      <View
        style={[
          styles.glass,
          {
            width: SCREEN_WIDTH * 0.95,
            height,
            paddingHorizontal,
            backgroundColor: isDark
              ? "rgba(20, 20, 20, 0.7)"
              : "rgba(248, 248, 248, 0.7)",
            borderColor: isDark
              ? "rgba(255,255,255,0.15)"
              : "rgba(255,255,255,0.5)",
          },
        ]}
      >
        <BlurView
          intensity={60}
          tint={isDark ? "dark" : "light"}
          style={StyleSheet.absoluteFill}
        />

        {/* Main gradient for depth */}
        <LinearGradient
          colors={
            isDark
              ? [
                  "rgba(40,40,40,0.4)",
                  "rgba(25,25,25,0.3)",
                  "rgba(15,15,15,0.25)",
                ]
              : [
                  "rgba(255,255,255,0.5)",
                  "rgba(245,245,245,0.3)",
                  "rgba(235,235,235,0.2)",
                ]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Glossy top highlight */}
        <LinearGradient
          colors={
            isDark
              ? [
                  "rgba(255,255,255,0.15)",
                  "rgba(255,255,255,0.05)",
                  "transparent",
                ]
              : [
                  "rgba(255,255,255,0.8)",
                  "rgba(255,255,255,0.3)",
                  "transparent",
                ]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "50%",
          }}
        />

        {/* Subtle bottom gradient for depth */}
        <LinearGradient
          colors={
            isDark
              ? ["transparent", "rgba(0,0,0,0.2)"]
              : ["transparent", "rgba(0,0,0,0.05)"]
          }
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "30%",
          }}
        />

        {/* Top edge highlight line */}
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 1.5,
            backgroundColor: isDark
              ? "rgba(255,255,255,0.25)"
              : "rgba(255,255,255,0.9)",
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  glass: {
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1.5,
  },
});
