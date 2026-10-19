import { useState } from "react";
import { Image, KeyboardAvoidingView, Platform, Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import Toast from "react-native-toast-message";
import LanguagePicker from "../../../components/LanguagePicker";
import { Button, Field, Screen, useColors } from "../../../components/ui";
import { useAuth } from "../../../utils/context/auth";
import { useTranslation } from "../../../utils/i18n/LanguageProvider";
export default function Login() {
  const {
    tr
  } = useTranslation();
  const colors = useColors();
  const {
    login
  } = useAuth();
  const [form, setForm] = useState({
    email: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);
  const submit = async () => {
    if (!form.email.trim() || !form.password) return Toast.show({
      type: "error",
      text1: tr("Enter your email and password")
    });
    setLoading(true);
    try {
      await login({
        ...form,
        email: form.email.trim().toLowerCase()
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: tr("Sign in failed"),
        text2: error.message
      });
    } finally {
      setLoading(false);
    }
  };
  return <KeyboardAvoidingView style={{
    flex: 1,
    backgroundColor: colors.backgroundPrimary
  }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
    <Screen contentStyle={{
      flexGrow: 1,
      justifyContent: "center",
      maxWidth: 520,
      paddingTop: 28,
      paddingBottom: 20
    }}>
      <View style={{
        alignItems: "center",
        marginBottom: 30
      }}>
        <Image source={require("../../../assets/images/splash.png")} style={{
          width: 82,
          height: 82,
          borderRadius: 20
        }} />
        <Text style={{
          color: colors.textPrimary,
          fontSize: 30,
          fontWeight: "800",
          marginTop: 18
        }}>{tr("Welcome back")}</Text>
        <Text style={{
          color: colors.textSecondary,
          fontSize: 14,
          lineHeight: 20,
          textAlign: "center",
          marginTop: 7
        }}>{tr("Sign in to manage food donations and deliveries.")}</Text>
      </View>
      <Field label={tr("Email address")} value={form.email} onChangeText={email => setForm(current => ({
        ...current,
        email
      }))} keyboardType="email-address" autoCapitalize="none" autoComplete="email" placeholder={tr("you@example.com")} />
      <Field label={tr("Password")} value={form.password} onChangeText={password => setForm(current => ({
        ...current,
        password
      }))} secureTextEntry autoComplete="password" placeholder={tr("Enter your password")} />
      <Pressable accessibilityRole="button" onPress={() => router.push("/(app)/(auth)/forgot-password")} style={{
        alignSelf: "flex-end"
      }}><Text style={{
          color: colors.primary,
          fontWeight: "700",
          fontSize: 13
        }}>{tr("Forgot password?")}</Text></Pressable>
      <View style={{
        width: "100%",
        marginTop: 24
      }}>
        <Button title={tr("Login")} loading={loading} onPress={submit} style={{
          width: "100%"
        }} />
        <Button title={tr("Create an account")} variant="secondary" disabled={loading} onPress={() => router.push("/(app)/(auth)/register")} style={{
          width: "100%",
          marginTop: 10
        }} />
      </View>
      <View style={{
        marginTop: 26
      }}><LanguagePicker /></View>
    </Screen>
  </KeyboardAvoidingView>;
}
