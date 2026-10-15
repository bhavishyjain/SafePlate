import { Clock3, PackageOpen } from "lucide-react-native";
import { Text, View } from "react-native";
import { formatDateTime } from "../constants/domain";
import { StatusBadge, Surface, useColors } from "./ui";

export default function DonationCard({ donation, onPress }) {
  const colors = useColors();
  const title = donation.items?.map((item) => item.name).join(", ") || "Food donation";
  return <Surface onPress={onPress} accessibilityLabel={`View ${title}`} style={{ marginBottom: 10 }}>
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 }}><View style={{ flexDirection: "row", alignItems: "center", gap: 7, flex: 1 }}><PackageOpen size={15} color={colors.primary} /><Text style={{ color: colors.primary, fontSize: 12, fontWeight: "800" }}>{Number(donation.quantityKg || 0).toFixed(2)} kg</Text></View><StatusBadge status={donation.status} /></View>
    <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: "700", marginTop: 12 }} numberOfLines={1}>{title}</Text>
    <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8 }}><Clock3 size={13} color={colors.textSecondary} /><Text style={{ color: colors.textSecondary, fontSize: 12, marginLeft: 6 }} numberOfLines={1}>Pickup by {formatDateTime(donation.pickupDeadline)}</Text></View>
  </Surface>;
}
