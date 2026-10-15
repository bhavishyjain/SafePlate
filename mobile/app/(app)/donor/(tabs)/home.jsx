import { useCallback, useMemo, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import { ArrowRight, Plus } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import DonationCard from "../../../../components/DonationCard";
import { Button, EmptyState, ErrorState, LoadingState, Screen, Surface, useColors } from "../../../../components/ui";
import { listDonations } from "../../../../services/donations";
import { useAuth } from "../../../../utils/context/auth";

export default function DonorHome() {
  const colors = useColors();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const load = useCallback(async () => { try { setError(null); setData(await listDonations({ page: 1, limit: 100 })); } catch (requestError) { setError(requestError); } finally { setRefreshing(false); } }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  const counts = useMemo(() => (data?.items || []).reduce((map, item) => ({ ...map, [item.status]: (map[item.status] || 0) + 1 }), {}), [data]);
  const active = data?.items?.filter((item) => ["PENDING", "ASSIGNED", "PICKED_UP"].includes(item.status)).slice(0, 3) || [];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return <Screen refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }}>
    <View style={{ marginBottom: 24 }}><Text style={{ color: colors.textSecondary, fontSize: 14, fontWeight: "500" }}>{greeting}</Text><Text style={{ color: colors.textPrimary, fontSize: 30, fontWeight: "800", marginTop: 2 }}>{user?.name?.split(" ")[0] || "Donor"}</Text><Text style={{ color: colors.textSecondary, fontSize: 14, marginTop: 3 }}>Here is what is happening with your food donations.</Text></View>
    {!data && !error ? <LoadingState /> : error ? <ErrorState message={error.message} onRetry={load} /> : <>
      <Surface style={{ marginBottom: 18 }}>
        <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: "700" }}>Donation snapshot</Text>
        <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 3, marginBottom: 13 }}>All contributions linked to your account</Text>
        <View style={{ flexDirection: "row", gap: 8 }}>{[
          { label: "Total", value: data.pagination?.total || 0 },
          { label: "Active", value: (counts.PENDING || 0) + (counts.ASSIGNED || 0) + (counts.PICKED_UP || 0) },
          { label: "Delivered", value: counts.DELIVERED || 0 },
        ].map((item) => <View key={item.label} style={{ flex: 1, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.backgroundPrimary, paddingHorizontal: 12, paddingVertical: 11 }}><Text style={{ color: colors.textSecondary, fontSize: 11 }}>{item.label}</Text><Text style={{ color: colors.textPrimary, fontSize: 21, fontWeight: "800", marginTop: 3 }}>{item.value}</Text></View>)}</View>
      </Surface>
      <Button title="Donate food" icon={Plus} onPress={() => router.push("/(app)/donor/(tabs)/donate")} style={{ marginBottom: 26 }} />
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}><Text style={{ color: colors.textPrimary, fontSize: 19, fontWeight: "800" }}>In progress</Text><Pressable onPress={() => router.push("/(app)/donor/(tabs)/donations")} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}><Text style={{ color: colors.primary, fontSize: 13, fontWeight: "700" }}>View all</Text><ArrowRight size={14} color={colors.primary} /></Pressable></View>
      {active.length ? active.map((donation) => <DonationCard key={donation._id} donation={donation} onPress={() => router.push({ pathname: "/(app)/donor/donations/[id]", params: { id: donation._id } })} />) : <EmptyState title="No active donations" message="Your next donation will appear here after you submit it." />}
    </>}
  </Screen>;
}
