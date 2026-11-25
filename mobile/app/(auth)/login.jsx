import { useState } from "react";
import { Image, KeyboardAvoidingView, Platform, Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import Toast from "react-native-toast-message";
import { Eye, EyeOff } from "lucide-react-native";
import { Button, Field, Screen, useColors } from "../../components/ui";
import LanguagePicker from "../../components/LanguagePicker";
import { useAuth } from "../../utils/context/auth";
import { useTranslation } from "../../utils/i18n/LanguageProvider";

const DEMO_ACCOUNTS = [
  { label: "Donor", email: "donor@example.com" },
  { label: "NGO", email: "ngo@example.com" },
  { label: "Admin", email: "admin@example.com" },
];

export default function Login() {
  const colors = useColors();
  const { tr } = useTranslation();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const submit = async (credentials = form) => {
    if (!credentials.email.trim() || !credentials.password) return Toast.show({ type: "error", text1: tr("Enter your email and password") });
    setLoading(true);
    try { await login({ email: credentials.email.trim().toLowerCase(), password: credentials.password }); }
    catch (error) {
      const isNetworkError = !error.status;
      Toast.show({ type: "error", text1: tr("Sign in failed"), text2: isNetworkError ? tr("The server may be waking up. Check your internet and try again.") : error.message });
    }
    finally { setLoading(false); }
  };
  const quickLogin = (account) => {
    const credentials = { email: account.email, password: "123456" };
    setForm(credentials);
    submit(credentials);
  };
  return <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}><Screen contentStyle={{ flexGrow: 1, justifyContent: "center", alignItems: "center", maxWidth: 520, width: "100%", alignSelf: "center", paddingVertical: 32 }}><Image source={require("../../assets/images/splash.png")} accessibilityLabel={tr("SafePlate logo")} style={{ width: 108, height: 108, marginBottom: 20 }} resizeMode="contain" /><View style={{ width: "100%", alignItems: "center", marginBottom: 24 }}><Text style={{ color: colors.textPrimary, fontSize: 28, fontWeight: "600", textAlign: "center" }}>{tr("Welcome to SafePlate")}</Text><Text style={{ color: colors.textSecondary, lineHeight: 20, marginTop: 6, textAlign: "center", maxWidth: 340 }}>{tr("Coordinate safe food donations with trusted NGOs.")}</Text></View><View style={{ width: "100%", maxWidth: 340, alignSelf: "center", marginBottom: 20 }}><Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: "600", marginBottom: 8, textAlign: "center" }}>{tr("Quick demo login")}</Text><View style={{ flexDirection: "row", justifyContent: "center", gap: 8 }}>{DEMO_ACCOUNTS.map((account) => <Pressable key={account.label} accessibilityRole="button" accessibilityLabel={tr("Sign in as {{role}}", { role: tr(account.label) })} disabled={loading} onPress={() => quickLogin(account)} style={({ pressed }) => ({ flex: 1, minHeight: 44, alignItems: "center", justifyContent: "center", borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.backgroundSecondary, opacity: loading ? 0.5 : pressed ? 0.75 : 1 })}><Text style={{ color: colors.textPrimary, fontWeight: "600" }}>{tr(account.label)}</Text></Pressable>)}</View></View><View style={{ width: "100%" }}><Field label={tr("Email address")} value={form.email} onChangeText={(email) => setForm({ ...form, email })} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" /><Field label={tr("Password")} value={form.password} onChangeText={(password) => setForm({ ...form, password })} secureTextEntry={!showPassword} autoCapitalize="none" autoCorrect={false} autoComplete="password" textContentType="password" rightAccessory={<Pressable accessibilityRole="button" accessibilityLabel={showPassword ? tr("Hide password") : tr("Show password")} accessibilityState={{ checked: showPassword }} hitSlop={8} onPress={() => setShowPassword((current) => !current)}>{showPassword ? <EyeOff color={colors.textSecondary} size={22} /> : <Eye color={colors.textSecondary} size={22} />}</Pressable>} /><View style={{ gap: 12 }}><Button title={tr("Forgot password?")} variant="secondary" onPress={() => router.push("/forgot-password")} /><Button title={tr("Sign in")} loading={loading} onPress={() => submit()} /></View><View style={{ flexDirection: "row", justifyContent: "center", marginTop: 20 }}><Text style={{ color: colors.textSecondary }}>{tr("New to SafePlate?")} </Text><Pressable onPress={() => router.push("/register")}><Text style={{ color: colors.primary, fontWeight: "600" }}>{tr("Create account")}</Text></Pressable></View><View style={{ marginTop: 28 }}><LanguagePicker /></View></View></Screen></KeyboardAvoidingView>;
}
