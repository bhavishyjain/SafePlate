import { Image } from "expo-image";
import { router } from "expo-router";
import {
  LogOut,
  Settings,
  UserCircle,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { darkColors, lightColors } from "../../../colors";
import DialogBox from "../../../components/DialogBox";
import MenuItem from "../../../components/MenuItem";
import { API_BASE_URL } from "../../../url";
import { useTheme } from "../../../utils/context/theme";
import { useTranslation } from "../../../utils/i18n/LanguageProvider";
import getUserAuth from "../../../utils/userAuth";

export default function More() {
  const { t, locale } = useTranslation();
  const { colorScheme, toggleColorScheme } = useTheme();
  const [user, setUser] = useState(null);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Get current theme colors
  const colors = colorScheme === "dark" ? darkColors : lightColors;

  useEffect(() => {
    (async () => {
      const authUser = await getUserAuth();
      setUser(authUser);
    })();
  }, []);

  const displayUser = user || {
    name: "",
    phone: "",
    email: "",
    photo: "",
    on_vacation: false,
  };

  const photo = displayUser.photo?.startsWith("http")
    ? displayUser.photo
    : null;

  return (
    // <AutoSkeleton isLoading={!displayUser}>
    <ScrollView
      className="flex-1"
      style={{ backgroundColor: colors.backgroundPrimary }}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ padding: 16, paddingTop: 24 }}
    >
      {/* PROFILE */}
      <View className="items-center mb-8">
        <View
          className="rounded-full border-2 overflow-hidden"
          style={{ borderColor: colors.textPrimary }}
        >
          {!imgError && photo ? (
            <Image
              source={{ uri: photo }}
              onError={() => setImgError(true)}
              style={{ width: 96, height: 96 }}
              className="rounded-full"
              contentFit="cover"
            />
          ) : (
            <View
              style={{
                width: 96,
                height: 96,
                backgroundColor: colors.backgroundSecondary,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <UserCircle size={64} color={colors.textSecondary} />
            </View>
          )}
        </View>

        <Text
          className="text-lg font-bold mt-3"
          style={{ color: colors.textPrimary }}
        >
          {displayUser.name}
        </Text>

        <Text style={{ color: colors.textSecondary }}>
          {displayUser.phone}
        </Text>
        <Text style={{ color: colors.textSecondary }}>
          {displayUser.email}
        </Text>

        {displayUser.on_vacation && (
          <Text className="mt-2 text-base" style={{ color: colors.danger }}>
            {t("more.vacationEnabled")}
          </Text>
        )}
      </View>

      <View>
        {/* MENU */}
        <MenuItem
          icon={<Settings />}
          title={t("more.settings.title")}
          subtitle={t("more.settings.subtitle")}
          onPress={() => router.push("/(app)/more/settings")}
        />

        <MenuItem
          icon={<LogOut />}
          title={t("more.logout.title")}
          subtitle={t("more.logout.subtitle")}
          onPress={() => setShowLogoutDialog(true)}
          danger
        />
      </View>

      {/* Bottom spacing for floating tab bar */}
      <View className="h-28" />

      {/* Logout Confirmation Dialog */}
      <DialogBox
        visible={showLogoutDialog}
        title={t("dialog.logout.title")}
        message={t("dialog.logout.message")}
        confirmText={t("dialog.logout.confirm")}
        cancelText={t("dialog.logout.cancel")}
        onConfirm={async () => {
          setShowLogoutDialog(false);
          router.replace("/(app)/(auth)/logout");
        }}
        onCancel={() => setShowLogoutDialog(false)}
      />
    </ScrollView>
    // </AutoSkeleton>
  );
}
