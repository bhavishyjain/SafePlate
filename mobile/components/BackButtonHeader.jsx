import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { Text, TouchableOpacity, View } from "react-native";
import { useColors } from "./ui";

export default function BackButtonHeader({ title, hasBackButton = true }) {
  const colors = useColors();
  return <View style={{ height: 64, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, backgroundColor: colors.backgroundPrimary, borderBottomWidth: 1, borderBottomColor: colors.border }}>
    {hasBackButton ? <TouchableOpacity accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.canGoBack() ? router.back() : router.replace("/")} style={{ width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: colors.backgroundSecondary }} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}><ChevronLeft size={19} color={colors.textPrimary} /></TouchableOpacity> : <View style={{ width: 40 }} />}
    <Text numberOfLines={1} style={{ color: colors.textPrimary, fontSize: 17, fontWeight: "800", maxWidth: "70%" }}>{title}</Text>
    <View style={{ width: 40 }} />
  </View>;
}
