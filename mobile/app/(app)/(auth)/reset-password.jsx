import { useState } from "react";
import { Image, KeyboardAvoidingView, Platform, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import Toast from "react-native-toast-message";
import { Button, Field, Screen, useColors } from "../../../components/ui";
import { resetPassword } from "../../../services/auth";

export default function ResetPassword() {
  const colors = useColors();
  const params = useLocalSearchParams();
  const [token, setToken] = useState(String(params.token || ""));
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = async () => { if (!token.trim()) return Toast.show({ type: "error", text1: "Reset token is required" }); if (password.length < 8 || password !== confirm) return Toast.show({ type: "error", text1: "Use matching passwords of at least 8 characters" }); setLoading(true); try { await resetPassword(token.trim(), password); Toast.show({ type: "success", text1: "Password reset" }); router.replace("/(app)/(auth)/login"); } catch (error) { Toast.show({ type: "error", text1: "Reset failed", text2: error.message }); } finally { setLoading(false); } };

  return <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.backgroundPrimary }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
    <Screen contentStyle={{ flexGrow: 1, justifyContent: "center", maxWidth: 520, paddingVertical: 36 }}>
      <View style={{ alignItems: "center", marginBottom: 28 }}>
        <Image source={require("../../../assets/images/splash.png")} style={{ width: 70, height: 70, borderRadius: 18 }} />
        <Text style={{ color: colors.textPrimary, fontSize: 28, fontWeight: "800", textAlign: "center", marginTop: 18 }}>Choose a new password</Text>
        <Text style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 20, textAlign: "center", marginTop: 7 }}>Use at least eight characters and avoid a password you use elsewhere.</Text>
      </View>
      <Field label="Reset token" value={token} onChangeText={setToken} autoCapitalize="none" />
      <Field label="New password" value={password} onChangeText={setPassword} secureTextEntry />
      <Field label="Confirm password" value={confirm} onChangeText={setConfirm} secureTextEntry />
      <Button title="Update password" onPress={submit} loading={loading} />
    </Screen>
  </KeyboardAvoidingView>;
}
