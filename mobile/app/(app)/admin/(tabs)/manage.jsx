import { router } from "expo-router";
import { Building2, Salad, Users } from "lucide-react-native";
import MenuItem from "../../../../components/MenuItem";
import { Screen, Title } from "../../../../components/ui";

export default function AdminManage() { return <Screen><Title subtitle="Manage platform access, NGO nutrition targets, and future food analysis.">Manage</Title><MenuItem icon={<Users />} title="Users" subtitle="Search accounts, change access, and revoke sessions" onPress={() => router.push("/(app)/admin/users")} /><MenuItem icon={<Building2 />} title="NGOs" subtitle="Review profiles and administer nutrition overrides" onPress={() => router.push("/(app)/admin/ngos")} /><MenuItem icon={<Salad />} title="Nutrition catalog" subtitle="Create, edit, activate, or deactivate food references" onPress={() => router.push("/(app)/admin/catalog")} /></Screen>; }
