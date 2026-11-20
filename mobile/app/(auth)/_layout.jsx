import { Redirect, Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { homeForRole } from "../../constants/routing";
import { useColors } from "../../components/ui";
import { useAuth } from "../../utils/context/auth";

export default function AuthLayout() {
  const { user, loading } = useAuth();
  const colors = useColors();
  if (loading) return <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.backgroundPrimary }}><ActivityIndicator color={colors.primary} /></View>;
  if (user) return <Redirect href={homeForRole(user.role)} />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
