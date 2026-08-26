import { Tabs } from "expo-router";
import { Home, MoreHorizontal } from "lucide-react-native";
import { View } from "react-native";
import { darkColors, lightColors } from "../../../colors";
import GlassTabBarBackground from "../../../components/GlassTabBarBackground";
import { useTheme } from "../../../utils/context/theme";
import { useTranslation } from "../../../utils/i18n/LanguageProvider";

function TabIcon({ Icon, color, focused }) {
  return (
    <View
      style={{
        width: 44,
        height: 44,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Icon color={color} size={22} />
    </View>
  );
}

export function TabsInner() {
  const { t } = useTranslation();
  const { colorScheme } = useTheme();
  const colors = colorScheme === "dark" ? darkColors : lightColors;
  const TAB_HEIGHT = 72;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          position: "absolute",
          left: "5%",
          right: "5%",
          bottom: 16,
          height: TAB_HEIGHT,
          borderRadius: 20,
          backgroundColor: "transparent",
          borderTopWidth: 0,
          borderBottomWidth: 0,
          elevation: 0,
          paddingBottom: 0,
          paddingTop: 0,
          paddingHorizontal: 0,
        },
        tabBarContentContainerStyle: {
          backgroundColor: "transparent",
          paddingHorizontal: 18,
        },
        tabBarBackground: () => (
          <GlassTabBarBackground height={TAB_HEIGHT} paddingHorizontal={18} />
        ),
        tabBarItemStyle: {
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
        },
        tabBarIconStyle: {
          marginTop: 7,
        },
        tabBarLabelStyle: {
          marginTop: 0,
          fontSize: 10,
          fontWeight: "700",
          backgroundColor: "transparent",
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: t("tabs.home", { defaultValue: "Home" }),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              Icon={Home}
              color={color}
              focused={focused}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="more"
        options={{
          title: t("tabs.more", { defaultValue: "More" }),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              Icon={MoreHorizontal}
              color={color}
              focused={focused}
            />
          ),
        }}
      />
    </Tabs>
  );
}

export default function TabsLayout() {
  return <TabsInner />;
}
