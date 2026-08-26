import { useRootNavigationState, useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, Image, View } from "react-native";
import { darkColors, lightColors } from "@/colors";
import { useTheme } from "@/utils/context/theme";
import getUserAuth from "../utils/userAuth";

export default function Index() {
  const router = useRouter();
  const navigationState = useRootNavigationState();
  const { colorScheme } = useTheme();
  const colors = colorScheme === "dark" ? darkColors : lightColors;

  useEffect(() => {
    if (!navigationState?.key) return;

    const checkUser = async () => {
      try {
        const user = await getUserAuth();
        if (user && user.auth_token) {
          router.replace("/(app)/(tabs)/home");
        } else {
          router.replace("/(app)/(auth)/login");
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        router.replace("/(app)/(auth)/login");
      }
    };

    checkUser();
  }, [navigationState?.key]);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: colors.backgroundPrimary,
      }}
    >
      <Image
        source={require("../assets/images/splash.png")}
        style={{ width: 150, height: 150, resizeMode: "contain" }}
      />
      <ActivityIndicator
        size="small"
        color={colors.primary}
        style={{ marginTop: 20 }}
      />
    </View>
  );
}
