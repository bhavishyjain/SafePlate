import { BlurView } from "expo-blur";
import { Dimensions, StyleSheet, View } from "react-native";
import { useTheme } from "../utils/context/theme";

const { width: screenWidth } = Dimensions.get("window");

export default function GlassTabBarBackground({ height = 72 }) {
  const { colorScheme } = useTheme();
  const dark = colorScheme === "dark";
  return <View style={styles.root}><View style={[styles.glass, { width: screenWidth * 0.95, height, backgroundColor: dark ? "rgba(41,41,39,0.88)" : "rgba(245,247,245,0.9)", borderColor: dark ? "rgba(255,255,255,0.12)" : "rgba(19,32,24,0.12)" }]}><BlurView intensity={45} tint={dark ? "dark" : "light"} style={StyleSheet.absoluteFill} /></View></View>;
}

const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", backgroundColor: "transparent" },
  glass: { borderRadius: 20, overflow: "hidden", borderWidth: 1 },
});
