import { useAppFonts } from "@/utils/context/fonts";
import { SettingsProvider } from "@/utils/context/settings";
import { ThemeProvider, useTheme } from "@/utils/context/theme";
import { LanguageProvider } from "@/utils/i18n/LanguageProvider";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo } from "react";
import { Platform, StatusBar as RNStatusBar, StyleSheet, View } from "react-native";
import Toast from "react-native-toast-message";
import { darkColors, lightColors } from "../colors";
import "../global.css";
import "../utils/i18n/config";

function AppContent() {
  const { colorScheme } = useTheme();

  const colors = useMemo(
    () => (colorScheme === "dark" ? darkColors : lightColors),
    [colorScheme],
  );

  const screenOptions = useMemo(
    () => ({
      headerShown: false,
      contentStyle: { backgroundColor: colors.backgroundPrimary },
      animation: "none",
    }),
    [colors.backgroundPrimary],
  );

  useEffect(() => {
    if (Platform.OS === "android") {
      RNStatusBar.setBarStyle(
        colorScheme === "dark" ? "light-content" : "dark-content",
        true,
      );
    }
  }, [colorScheme]);

  return (
    <View style={styles.container}>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      <Stack screenOptions={screenOptions} />
      <Toast position="bottom" />
    </View>
  );
}

export default function RootLayout() {
  useAppFonts();

  return (
    <ThemeProvider>
      <LanguageProvider>
        <SettingsProvider>
          <AppContent />
        </SettingsProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
