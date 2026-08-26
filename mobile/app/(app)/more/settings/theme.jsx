import { Moon, Settings, Sun } from "lucide-react-native";
import { Text, View } from "react-native";
import { darkColors, lightColors } from "../../../../colors";
import BackButtonHeader from "../../../../components/BackButtonHeader";
import PressableBlock from "../../../../components/PressableBlock";
import { useTheme } from "../../../../utils/context/theme";
import { useTranslation } from "../../../../utils/i18n/LanguageProvider";

export default function ThemeSettings() {
  const { t } = useTranslation();
  const { colorScheme, setColorScheme, themePreference } = useTheme();
  const colors = colorScheme === "dark" ? darkColors : lightColors;

  const themes = [
    {
      id: "system",
      name: t("more.settings.theme.system"),
      description: t("more.settings.theme.systemDesc"),
      icon: (
        <Settings
          size={32}
          color={
            themePreference === "system" ? colors.primary : colors.textSecondary
          }
        />
      ),
    },
    {
      id: "light",
      name: t("more.settings.theme.light"),
      description: t("more.settings.theme.lightDesc"),
      icon: (
        <Sun
          size={32}
          color={
            themePreference === "light" ? colors.primary : colors.textSecondary
          }
        />
      ),
    },
    {
      id: "dark",
      name: t("more.settings.theme.dark"),
      description: t("more.settings.theme.darkDesc"),
      icon: (
        <Moon
          size={32}
          color={
            themePreference === "dark" ? colors.primary : colors.textSecondary
          }
        />
      ),
    },
  ];

  const currentTheme = themes.find((t) => t.id === themePreference);

  return (
    <View
      className="flex-1"
      style={{ backgroundColor: colors.backgroundPrimary }}
    >
      <BackButtonHeader title={t("more.settings.theme.title")} />

      <View style={{ padding: 16 }}>
        {/* Current Theme Display */}
        <View
          className="rounded-2xl p-5 mb-6"
          style={{
            backgroundColor: colors.backgroundSecondary,
            borderWidth: 2,
            borderColor: colors.primary,
          }}
        >
          <Text
            className="text-xs mb-3"
            style={{ color: colors.textSecondary }}
          >
            {t("more.settings.theme.selectTheme")}
          </Text>
          <View className="flex-row items-center">
            {currentTheme?.icon}
            <View className="ml-4 flex-1">
              <Text
                className="text-xl font-bold"
                style={{ color: colors.primary }}
              >
                {currentTheme?.name}
              </Text>
              <Text
                className="text-xs mt-1"
                style={{ color: colors.textSecondary }}
              >
                {t("more.settings.theme.currentlyActive")}
              </Text>
            </View>
          </View>
        </View>

        {/* Theme Selection */}
        <Text className="text-xs mb-3" style={{ color: colors.textSecondary }}>
          {t("more.settings.theme.selectThemeLabel")}
        </Text>

        <View className="gap-3">
          {themes.map((theme) => (
            <PressableBlock
              key={theme.id}
              onPress={() => setColorScheme(theme.id)}
              className="rounded-xl p-4 flex-row items-center"
              style={{
                backgroundColor: colors.backgroundSecondary,
                borderWidth: 2,
                borderColor:
                  themePreference === theme.id ? colors.primary : "transparent",
              }}
              activeOpacity={0.7}
            >
              {theme.icon}
              <View className="ml-3 flex-1">
                <Text
                  className="text-base font-semibold"
                  style={{
                    color:
                      themePreference === theme.id
                        ? colors.primary
                        : colors.textPrimary,
                  }}
                >
                  {theme.name}
                </Text>
                <Text
                  className="text-xs mt-0.5"
                  style={{ color: colors.textSecondary }}
                >
                  {theme.description}
                </Text>
              </View>
              {themePreference === theme.id && (
                <View
                  className="w-6 h-6 rounded-full items-center justify-center"
                  style={{ backgroundColor: colors.primary }}
                >
                  <Text className="text-black text-sm font-bold">✓</Text>
                </View>
              )}
            </PressableBlock>
          ))}
        </View>
      </View>
    </View>
  );
}
