import { Tabs } from "expo-router";
import { ChartNoAxesCombined, HandHeart, Home, ListChecks, Settings } from "lucide-react-native";
import { View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "../../../../components/ui";
import CurvedTabBar from "../../../../components/CurvedTabBar";
import BackButtonHeader from "../../../../components/BackButtonHeader";
import { useTranslation } from "../../../../utils/i18n/LanguageProvider";
function TabIcon({
  Icon,
  color
}) {
  return <View style={{
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center"
  }}>
      <Icon color={color} size={22} />
    </View>;
}
export default function DonorTabs() {
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
  const bottom = Math.max(insets.bottom, 12);
  const icon = Icon => {
    function NavigationIcon({
      color
    }) {
      return <TabIcon Icon={Icon} color={color} />;
    }
    NavigationIcon.displayName = `${Icon.displayName || Icon.name || "Tab"}Icon`;
    return NavigationIcon;
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
      bottom,
      height: 72,
      backgroundColor: "transparent",
      borderTopWidth: 0,
      elevation: 0
    },
    tabBarBackground: () => <CurvedTabBar colors={colors} width={barWidth} cutout />,
    tabBarLabelStyle: {
      fontSize: 10,
      fontWeight: "700",
      marginBottom: 7
    },
    tabBarItemStyle: {
      paddingTop: 5
    }
  }}>
      <Tabs.Screen name="home" options={{
      title: tr("Home"),
      headerShown: false,
      tabBarIcon: icon(Home)
    }} />
      <Tabs.Screen name="donations" options={{
      title: tr("Donations"),
      tabBarIcon: icon(ListChecks)
    }} />
      <Tabs.Screen name="donate" options={{
      title: tr("Donate"),
      tabBarAccessibilityLabel: tr("Donate food"),
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
      }}>
              <HandHeart color={colors.onPrimary} size={27} strokeWidth={2.5} />
            </View>
    }} />
      <Tabs.Screen name="impact" options={{
      title: tr("Impact"),
      tabBarIcon: icon(ChartNoAxesCombined)
    }} />
      <Tabs.Screen name="more" options={{
      title: tr("More"),
      tabBarIcon: icon(Settings)
    }} />
    </Tabs>;
}
