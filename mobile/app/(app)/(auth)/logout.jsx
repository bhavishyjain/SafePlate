import { router } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { darkColors, lightColors } from "../../../colors";
import { useTheme } from "../../../utils/context/theme";
import { useTranslation } from "../../../utils/i18n/LanguageProvider";
import { clearUserAuth } from "../../../utils/userAuth";

export default function LogoutScreen() {
  const { colorScheme } = useTheme();
  const colors = colorScheme === "dark" ? darkColors : lightColors;
  const { t } = useTranslation();

  useEffect(() => {
    (async () => {
      await clearUserAuth();
    })();

    const timer = setTimeout(() => {
      router.replace("/(app)/(auth)/login");
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View
      className="flex-1 items-center justify-center font-fira-medium"
      style={{ backgroundColor: colors.backgroundPrimary }}
    >
      <ActivityIndicator size="large" color={colors.primary} />
      <Text
        className="text-base mt-6 font-medium"
        style={{ color: colors.textPrimary }}
      >
        {t("auth.logout.title", { defaultValue: "Logging out..." })}
      </Text>
      <Text className="text-sm mt-2" style={{ color: colors.textSecondary }}>
        {t("auth.logout.subtitle", { defaultValue: "See you soon 👋" })}
      </Text>
    </View>
  );
}
