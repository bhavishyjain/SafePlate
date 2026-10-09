import { useState } from "react";
import { router } from "expo-router";
import { LogOut, Settings, ShieldOff, UserCircle } from "lucide-react-native";
import Toast from "react-native-toast-message";
import DialogBox from "./DialogBox";
import MenuItem from "./MenuItem";
import { Screen, Surface, Title, useColors } from "./ui";
import { Text, View } from "react-native";
import { useAuth } from "../utils/context/auth";

export default function AccountScreen() {
  const colors = useColors(); const { user, logout } = useAuth(); const [mode, setMode] = useState(null); const [loading, setLoading] = useState(false);
  const performLogout = async () => { setLoading(true); try { await logout(mode === "all"); router.replace("/(app)/(auth)/login"); } catch (error) { Toast.show({ type: "error", text1: "Could not sign out", text2: error.message }); } finally { setLoading(false); setMode(null); } };
  return <Screen><Title subtitle="Your SafePlate account and preferences.">More</Title><Surface style={{ alignItems: "center", marginBottom: 22 }}><UserCircle size={64} color={colors.primary} /><Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: "800", marginTop: 10 }}>{user?.name}</Text><Text style={{ color: colors.textSecondary, marginTop: 4 }}>{user?.email}</Text>{user?.phone ? <Text style={{ color: colors.textSecondary }}>{user.phone}</Text> : null}<View style={{ marginTop: 10, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, backgroundColor: `${colors.primary}22` }}><Text style={{ color: colors.primary, fontWeight: "800", fontSize: 12 }}>{user?.role}</Text></View></Surface><MenuItem icon={<Settings />} title="Settings" subtitle="Theme and language preferences" onPress={() => router.push("/(app)/more/settings")} /><MenuItem icon={<LogOut />} title="Sign out" subtitle="End this session on this device" onPress={() => setMode("one")} /><MenuItem icon={<ShieldOff />} title="Sign out everywhere" subtitle="Revoke all active SafePlate sessions" onPress={() => setMode("all")} danger /><DialogBox visible={Boolean(mode)} title={mode === "all" ? "Sign out everywhere?" : "Sign out?"} message={mode === "all" ? "Every active session for this account will be revoked." : "This session will be revoked on the server."} confirmText="Sign out" onConfirm={performLogout} onCancel={() => setMode(null)} loading={loading} /></Screen>;
}
