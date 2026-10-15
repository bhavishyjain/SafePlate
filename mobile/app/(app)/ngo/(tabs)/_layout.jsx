import { Tabs } from "expo-router";
import { Building2, ClipboardList, Home, MoreHorizontal } from "lucide-react-native";
import { useColors } from "../../../../components/ui";
import GlassTabBarBackground from "../../../../components/GlassTabBarBackground";

export default function NgoTabs() {
  const colors = useColors();
  const icon = (Icon) => {
    function TabIcon({ color }) { return <Icon color={color} size={22} />; }
    TabIcon.displayName = `${Icon.displayName || Icon.name || "Tab"}Icon`;
    return TabIcon;
  };
  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.primary, tabBarInactiveTintColor: colors.textSecondary, tabBarStyle: { position: "absolute", bottom: 16, height: 72, backgroundColor: "transparent", borderTopWidth: 0, elevation: 0 }, tabBarBackground: () => <GlassTabBarBackground />, tabBarLabelStyle: { fontSize: 10, fontWeight: "700", marginBottom: 8 }, tabBarItemStyle: { paddingTop: 7 } }}><Tabs.Screen name="home" options={{ title: "Home", tabBarIcon: icon(Home) }} /><Tabs.Screen name="assignments" options={{ title: "Assignments", tabBarIcon: icon(ClipboardList) }} /><Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: icon(Building2) }} /><Tabs.Screen name="more" options={{ title: "More", tabBarIcon: icon(MoreHorizontal) }} /></Tabs>;
}
