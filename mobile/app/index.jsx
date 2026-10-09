import { Redirect } from "expo-router";
import { ActivityIndicator, Image, View } from "react-native";
import { useAuth } from "../utils/context/auth";
import { useColors } from "../components/ui";

const homeFor = (role) => role === "NGO" ? "/(app)/ngo/(tabs)/home" : role === "ADMIN" ? "/(app)/admin/home" : "/(app)/donor/(tabs)/home";

export default function Index() {
  const { user, loading } = useAuth();
  const colors = useColors();
  if (!loading) return <Redirect href={user ? homeFor(user.role) : "/(app)/(auth)/login"} />;
  return <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.backgroundPrimary }}><Image source={require("../assets/images/splash.png")} style={{ width: 140, height: 140 }} /><ActivityIndicator color={colors.primary} style={{ marginTop: 18 }} /></View>;
}
