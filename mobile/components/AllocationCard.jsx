import { Text, View } from "react-native";
import { formatDateTime } from "../constants/domain";
import { StatusBadge, Surface, useColors } from "./ui";

export default function AllocationCard({ allocation, onPress }) {
  const colors = useColors(); const donation = allocation.donationId || {};
  return <Surface onPress={onPress} style={{ marginBottom: 12 }}><View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}><View style={{ flex: 1 }}><Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: "800" }} numberOfLines={1}>{donation.items?.map((item) => item.name).join(", ") || "Assigned donation"}</Text><Text style={{ color: colors.textSecondary, marginTop: 5 }}>{Number(donation.quantityKg || 0).toFixed(2)} kg · Due {formatDateTime(donation.pickupDeadline)}</Text></View><StatusBadge status={allocation.status} /></View></Surface>;
}
