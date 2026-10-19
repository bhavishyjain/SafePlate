import { useState } from "react";
import { router } from "expo-router";
import { LogOut, Settings, ShieldOff, UserRound } from "lucide-react-native";
import { Text, View } from "react-native";
import Toast from "react-native-toast-message";
import DialogBox from "./DialogBox";
import MenuItem from "./MenuItem";
import { Screen, Surface, useColors } from "./ui";
import { labelFor } from "../constants/domain";
import { useAuth } from "../utils/context/auth";
import { useTranslation } from "../utils/i18n/LanguageProvider";
export default function AccountScreen() {
  const {
    tr
  } = useTranslation();
  const colors = useColors();
  const {
    user,
    logout
  } = useAuth();
  const [mode, setMode] = useState(null);
  const [loading, setLoading] = useState(false);
  const performLogout = async () => {
    setLoading(true);
    try {
      await logout(mode === "all");
      router.replace("/(app)/(auth)/login");
    } catch (error) {
      Toast.show({
        type: "error",
        text1: tr("Could not sign out"),
        text2: error.message
      });
    } finally {
      setLoading(false);
      setMode(null);
    }
  };
  return <Screen>
    <View style={{
      marginBottom: 22
    }}><Text style={{
        color: colors.textSecondary,
        fontSize: 14
      }}>{tr("Account")}</Text><Text style={{
        color: colors.textPrimary,
        fontSize: 30,
        fontWeight: "800",
        marginTop: 2
      }}>{tr("More")}</Text></View>
    <Surface style={{
      marginBottom: 24
    }}><View style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 14
      }}><View style={{
          width: 52,
          height: 52,
          borderRadius: 26,
          backgroundColor: colors.primarySoft,
          alignItems: "center",
          justifyContent: "center"
        }}><UserRound size={25} color={colors.primary} /></View><View style={{
          flex: 1
        }}><Text style={{
            color: colors.textPrimary,
            fontSize: 18,
            fontWeight: "800"
          }}>{user?.name}</Text><Text style={{
            color: colors.textSecondary,
            marginTop: 3
          }} numberOfLines={1}>{user?.email}</Text><Text style={{
            color: colors.primary,
            fontSize: 11,
            fontWeight: "800",
            marginTop: 5
          }}>{tr(labelFor(user?.role))}</Text></View></View>{user?.phone ? <Text style={{
        color: colors.textSecondary,
        fontSize: 12,
        marginTop: 14,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: colors.border
      }}>{user.phone}</Text> : null}</Surface>
    <Text style={{
      color: colors.textSecondary,
      fontWeight: "700",
      fontSize: 12,
      marginBottom: 9
    }}>{tr("Preferences")}</Text>
    <MenuItem icon={<Settings />} title={tr("Settings")} subtitle={tr("Appearance and language")} onPress={() => router.push("/(app)/more/settings")} />
    <Text style={{
      color: colors.textSecondary,
      fontWeight: "700",
      fontSize: 12,
      marginTop: 12,
      marginBottom: 9
    }}>{tr("Sessions")}</Text>
    <MenuItem icon={<LogOut />} title={tr("Sign out")} subtitle={tr("End this session on this device")} onPress={() => setMode("one")} />
    <MenuItem icon={<ShieldOff />} title={tr("Sign out everywhere")} subtitle={tr("Revoke all active SafePlate sessions")} onPress={() => setMode("all")} danger />
    <DialogBox visible={Boolean(mode)} title={mode === "all" ? tr("Sign out everywhere?") : tr("Sign out?")} message={mode === "all" ? tr("Every active session for this account will be revoked.") : tr("This session will be revoked on the server.")} confirmText={tr("Sign out")} onConfirm={performLogout} onCancel={() => setMode(null)} loading={loading} />
  </Screen>;
}
