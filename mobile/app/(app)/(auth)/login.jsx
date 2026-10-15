import { useState } from "react";
import { Image, KeyboardAvoidingView, Platform, Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import Toast from "react-native-toast-message";
import LanguagePicker from "../../../components/LanguagePicker";
import { Button, Field, Screen, useColors } from "../../../components/ui";
import { useAuth } from "../../../utils/context/auth";

export default function Login() {
  const colors = useColors();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!form.email.trim() || !form.password) return Toast.show({ type: "error", text1: "Enter your email and password" });
    setLoading(true);
    try { await login({ ...form, email: form.email.trim().toLowerCase() }); }
    catch (error) { Toast.show({ type: "error", text1: "Sign in failed", text2: error.message }); }
    finally { setLoading(false); }
  };

  return <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.backgroundPrimary }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
    <Screen contentStyle={{ flexGrow: 1, justifyContent: "center", maxWidth: 520, paddingTop: 28, paddingBottom: 20 }}>
      <View style={{ alignItems: "center", marginBottom: 30 }}>
        <Image source={require("../../../assets/images/splash.png")} style={{ width: 82, height: 82, borderRadius: 20 }} />
        <Text style={{ color: colors.textPrimary, fontSize: 30, fontWeight: "800", marginTop: 18 }}>Welcome back</Text>
        <Text style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 20, textAlign: "center", marginTop: 7 }}>Sign in to manage food donations and deliveries.</Text>
      </View>
      <Field label="Email address" value={form.email} onChangeText={(email) => setForm((current) => ({ ...current, email }))} keyboardType="email-address" autoCapitalize="none" autoComplete="email" placeholder="you@example.com" />
      <Field label="Password" value={form.password} onChangeText={(password) => setForm((current) => ({ ...current, password }))} secureTextEntry autoComplete="password" placeholder="Enter your password" />
      <Pressable accessibilityRole="button" onPress={() => router.push("/(app)/(auth)/forgot-password")} style={{ alignSelf: "flex-end" }}><Text style={{ color: colors.primary, fontWeight: "700", fontSize: 13 }}>Forgot password?</Text></Pressable>
      <View style={{ marginTop: 26 }}><LanguagePicker /></View>
    </Screen>
    <View style={{ borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.backgroundPrimary, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16 }}>
      <View style={{ width: "100%", maxWidth: 520, alignSelf: "center" }}>
        <Button title="Log in" loading={loading} onPress={submit} />
        <Button title="Create account" variant="secondary" onPress={() => router.push("/(app)/(auth)/register")} style={{ marginTop: 10 }} />
      </View>
    </View>
  </KeyboardAvoidingView>;
}
