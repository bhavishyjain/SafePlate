import { useState } from "react";
import { router } from "expo-router";
import Toast from "react-native-toast-message";
import { Button, Field, Screen, Title } from "../../../components/ui";
import { requestPasswordReset } from "../../../services/auth";

export default function ForgotPassword() {
  const [email, setEmail] = useState(""); const [loading, setLoading] = useState(false); const [sent, setSent] = useState(false);
  const submit = async () => { if (!email.includes("@")) return; setLoading(true); try { await requestPasswordReset(email.trim().toLowerCase()); setSent(true); } catch (error) { Toast.show({ type: "error", text1: "Request failed", text2: error.message }); } finally { setLoading(false); } };
  return <Screen contentStyle={{ flexGrow: 1, justifyContent: "center", maxWidth: 520, width: "100%", alignSelf: "center" }}><Title subtitle={sent ? "If an account exists for this email, a reset link has been sent." : "Enter your account email. We will send a reset link if the account exists."}>Reset password</Title>{!sent ? <><Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" /><Button title="Send reset link" onPress={submit} loading={loading} /></> : <Button title="Return to sign in" onPress={() => router.replace("/(app)/(auth)/login")} />}</Screen>;
}
