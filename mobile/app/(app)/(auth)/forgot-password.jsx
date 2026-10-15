import { useState } from "react";
import { Image, KeyboardAvoidingView, Platform, Text, View } from "react-native";
import { router } from "expo-router";
import { MailCheck } from "lucide-react-native";
import Toast from "react-native-toast-message";
import { Button, Field, Screen, Surface, useColors } from "../../../components/ui";
import { requestPasswordReset } from "../../../services/auth";

export default function ForgotPassword() {
  const colors = useColors();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const submit = async () => { if (!email.includes("@")) return Toast.show({ type: "error", text1: "Enter a valid email" }); setLoading(true); try { await requestPasswordReset(email.trim().toLowerCase()); setSent(true); } catch (error) { Toast.show({ type: "error", text1: "Request failed", text2: error.message }); } finally { setLoading(false); } };

  return <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.backgroundPrimary }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
    <Screen contentStyle={{ flexGrow: 1, justifyContent: "center", maxWidth: 520, paddingVertical: 36 }}>
      <View style={{ alignItems: "center", marginBottom: 28 }}>
        <Image source={require("../../../assets/images/splash.png")} style={{ width: 70, height: 70, borderRadius: 18 }} />
        <Text style={{ color: colors.textPrimary, fontSize: 28, fontWeight: "800", textAlign: "center", marginTop: 18 }}>{sent ? "Check your inbox" : "Reset your password"}</Text>
        <Text style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 20, textAlign: "center", marginTop: 7 }}>{sent ? "If an account matches that email, a reset link is on its way." : "Enter the email address connected to your account."}</Text>
      </View>
      {sent ? <Surface style={{ alignItems: "center", paddingVertical: 28 }}><MailCheck color={colors.success} size={34} /><Text style={{ color: colors.textPrimary, fontWeight: "700", marginTop: 14 }}>{email}</Text><Text style={{ color: colors.textSecondary, lineHeight: 19, textAlign: "center", marginTop: 6, marginBottom: 20 }}>Check your inbox and follow the secure link to continue.</Text><Button title="Return to sign in" onPress={() => router.replace("/(app)/(auth)/login")} style={{ width: "100%" }} /></Surface> : <><Field label="Email address" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="you@example.com" /><Button title="Send reset link" onPress={submit} loading={loading} /><Button title="Back to sign in" variant="secondary" onPress={() => router.back()} style={{ marginTop: 12 }} /></>}
    </Screen>
  </KeyboardAvoidingView>;
}
