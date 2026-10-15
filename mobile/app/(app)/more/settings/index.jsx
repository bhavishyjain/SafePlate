import { router } from "expo-router";
import { Globe, Moon, Sun } from "lucide-react-native";
import { useRef } from "react";
import { Text, View } from "react-native";
import BackButtonHeader from "../../../../components/BackButtonHeader";
import LanguagePicker from "../../../../components/LanguagePicker";
import MenuItem from "../../../../components/MenuItem";
import { Screen, useColors } from "../../../../components/ui";
import { useTheme } from "../../../../utils/context/theme";
import { useTranslation } from "../../../../utils/i18n/LanguageProvider";

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { colorScheme } = useTheme();
  const colors = useColors();
  const languagePickerRef = useRef(null);
  return <View style={{ flex: 1, backgroundColor: colors.backgroundPrimary }}>
    <BackButtonHeader title={t("more.settings.title")} hasBackButton />
    <Screen>
      <Text style={{ color: colors.textPrimary, fontSize: 24, fontWeight: "800", marginBottom: 4 }}>{t("more.settings.preferencesTitle")}</Text>
      <Text style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 20, marginBottom: 22 }}>{t("more.settings.preferencesDesc")}</Text>
      <MenuItem icon={colorScheme === "dark" ? <Moon /> : <Sun />} title={t("more.settings.menu.theme.title")} subtitle={colorScheme === "dark" ? t("more.settings.menu.theme.subtitle.dark") : t("more.settings.menu.theme.subtitle.light")} onPress={() => router.push("/(app)/more/settings/theme")} />
      <MenuItem icon={<Globe />} title={t("more.settings.menu.language.title")} subtitle={t("more.settings.menu.language.subtitle")} onPress={() => languagePickerRef.current?.openModal()} />
    </Screen>
    <LanguagePicker ref={languagePickerRef} modalOnly />
  </View>;
}
