import { StyleSheet, View } from "react-native";
import Svg, { Path } from "react-native-svg";

export default function CurvedTabBar({ colors, height = 72, width, cutout = false }) {
  const cornerRadius = 20;
  const cutoutRadius = 38;
  const center = width / 2;
  const topEdge = cutout
    ? `L${center - cutoutRadius},0 A${cutoutRadius},${cutoutRadius} 0 0 0 ${center + cutoutRadius},0`
    : `L${width - cornerRadius},0`;
  const path = `
    M${cornerRadius},${height}
    Q0,${height} 0,${height - cornerRadius}
    L0,${cornerRadius}
    Q0,0 ${cornerRadius},0
    ${topEdge}
    ${cutout ? `L${width - cornerRadius},0` : ""}
    Q${width},0 ${width},${cornerRadius}
    L${width},${height - cornerRadius}
    Q${width},${height} ${width - cornerRadius},${height}
    Z
  `;

  return <View pointerEvents="none" style={[styles.container, { width, height }]}>
    <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
      <Path d={path} fill={colors.backgroundSecondary} stroke={colors.border} strokeWidth={1} />
    </Svg>
  </View>;
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    alignSelf: "center",
    shadowColor: "#000000",
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
});
