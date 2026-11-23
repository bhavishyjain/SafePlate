import { Tabs } from "expo-router";
import { ChartNoAxesCombined, ListChecks, MoreHorizontal, Settings2 } from "lucide-react-native";
import { useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CurvedTabBar from "../../../../components/CurvedTabBar";
import BackButtonHeader from "../../../../components/BackButtonHeader";
import { useColors } from "../../../../components/ui";
import { useTranslation } from "../../../../utils/i18n/LanguageProvider";
export default function AdminTabs() {
  const {
    tr
  } = useTranslation();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    width
  } = useWindowDimensions();
  const barWidth = Math.min(Math.max(width - 24, 300), 780);
  const horizontalInset = Math.max((width - barWidth) / 2, 12);
  const icon = Icon => {
    function TabIcon({
      color
    }) {
      return <Icon color={color} size={22} />;
    }
    TabIcon.displayName = `${Icon.name}Icon`;
    return TabIcon;
  };
  return <Tabs screenOptions={{
    headerShown: true,
    header: ({ options }) => <BackButtonHeader title={options.title} hasBackButton={false} />,
    tabBarActiveTintColor: colors.primary,
    tabBarInactiveTintColor: colors.textSecondary,
    tabBarStyle: {
      position: "absolute",
      left: horizontalInset,
      right: horizontalInset,
      bottom: Math.max(insets.bottom, 12),
      height: 72,
      backgroundColor: "transparent",
      borderTopWidth: 0,
      elevation: 0
    },
    tabBarBackground: () => <CurvedTabBar colors={colors} width={barWidth} />,
    tabBarLabelStyle: {
      fontSize: 10,
      fontWeight: "700",
      marginBottom: 8
    },
    tabBarItemStyle: {
      paddingTop: 7
    }
  }}><Tabs.Screen name="dashboard" options={{
      title: tr("Dashboard"),
      headerShown: false,
      tabBarIcon: icon(ChartNoAxesCombined)
    }} /><Tabs.Screen name="operations" options={{
      title: tr("Operations"),
      tabBarIcon: icon(ListChecks)
    }} /><Tabs.Screen name="manage" options={{
      title: tr("Manage"),
      tabBarIcon: icon(Settings2)
    }} /><Tabs.Screen name="more" options={{
      title: tr("More"),
      tabBarIcon: icon(MoreHorizontal)
    }} /></Tabs>;
}
