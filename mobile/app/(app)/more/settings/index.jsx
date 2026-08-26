import { router } from "expo-router";
import { Globe, Moon, Settings, Sun, Trash2 } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";

import BackButtonHeader from "../../../../components/BackButtonHeader";
import MenuItem from "../../../../components/MenuItem";

import { useTranslation } from "../../../../utils/i18n/LanguageProvider";
import getUserAuth from "../../../../utils/userAuth";

import { darkColors, lightColors } from "../../../../colors";
import DialogBox from "../../../../components/DialogBox";
import { useTheme } from "../../../../utils/context/theme";
import LanguagePicker from "./../../../../components/LanguagePicker";

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { colorScheme } = useTheme();
  const colors = colorScheme === "dark" ? darkColors : lightColors;

  const [user, setUser] = useState(null);
  const languagePickerRef = useRef(null);

  const [showDeleteAccountDialog, setShowDeleteAccountDialog] = useState(false);

  useEffect(() => {
    (async () => {
      const userauth = await getUserAuth();
      setUser(userauth);
    })();
  }, []);

  if (!user) return null;

  return (
    <View
      className="flex-1"
      style={{ backgroundColor: colors.backgroundPrimary }}
    >
      <BackButtonHeader title={t("more.settings.title")} hasBackButton />

      <ScrollView
        className="flex-1"
        style={{ backgroundColor: colors.backgroundPrimary }}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16 }}
      >
        <View>
          {/* Section Header */}
          <View className="mb-4 mt-2">
            <View className="flex-row items-center mb-1">
              <Settings
                size={20}
                color={colors.textPrimary}
                strokeWidth={2.5}
              />
              <Text
                className="text-base font-bold ml-2"
                style={{ color: colors.textPrimary }}
              >
                {t("more.settings.preferencesTitle")}
              </Text>
            </View>
            <Text
              className="text-xs font-medium"
              style={{ color: colors.muted }}
            >
              {t("more.settings.preferencesDesc")}
            </Text>
          </View>

          {/* Menu Items */}
          <MenuItem
            icon={
              colorScheme === "dark" ? (
                <Moon color={colors.textPrimary} />
              ) : (
                <Sun color={colors.textPrimary} />
              )
            }
            title={t("more.settings.menu.theme.title")}
            subtitle={
              colorScheme === "dark"
                ? t("more.settings.menu.theme.subtitle.dark")
                : t("more.settings.menu.theme.subtitle.light")
            }
            onPress={() => router.push("/(app)/more/settings/theme")}
          />
          <MenuItem
            icon={<Globe color={colors.textPrimary} />}
            title={t("more.settings.menu.language.title")}
            subtitle={t("more.settings.menu.language.subtitle")}
            onPress={() => languagePickerRef.current?.openModal()}
          />
          <MenuItem
            icon={<Trash2 color={colors.danger} />}
            title={t("more.settings.menu.deleteAccount.title")}
            subtitle={t("more.settings.menu.deleteAccount.subtitle")}
            onPress={() => setShowDeleteAccountDialog(true)}
          />
        </View>
      </ScrollView>

      {/* Hidden Language Picker Modal */}
      <LanguagePicker ref={languagePickerRef} modalOnly />
      
      <DialogBox
        visible={showDeleteAccountDialog}
        title={t("more.settings.menu.deleteAccount.modalTitle")}
        message={t("more.settings.menu.deleteAccount.modalMessage")}
        confirmText={"OK"}
        cancelText={"Cancel"}
        onConfirm={async () => {
          setShowDeleteAccountDialog(false);
        }}
        onCancel={async () => {
          setShowDeleteAccountDialog(false);
        }}
      />
    </View>
  );
}
