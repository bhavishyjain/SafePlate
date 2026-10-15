import { router } from "expo-router";
import { Building2, Salad, Users } from "lucide-react-native";
import { Text, View } from "react-native";
import MenuItem from "../../../../components/MenuItem";
import { Screen, useColors } from "../../../../components/ui";

export default function AdminManage() {
  const colors = useColors();
  return <Screen>
    <View style={{ marginBottom: 24 }}><Text style={{ color: colors.textSecondary, fontSize: 14 }}>Platform settings</Text><Text style={{ color: colors.textPrimary, fontSize: 30, fontWeight: "800", marginTop: 2 }}>Manage</Text><Text style={{ color: colors.textSecondary, fontSize: 14, marginTop: 3 }}>Accounts, partners, and nutrition data.</Text></View>
    <MenuItem icon={<Users />} title="Users" subtitle="Search accounts, change access, and revoke sessions" onPress={() => router.push("/(app)/admin/users")} />
    <MenuItem icon={<Building2 />} title="NGOs" subtitle="Review profiles and nutrition overrides" onPress={() => router.push("/(app)/admin/ngos")} />
    <MenuItem icon={<Salad />} title="Nutrition catalog" subtitle="Manage the food reference catalog" onPress={() => router.push("/(app)/admin/catalog")} />
  </Screen>;
}
