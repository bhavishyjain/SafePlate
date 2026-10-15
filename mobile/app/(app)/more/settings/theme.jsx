import { Check, MonitorCog, Moon, Sun } from "lucide-react-native";
import { Text, View } from "react-native";
import BackButtonHeader from "../../../../components/BackButtonHeader";
import { Screen, Surface, Title, useColors } from "../../../../components/ui";
import { useTheme } from "../../../../utils/context/theme";
import { useTranslation } from "../../../../utils/i18n/LanguageProvider";

export default function ThemeSettings() {
  const { t } = useTranslation();
  const { setColorScheme, themePreference } = useTheme();
  const colors = useColors();
  const themes = [
    { id: "system", name: t("more.settings.theme.system"), description: t("more.settings.theme.systemDesc"), Icon: MonitorCog },
    { id: "light", name: t("more.settings.theme.light"), description: t("more.settings.theme.lightDesc"), Icon: Sun },
    { id: "dark", name: t("more.settings.theme.dark"), description: t("more.settings.theme.darkDesc"), Icon: Moon },
  ];

  return <View style={{ flex: 1, backgroundColor: colors.backgroundPrimary }}>
    <BackButtonHeader title={t("more.settings.theme.title")} />
    <Screen>
      <Title eyebrow="Appearance" subtitle={t("more.settings.theme.selectThemeLabel")}>{t("more.settings.theme.selectTheme")}</Title>
      {themes.map(({ id, name, description, Icon }) => {
        const selected = themePreference === id;
        return <Surface key={id} accessibilityLabel={`Use ${name} theme`} onPress={() => setColorScheme(id)} style={{ marginBottom: 11, flexDirection: "row", alignItems: "center", gap: 14, borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.primarySoft : colors.backgroundSecondary }}>
          <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: selected ? colors.primary : colors.backgroundElevated, alignItems: "center", justifyContent: "center" }}><Icon color={selected ? colors.onPrimary : colors.textSecondary} size={22} /></View>
          <View style={{ flex: 1 }}><Text style={{ color: colors.textPrimary, fontWeight: "900", fontSize: 16 }}>{name}</Text><Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 18, marginTop: 3 }}>{description}</Text></View>
          {selected ? <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" }}><Check color={colors.onPrimary} size={16} strokeWidth={3} /></View> : null}
        </Surface>;
      })}
    </Screen>
  </View>;
}
