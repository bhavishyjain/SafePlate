import { useCallback, useMemo, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import { Text, View } from "react-native";
import { Button, ErrorState, LoadingState, Screen, Surface, Title, useColors } from "../../../../components/ui";
import DonationCard from "../../../../components/DonationCard";
import { listDonations } from "../../../../services/donations";
import { useAuth } from "../../../../utils/context/auth";

export default function DonorHome() {
  const colors = useColors(); const { user } = useAuth(); const [data, setData] = useState(null); const [error, setError] = useState(null); const [refreshing, setRefreshing] = useState(false);
  const load = useCallback(async () => { try { setError(null); setData(await listDonations({ page: 1, limit: 100 })); } catch (requestError) { setError(requestError); } finally { setRefreshing(false); } }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  const counts = useMemo(() => (data?.items || []).reduce((map, item) => ({ ...map, [item.status]: (map[item.status] || 0) + 1 }), {}), [data]);
  const active = data?.items?.find((item) => ["PENDING", "ASSIGNED", "PICKED_UP"].includes(item.status));
  if (!data && !error) return <Screen><LoadingState /></Screen>;
  return <Screen refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }}><Title subtitle="Track food from submission through delivery.">Hello, {user?.name?.split(" ")[0] || "Donor"}</Title>{error ? <ErrorState message={error.message} onRetry={load} /> : <><View style={{ flexDirection: "row", gap: 10, marginBottom: 18 }}>{[{ label: "Pending", value: counts.PENDING || 0 }, { label: "Delivered", value: counts.DELIVERED || 0 }, { label: "Total", value: data.pagination?.total || 0 }].map((metric) => <Surface key={metric.label} style={{ flex: 1, alignItems: "center", paddingHorizontal: 8 }}><Text style={{ color: colors.primary, fontSize: 24, fontWeight: "900" }}>{metric.value}</Text><Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }}>{metric.label}</Text></Surface>)}</View><Button title="Donate food" onPress={() => router.push("/(app)/donor/(tabs)/donate")} style={{ marginBottom: 22 }} />{active ? <><Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: "800", marginBottom: 10 }}>Active donation</Text><DonationCard donation={active} onPress={() => router.push({ pathname: "/(app)/donor/donations/[id]", params: { id: active._id } })} /></> : <Surface><Text style={{ color: colors.textPrimary, fontWeight: "700" }}>No active donation</Text><Text style={{ color: colors.textSecondary, marginTop: 6 }}>Your next donation will appear here.</Text></Surface>}</>}</Screen>;
}
