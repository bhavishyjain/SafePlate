import { Tabs } from "expo-router";
import { ChartNoAxesCombined, ListChecks, MoreHorizontal, Settings2 } from "lucide-react-native";
import GlassTabBarBackground from "../../../../components/GlassTabBarBackground";
import { useColors } from "../../../../components/ui";

export default function AdminTabs() {
  const colors = useColors();
  const icon = (Icon) => { function TabIcon({ color }) { return <Icon color={color} size={22} />; } TabIcon.displayName = `${Icon.name}Icon`; return TabIcon; };
  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.primary, tabBarInactiveTintColor: colors.textSecondary, tabBarStyle: { position: "absolute", left: "5%", right: "5%", bottom: 16, height: 72, borderRadius: 20, backgroundColor: "transparent", borderTopWidth: 0, elevation: 0 }, tabBarBackground: () => <GlassTabBarBackground height={72} paddingHorizontal={18} />, tabBarLabelStyle: { fontSize: 10, fontWeight: "700", marginBottom: 8 } }}><Tabs.Screen name="dashboard" options={{ title: "Dashboard", tabBarIcon: icon(ChartNoAxesCombined) }} /><Tabs.Screen name="operations" options={{ title: "Operations", tabBarIcon: icon(ListChecks) }} /><Tabs.Screen name="manage" options={{ title: "Manage", tabBarIcon: icon(Settings2) }} /><Tabs.Screen name="more" options={{ title: "More", tabBarIcon: icon(MoreHorizontal) }} /></Tabs>;
}
