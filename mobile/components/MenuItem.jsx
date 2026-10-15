import { cloneElement } from "react";
import { Text, View } from "react-native";
import PressableBlock from "./PressableBlock";
import { useColors } from "./ui";

export default function MenuItem({ icon, title, subtitle, onPress, danger }) {
  const colors = useColors();
  const iconColor = danger ? colors.danger : colors.textPrimary;
  return <PressableBlock onPress={onPress} style={{ flexDirection: "row", alignItems: "center", backgroundColor: colors.backgroundSecondary, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 16, marginBottom: 12 }} activeOpacity={0.8}>
    <View style={{ width: 28, height: 28, alignItems: "center", justifyContent: "center" }}>{icon && cloneElement(icon, { ...icon.props, color: iconColor, size: 20 })}</View>
    <View style={{ marginLeft: 14, flex: 1 }}><Text style={{ color: danger ? colors.danger : colors.textPrimary, fontSize: 15, fontWeight: "700" }}>{title}</Text><Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 18, marginTop: 2 }} numberOfLines={2}>{subtitle}</Text></View>
  </PressableBlock>;
}
