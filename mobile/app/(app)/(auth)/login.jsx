import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import Toast from "react-native-toast-message";
import { Button, Field, Screen, Title, useColors } from "../../../components/ui";
import CustomPicker from "../../../components/CustomPicker";
import LanguagePicker from "../../../components/LanguagePicker";
import { useAuth } from "../../../utils/context/auth";

export default function Login() {
  const colors = useColors();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "", role: "DONOR" });
  const [loading, setLoading] = useState(false);
  const submit = async () => {
    if (!form.email.trim() || !form.password) return Toast.show({ type: "error", text1: "Enter your email and password" });
    setLoading(true);
    try { await login({ ...form, email: form.email.trim().toLowerCase() }); }
    catch (error) { Toast.show({ type: "error", text1: "Sign in failed", text2: error.message }); }
    finally { setLoading(false); }
  };
  return <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}><Screen contentStyle={{ flexGrow: 1, justifyContent: "center", maxWidth: 520, width: "100%", alignSelf: "center" }}><Title subtitle="Coordinate safe food donations with trusted NGOs.">Welcome to SafePlate</Title><Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: "600", marginBottom: 7 }}>Account role</Text><CustomPicker data={[{ label: "Donor", value: "DONOR" }, { label: "NGO", value: "NGO" }, { label: "Administrator", value: "ADMIN" }]} value={form.role} onChange={(item) => setForm({ ...form, role: item.value })} placeholder="Select role" searchPlaceholder="" /><View style={{ height: 14 }} /><Field label="Email" value={form.email} onChangeText={(email) => setForm({ ...form, email })} keyboardType="email-address" autoCapitalize="none" autoComplete="email" /><Field label="Password" value={form.password} onChangeText={(password) => setForm({ ...form, password })} secureTextEntry autoComplete="password" /><Pressable onPress={() => router.push("/(app)/(auth)/forgot-password")}><Text style={{ color: colors.primary, fontWeight: "700", marginBottom: 18 }}>Forgot password?</Text></Pressable><Button title="Sign in" loading={loading} onPress={submit} /><View style={{ flexDirection: "row", justifyContent: "center", marginTop: 20 }}><Text style={{ color: colors.textSecondary }}>New to SafePlate? </Text><Pressable onPress={() => router.push("/(app)/(auth)/register")}><Text style={{ color: colors.primary, fontWeight: "800" }}>Create account</Text></Pressable></View><View style={{ marginTop: 28 }}><LanguagePicker /></View></Screen></KeyboardAvoidingView>;
}
