import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { darkColors, lightColors } from "../../../colors";
import { useTheme } from "../../../utils/context/theme";
import { useTranslation } from "../../../utils/i18n/LanguageProvider";
import getUserAuth from "../../../utils/userAuth";

export default function Home() {
  const { t } = useTranslation();
  const { colorScheme } = useTheme();
  const colors = colorScheme === "dark" ? darkColors : lightColors;
  const [user, setUser] = useState(null);

  useEffect(() => {
    (async () => {
      const authUser = await getUserAuth();
      setUser(authUser);
    })();
  }, []);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.backgroundPrimary },
      ]}
    >
      <View style={[styles.card, { backgroundColor: colors.backgroundSecondary }]}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          {t("common.welcome", { defaultValue: "Welcome to SafePlate" })}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {user ? `Logged in as: ${user.name} (${user.role})` : "Please log in to continue"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
  },
});
