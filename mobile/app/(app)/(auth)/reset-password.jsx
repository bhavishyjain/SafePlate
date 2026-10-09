import { useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import Toast from "react-native-toast-message";
import { Button, Field, Screen, Title } from "../../../components/ui";
import { resetPassword } from "../../../services/auth";

export default function ResetPassword() {
  const params = useLocalSearchParams(); const [token, setToken] = useState(String(params.token || "")); const [password, setPassword] = useState(""); const [confirm, setConfirm] = useState(""); const [loading, setLoading] = useState(false);
  const submit = async () => { if (!token.trim()) return Toast.show({ type: "error", text1: "Reset token is required" }); if (password.length < 8 || password !== confirm) return Toast.show({ type: "error", text1: "Use matching passwords of at least 8 characters" }); setLoading(true); try { await resetPassword(token.trim(), password); Toast.show({ type: "success", text1: "Password reset" }); router.replace("/(app)/(auth)/login"); } catch (error) { Toast.show({ type: "error", text1: "Reset failed", text2: error.message }); } finally { setLoading(false); } };
  return <Screen contentStyle={{ flexGrow: 1, justifyContent: "center", maxWidth: 520, width: "100%", alignSelf: "center" }}><Title subtitle="Set a new password for your account.">Choose a new password</Title><Field label="Reset token" value={token} onChangeText={setToken} autoCapitalize="none" /><Field label="New password" value={password} onChangeText={setPassword} secureTextEntry /><Field label="Confirm password" value={confirm} onChangeText={setConfirm} secureTextEntry /><Button title="Reset password" onPress={submit} loading={loading} /></Screen>;
}
