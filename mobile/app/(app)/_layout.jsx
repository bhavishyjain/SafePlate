import { Redirect, Stack, useSegments } from "expo-router";
import { ActivityIndicator, Platform, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColors } from "../../components/ui";
import { useAuth } from "../../utils/context/auth";
import { canAccessRoleRoute, homeForRole, roleForSegments } from "../../constants/routing";

export default function AppLayout() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const colors = useColors();
  const inAuth = segments.includes("(auth)");
  const requestedRole = roleForSegments(segments);

  if (loading) return <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.backgroundPrimary }}><ActivityIndicator color={colors.primary} /></View>;
  if (!user && !inAuth) return <Redirect href="/(app)/(auth)/login" />;
  if (user && inAuth) return <Redirect href={homeForRole(user.role)} />;
  if (user && requestedRole && !canAccessRoleRoute(user.role, segments)) return <Redirect href={homeForRole(user.role)} />;

  return <GestureHandlerRootView style={{ flex: 1 }}><SafeAreaView style={{ flex: 1, backgroundColor: colors.backgroundPrimary }} edges={Platform.OS === "ios" ? ["top"] : ["top", "bottom"]}><Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.backgroundPrimary } }} /></SafeAreaView></GestureHandlerRootView>;
}
