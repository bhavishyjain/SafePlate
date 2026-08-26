import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { TextInput as PaperTextInput } from "react-native-paper";
import Toast from "react-native-toast-message";
import { darkColors, lightColors } from "../../../colors";
import LanguagePicker from "../../../components/LanguagePicker";
import { LOGIN_URL } from "../../../url";
import apiCall from "../../../utils/api";
import { useTheme } from "../../../utils/context/theme";
import { useTranslation } from "../../../utils/i18n/LanguageProvider";
import { setUserAuth } from "../../../utils/userAuth";

export default function Login() {
  const { colorScheme } = useTheme();
  const colors = colorScheme === "dark" ? darkColors : lightColors;

  const router = useRouter();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("DONOR"); // DONOR | NGO | ADMIN
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const userData = await AsyncStorage.getItem("user");
      if (
        userData &&
        userData !== "undefined" &&
        JSON.parse(userData)?.auth_token
      ) {
        router.replace("/(app)/(tabs)/home");
      }
    };
    checkAuth();
  }, []);

  const handleLogin = async () => {
    Keyboard.dismiss();
    if (!email || !password) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Please fill in all fields",
      });
      return;
    }

    try {
      setLoading(true);
      const response = await apiCall({
        method: "POST",
        url: LOGIN_URL,
        data: {
          email: email.trim(),
          password,
          role,
        },
      });

      if (response?.data && response.data.auth_token) {
        await setUserAuth(response.data);
        Toast.show({
          type: "success",
          text1: "Success",
          text2: `Welcome back, ${response.data.name}!`,
        });
        router.replace("/(app)/(tabs)/home");
      }
    } catch (error) {
      console.error("Login error:", error);
      Toast.show({
        type: "error",
        text1: "Login Failed",
        text2: error?.response?.data?.message || "Invalid credentials or role",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAwareScrollView
      style={{ flex: 1, backgroundColor: colors.backgroundPrimary }}
      contentContainerStyle={{
        paddingHorizontal: 24,
        paddingVertical: 60,
        flexGrow: 1,
        justifyContent: "center",
      }}
      keyboardShouldPersistTaps="handled"
      enableOnAndroid={true}
      extraScrollHeight={20}
      showsVerticalScrollIndicator={false}
    >
      <View className="items-center w-full">
        <Text
          className="text-4xl font-bold mb-2 text-center"
          style={{ color: colors.primary }}
        >
          SafePlate
        </Text>
        <Text
          className="text-sm mb-8 text-center"
          style={{ color: colors.textSecondary }}
        >
          Nutrition- & Spoilage-Aware Food Redistribution
        </Text>

        {/* Role Selector Buttons */}
        <View className="flex-row w-full mb-6 gap-2">
          {["DONOR", "NGO", "ADMIN"].map((r) => (
            <TouchableOpacity
              key={r}
              onPress={() => setRole(r)}
              className="flex-1 py-2.5 rounded-lg border items-center justify-center"
              style={{
                backgroundColor: role === r ? colors.primary : colors.backgroundSecondary,
                borderColor: role === r ? colors.primary : colors.muted,
              }}
            >
              <Text
                className="text-xs font-bold"
                style={{ color: role === r ? colors.dark : colors.textPrimary }}
              >
                {r}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Email Input */}
        <View
          className="flex-row items-center w-full rounded-lg px-4 mb-4 h-[50px]"
          style={{
            backgroundColor: colors.backgroundSecondary,
            borderWidth: 1,
            borderColor: colors.muted,
          }}
        >
          <PaperTextInput
            mode="flat"
            value={email}
            onChangeText={setEmail}
            placeholder="Email Address"
            placeholderTextColor={colors.placeholder}
            keyboardType="email-address"
            style={{ flex: 1, backgroundColor: "transparent" }}
            underlineStyle={{ display: "none" }}
            contentStyle={{
              color: colors.textPrimary,
              fontSize: 16,
              paddingHorizontal: 0,
            }}
            theme={{ colors: { text: colors.textPrimary } }}
          />
        </View>

        {/* Password Input */}
        <View
          className="flex-row items-center w-full rounded-lg px-4 mb-6 h-[50px]"
          style={{
            backgroundColor: colors.backgroundSecondary,
            borderWidth: 1,
            borderColor: colors.muted,
          }}
        >
          <PaperTextInput
            mode="flat"
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor={colors.placeholder}
            secureTextEntry
            style={{ flex: 1, backgroundColor: "transparent" }}
            underlineStyle={{ display: "none" }}
            contentStyle={{
              color: colors.textPrimary,
              fontSize: 16,
              paddingHorizontal: 0,
            }}
            theme={{ colors: { text: colors.textPrimary } }}
          />
        </View>

        {/* Login Button */}
        <TouchableOpacity
          className="w-full py-4 rounded-lg items-center mb-6"
          style={{
            backgroundColor: colors.primary,
            opacity: loading ? 0.6 : 1,
          }}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.dark} />
          ) : (
            <Text
              className="text-base font-bold"
              style={{ color: colors.dark }}
            >
              Sign In
            </Text>
          )}
        </TouchableOpacity>

        {/* Language Selector */}
        <LanguagePicker />
      </View>
    </KeyboardAwareScrollView>
  );
}
