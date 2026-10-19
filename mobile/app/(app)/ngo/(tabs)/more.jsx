import { useCallback, useMemo, useRef, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import { Building2, ChevronRight, CircleHelp, ClipboardList, Globe, HeartPulse, LogOut, Moon, ShieldOff, Sun } from "lucide-react-native";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import Toast from "react-native-toast-message";
import DialogBox from "../../../../components/DialogBox";
import LanguagePicker from "../../../../components/LanguagePicker";
import PressableBlock from "../../../../components/PressableBlock";
import { darkColors, lightColors } from "../../../../colors";
import { listAllocations } from "../../../../services/allocations";
import { getMyNgo } from "../../../../services/ngos";
import { useAuth } from "../../../../utils/context/auth";
import { useTheme } from "../../../../utils/context/theme";
import { useTranslation } from "../../../../utils/i18n/LanguageProvider";
export default function NgoMore() {
  const {
    tr
  } = useTranslation();
  const {
    colorScheme
  } = useTheme();
  const colors = colorScheme === "dark" ? darkColors : lightColors;
  const {
    user,
    logout
  } = useAuth();
  const languagePickerRef = useRef(null);
  const [dialog, setDialog] = useState(null);
  const [loading, setLoading] = useState(false);
  const [state, setState] = useState(null);
  const load = useCallback(async () => {
    try {
      const [profile, allocations] = await Promise.all([getMyNgo(), listAllocations({
        page: 1,
        limit: 100
      })]);
      setState({
        profile,
        allocations
      });
    } catch {
      setState(null);
    }
  }, []);
  useFocusEffect(useCallback(() => {
    load();
  }, [load]));
  const activity = useMemo(() => {
    const items = state?.allocations?.items || [];
    return {
      active: items.filter(item => ["ASSIGNED", "PICKED_UP"].includes(item.status)).length,
      delivered: items.filter(item => item.status === "DELIVERED").length,
      capacity: state?.profile?.capacity || 0
    };
  }, [state]);
  const performLogout = async () => {
    setLoading(true);
    try {
      await logout(dialog === "logout-all");
      router.replace("/(app)/(auth)/login");
    } catch (error) {
      Toast.show({
        type: "error",
        text1: tr("Could not sign out"),
        text2: error.message
      });
    } finally {
      setLoading(false);
      setDialog(null);
    }
  };
  const organization = state?.profile?.userId?.organization || user?.organization || user?.name || "NGO partner";
  const initial = organization.trim().charAt(0).toUpperCase();
  return <>
    <ScrollView style={{
      flex: 1,
      backgroundColor: colors.backgroundPrimary
    }} contentContainerStyle={{
      width: "100%",
      maxWidth: 820,
      alignSelf: "center",
      paddingHorizontal: 16,
      paddingTop: 28,
      paddingBottom: 132
    }} showsVerticalScrollIndicator={false}>
      
      <Text style={{
        color: colors.textSecondary,
        fontSize: 13,
        marginTop: 4,
        marginBottom: 24
      }}>{tr("Organization tools, preferences and account sessions.")}</Text>

      <View style={{
        alignItems: "center",
        marginBottom: 25
      }}><View style={{
          width: 88,
          height: 88,
          borderRadius: 44,
          backgroundColor: colors.primary,
          borderWidth: 4,
          borderColor: colors.backgroundSecondary,
          alignItems: "center",
          justifyContent: "center"
        }}><Text style={{
            color: colors.onPrimary,
            fontSize: 34,
            fontWeight: "900"
          }}>{initial}</Text></View><Text style={{
          color: colors.textPrimary,
          fontSize: 19,
          fontWeight: "900",
          marginTop: 12,
          textAlign: "center"
        }}>{organization}</Text><Text style={{
          color: colors.textSecondary,
          fontSize: 13,
          marginTop: 3
        }}>{user?.email}</Text><View style={{
          paddingHorizontal: 10,
          paddingVertical: 5,
          borderRadius: 999,
          backgroundColor: `${colors.primary}18`,
          marginTop: 9
        }}><Text style={{
            color: colors.primary,
            fontSize: 10,
            fontWeight: "900"
          }}>{tr("NGO PARTNER")}</Text></View></View>

      <View style={{
        flexDirection: "row",
        gap: 9,
        marginBottom: 26
      }}><ProfileMetric label={tr("Beneficiaries")} value={activity.capacity} colors={colors} loading={!state} /><ProfileMetric label={tr("Active")} value={activity.active} colors={colors} loading={!state} /><ProfileMetric label={tr("Delivered")} value={activity.delivered} colors={colors} loading={!state} /></View>

      <SectionLabel colors={colors}>{tr("Operations")}</SectionLabel>
      <MenuRow icon={ClipboardList} title={tr("Assignments")} subtitle={tr("Manage pickup and delivery tasks")} colors={colors} onPress={() => router.push("/(app)/ngo/(tabs)/assignments")} />
      <MenuRow icon={HeartPulse} title={tr("Nutrition status")} subtitle={tr("Daily calorie and protein coverage")} colors={colors} onPress={() => router.push("/(app)/ngo/(tabs)/nutrition")} />
      <MenuRow icon={Building2} title={tr("Organization profile")} subtitle={tr("Beneficiary groups, type and service location")} colors={colors} onPress={() => router.push("/(app)/ngo/(tabs)/profile")} />

      <SectionLabel colors={colors}>{tr("Preferences")}</SectionLabel>
      <MenuRow icon={colorScheme === "dark" ? Moon : Sun} title={tr("Appearance")} subtitle={tr("{{theme}} theme is active", { theme: tr(colorScheme === "dark" ? "Dark" : "Light") })} colors={colors} onPress={() => router.push("/(app)/more/settings/theme")} />
      <MenuRow icon={Globe} title={tr("Language")} subtitle={tr("English and Hindi options")} colors={colors} onPress={() => languagePickerRef.current?.openModal()} />

      <SectionLabel colors={colors}>{tr("About SafePlate")}</SectionLabel>
      <MenuRow icon={CircleHelp} title={tr("How NGO matching works")} subtitle={tr("Nutrition eligibility, distance and delivery flow")} colors={colors} onPress={() => setDialog("about")} />

      <SectionLabel colors={colors}>{tr("Sessions")}</SectionLabel>
      <MenuRow icon={LogOut} title={tr("Sign out")} subtitle={tr("End this session on this device")} colors={colors} onPress={() => setDialog("logout")} danger />
      <MenuRow icon={ShieldOff} title={tr("Sign out everywhere")} subtitle={tr("Revoke every active SafePlate session")} colors={colors} onPress={() => setDialog("logout-all")} danger />
      <Text style={{
        color: colors.textTertiary,
        fontSize: 11,
        textAlign: "center",
        marginTop: 12
      }}>{tr("SafePlate · Nutrition aware food allocation")}</Text>
    </ScrollView>

    <LanguagePicker ref={languagePickerRef} modalOnly />
    <DialogBox visible={dialog === "about"} title={tr("How NGO matching works")} message={tr("SafePlate checks your beneficiary nutrition gap and pickup distance when allocating suitable food. Confirm pickup after collection and confirm delivery when the food reaches your organization.")} confirmText={tr("Got it")} cancelText={tr("Close")} onConfirm={() => setDialog(null)} onCancel={() => setDialog(null)} />
    <DialogBox visible={dialog === "logout" || dialog === "logout-all"} title={dialog === "logout-all" ? tr("Sign out everywhere?") : tr("Sign out?")} message={dialog === "logout-all" ? tr("Every active session for this account will be revoked.") : tr("This session will be ended on this device.")} confirmText={tr("Sign out")} onConfirm={performLogout} onCancel={() => setDialog(null)} loading={loading} />
  </>;
}
function SectionLabel({
  children,
  colors
}) {
  return <Text style={{
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.7,
    textTransform: "uppercase",
    marginTop: 4,
    marginBottom: 9
  }}>{children}</Text>;
}
function ProfileMetric({
  label,
  value,
  colors,
  loading
}) {
  return <View style={{
    flex: 1,
    minWidth: 0,
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 10,
    alignItems: "center"
  }}>{loading ? <ActivityIndicator size="small" color={colors.primary} /> : <Text style={{
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: "900"
    }} numberOfLines={1}>{value}</Text>}<Text style={{
      color: colors.textSecondary,
      fontSize: 10,
      marginTop: 4
    }} numberOfLines={1}>{label}</Text></View>;
}
function MenuRow({
  icon: Icon,
  title,
  subtitle,
  colors,
  onPress,
  danger = false
}) {
  const tint = danger ? colors.danger : colors.textPrimary;
  return <PressableBlock onPress={onPress} style={{
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 15,
    marginBottom: 10
  }}><View style={{
      width: 38,
      height: 38,
      borderRadius: 12,
      backgroundColor: danger ? `${colors.danger}12` : colors.backgroundElevated,
      alignItems: "center",
      justifyContent: "center"
    }}><Icon size={19} color={tint} /></View><View style={{
      flex: 1,
      marginLeft: 13
    }}><Text style={{
        color: tint,
        fontSize: 14,
        fontWeight: "800"
      }}>{title}</Text><Text style={{
        color: colors.textSecondary,
        fontSize: 12,
        lineHeight: 17,
        marginTop: 2
      }}>{subtitle}</Text></View><ChevronRight size={18} color={colors.textTertiary} /></PressableBlock>;
}
