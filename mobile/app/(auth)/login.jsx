import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import Toast from "react-native-toast-message";
import { Eye, EyeOff } from "lucide-react-native";
import { Button, Field, Screen, Title, useColors } from "../../components/ui";
import LanguagePicker from "../../components/LanguagePicker";
import { useAuth } from "../../utils/context/auth";

export default function Login() {
  const colors = useColors();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const submit = async () => {
    if (!form.email.trim() || !form.password) return Toast.show({ type: "error", text1: "Enter your email and password" });
    setLoading(true);
    try { await login({ email: form.email.trim().toLowerCase(), password: form.password }); }
    catch (error) { Toast.show({ type: "error", text1: "Sign in failed", text2: error.message }); }
    finally { setLoading(false); }
  };
  return <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}><Screen contentStyle={{ flexGrow: 1, justifyContent: "center", maxWidth: 520, width: "100%", alignSelf: "center" }}><Title subtitle="Coordinate safe food donations with trusted NGOs.">Welcome to SafePlate</Title><Field label="Email" value={form.email} onChangeText={(email) => setForm({ ...form, email })} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" /><Field label="Password" value={form.password} onChangeText={(password) => setForm({ ...form, password })} secureTextEntry={!showPassword} autoCapitalize="none" autoCorrect={false} autoComplete="password" textContentType="password" rightAccessory={<Pressable accessibilityRole="button" accessibilityLabel={showPassword ? "Hide password" : "Show password"} accessibilityState={{ checked: showPassword }} hitSlop={8} onPress={() => setShowPassword((current) => !current)}>{showPassword ? <EyeOff color={colors.textSecondary} size={22} /> : <Eye color={colors.textSecondary} size={22} />}</Pressable>} /><View style={{ gap: 12 }}><Button title="Forgot password?" variant="secondary" onPress={() => router.push("/forgot-password")} /><Button title="Sign in" loading={loading} onPress={submit} /></View><View style={{ flexDirection: "row", justifyContent: "center", marginTop: 20 }}><Text style={{ color: colors.textSecondary }}>New to SafePlate? </Text><Pressable onPress={() => router.push("/register")}><Text style={{ color: colors.primary, fontWeight: "800" }}>Create account</Text></Pressable></View><View style={{ marginTop: 28 }}><LanguagePicker /></View></Screen></KeyboardAvoidingView>;
}
