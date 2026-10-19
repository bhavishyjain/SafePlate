import { Tabs } from "expo-router";
import { Building2, ClipboardList, HeartPulse, Home, Settings } from "lucide-react-native";
import { View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CurvedTabBar from "../../../../components/CurvedTabBar";
import BackButtonHeader from "../../../../components/BackButtonHeader";
import { useColors } from "../../../../components/ui";
import { useTranslation } from "../../../../utils/i18n/LanguageProvider";
export default function NgoTabs() {
  const {
    tr
  } = useTranslation();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    width
  } = useWindowDimensions();
  const barWidth = Math.min(Math.max(width - 24, 300), 780);
  const icon = Icon => {
    function TabIcon({
      color
    }) {
      return <Icon color={color} size={22} />;
    }
    TabIcon.displayName = `${Icon.displayName || Icon.name || "Tab"}Icon`;
    return TabIcon;
  };
  return <Tabs screenOptions={{
    headerShown: true,
    header: ({ options }) => <BackButtonHeader title={options.title} hasBackButton={false} />,
    tabBarActiveTintColor: colors.primary,
    tabBarInactiveTintColor: colors.textSecondary,
    tabBarStyle: {
      position: "absolute",
      left: width / 2,
      transform: [{
        translateX: -barWidth / 2
      }],
      bottom: Math.max(insets.bottom, 12),
      width: barWidth,
      height: 72,
      backgroundColor: "transparent",
      borderTopWidth: 0,
      elevation: 0
    },
    tabBarBackground: () => <CurvedTabBar colors={colors} width={barWidth} cutout />,
    tabBarLabelStyle: {
      fontSize: 10,
      fontWeight: "700",
      marginBottom: 8
    },
    tabBarItemStyle: {
      paddingTop: 7
    }
  }}>
    <Tabs.Screen name="home" options={{
      title: tr("Home"),
      headerShown: false,
      tabBarIcon: icon(Home)
    }} />
    <Tabs.Screen name="assignments" options={{
      title: tr("Assignments"),
      tabBarIcon: icon(ClipboardList)
    }} />
    <Tabs.Screen name="nutrition" options={{
      title: tr("Nutrition"),
      tabBarAccessibilityLabel: tr("Nutrition"),
      tabBarLabel: () => null,
      tabBarIcon: () => <View style={{
        position: "absolute",
        top: -37,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: colors.primary,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 5,
        borderColor: colors.backgroundPrimary
      }}><HeartPulse color={colors.onPrimary} size={27} strokeWidth={2.5} /></View>
    }} />
    <Tabs.Screen name="profile" options={{
      title: tr("Profile"),
      tabBarIcon: icon(Building2)
    }} />
    <Tabs.Screen name="more" options={{
      title: tr("More"),
      tabBarIcon: icon(Settings)
    }} />
  </Tabs>;
}
