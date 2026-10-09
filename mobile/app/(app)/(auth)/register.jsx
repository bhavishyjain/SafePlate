import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import Toast from "react-native-toast-message";
import { Button, Field, Screen, Title, useColors } from "../../../components/ui";
import CustomPicker from "../../../components/CustomPicker";
import { useAuth } from "../../../utils/context/auth";

export default function Register() {
  const colors = useColors();
  const { register } = useAuth();
  const [form, setForm] = useState({ name: "", phone: "", email: "", password: "", confirm: "", organization: "", role: "DONOR" });
  const [loading, setLoading] = useState(false);
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const submit = async () => {
    if (!form.name.trim() || form.phone.trim().length < 7 || !form.email.includes("@")) return Toast.show({ type: "error", text1: "Complete all required fields" });
    if (form.password.length < 8) return Toast.show({ type: "error", text1: "Password needs at least 8 characters" });
    if (form.password !== form.confirm) return Toast.show({ type: "error", text1: "Passwords do not match" });
    setLoading(true);
    try {
      const { confirm: ignored, ...payload } = form;
      void ignored;
      await register({ ...payload, name: form.name.trim(), phone: form.phone.trim(), email: form.email.trim().toLowerCase(), organization: form.organization.trim() || undefined });
      Toast.show({ type: "success", text1: "Account created", text2: "Sign in to continue" });
      router.replace("/(app)/(auth)/login");
    } catch (error) { Toast.show({ type: "error", text1: "Registration failed", text2: error.message }); }
    finally { setLoading(false); }
  };
  return <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}><Screen contentStyle={{ maxWidth: 520, width: "100%", alignSelf: "center" }}><Title subtitle="Donors and NGOs can create an account. Administrator accounts are managed separately.">Create account</Title><Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: "600", marginBottom: 7 }}>I am registering as</Text><CustomPicker data={[{ label: "Food donor", value: "DONOR" }, { label: "NGO", value: "NGO" }]} value={form.role} onChange={(item) => update("role", item.value)} placeholder="Select role" searchPlaceholder="" /><View style={{ height: 14 }} /><Field label="Full name *" value={form.name} onChangeText={(value) => update("name", value)} /><Field label="Phone *" value={form.phone} onChangeText={(value) => update("phone", value)} keyboardType="phone-pad" /><Field label="Email *" value={form.email} onChangeText={(value) => update("email", value)} autoCapitalize="none" keyboardType="email-address" /><Field label="Organization (optional)" value={form.organization} onChangeText={(value) => update("organization", value)} /><Field label="Password *" value={form.password} onChangeText={(value) => update("password", value)} secureTextEntry /><Field label="Confirm password *" value={form.confirm} onChangeText={(value) => update("confirm", value)} secureTextEntry /><Button title="Create account" onPress={submit} loading={loading} /><Pressable onPress={() => router.back()}><Text style={{ color: colors.primary, textAlign: "center", fontWeight: "700", marginTop: 20 }}>Back to sign in</Text></Pressable></Screen></KeyboardAvoidingView>;
}
