import { Text, View } from "react-native";
import { formatDateTime } from "../constants/domain";
import { StatusBadge, Surface, useColors } from "./ui";

export default function DonationCard({ donation, onPress }) {
  const colors = useColors();
  return <Surface onPress={onPress} style={{ marginBottom: 12 }}><View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}><View style={{ flex: 1 }}><Text style={{ color: colors.textPrimary, fontSize: 17, fontWeight: "800" }} numberOfLines={1}>{donation.items?.map((item) => item.name).join(", ") || "Food donation"}</Text><Text style={{ color: colors.textSecondary, marginTop: 5 }}>{Number(donation.quantityKg || 0).toFixed(2)} kg · Pickup by {formatDateTime(donation.pickupDeadline)}</Text></View><StatusBadge status={donation.status} /></View></Surface>;
}
