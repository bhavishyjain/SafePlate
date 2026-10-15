import { useState } from "react";
import { Image, KeyboardAvoidingView, Platform, Text, View } from "react-native";
import { router } from "expo-router";
import Toast from "react-native-toast-message";
import CustomPicker from "../../../components/CustomPicker";
import { Button, Field, Screen, useColors } from "../../../components/ui";
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
      const { confirm: ignored, ...payload } = form; void ignored;
      await register({ ...payload, name: form.name.trim(), phone: form.phone.trim(), email: form.email.trim().toLowerCase(), organization: form.organization.trim() || undefined });
      Toast.show({ type: "success", text1: "Account created", text2: "Sign in to continue" });
      router.replace("/(app)/(auth)/login");
    } catch (error) { Toast.show({ type: "error", text1: "Registration failed", text2: error.message }); }
    finally { setLoading(false); }
  };

  return <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.backgroundPrimary }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
    <Screen contentStyle={{ maxWidth: 520, paddingTop: 28, paddingBottom: 24 }}>
      <View style={{ alignItems: "center", marginBottom: 28 }}>
        <Image source={require("../../../assets/images/splash.png")} style={{ width: 68, height: 68, borderRadius: 17 }} />
        <Text style={{ color: colors.textPrimary, fontSize: 28, fontWeight: "800", marginTop: 16 }}>Create your account</Text>
        <Text style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 20, textAlign: "center", marginTop: 7 }}>Join SafePlate as a donor or NGO partner.</Text>
      </View>
      <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: "600", marginBottom: 7 }}>Account type</Text>
      <CustomPicker data={[{ label: "Food donor", value: "DONOR" }, { label: "NGO partner", value: "NGO" }]} value={form.role} onChange={(item) => update("role", item.value)} placeholder="Select account type" searchPlaceholder="" />
      <View style={{ height: 16 }} />
      <Field label="Full name *" value={form.name} onChangeText={(value) => update("name", value)} />
      <Field label="Phone *" value={form.phone} onChangeText={(value) => update("phone", value)} keyboardType="phone-pad" />
      <Field label="Email address *" value={form.email} onChangeText={(value) => update("email", value)} autoCapitalize="none" keyboardType="email-address" />
      <Field label="Organization" value={form.organization} onChangeText={(value) => update("organization", value)} placeholder="Optional for donors" />
      <Field label="Password *" value={form.password} onChangeText={(value) => update("password", value)} secureTextEntry />
      <Field label="Confirm password *" value={form.confirm} onChangeText={(value) => update("confirm", value)} secureTextEntry />
    </Screen>
    <View style={{ borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.backgroundPrimary, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16 }}>
      <View style={{ width: "100%", maxWidth: 520, alignSelf: "center" }}>
        <Button title="Create account" onPress={submit} loading={loading} />
        <Button title="Log in" variant="secondary" onPress={() => router.replace("/(app)/(auth)/login")} style={{ marginTop: 10 }} />
      </View>
    </View>
  </KeyboardAvoidingView>;
}
