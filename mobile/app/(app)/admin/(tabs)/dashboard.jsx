import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { Text, View } from "react-native";
import { MetricGrid, WeightTrend } from "../../../../components/AdminWidgets";
import { Button, ErrorState, Field, FilterChips, LoadingState, Screen, Section, Surface, useColors } from "../../../../components/ui";
import { getDashboard } from "../../../../services/admin";

const indiaDay = (date) => { const parts = Object.fromEntries(new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date).filter((part) => part.type !== "literal").map((part) => [part.type, part.value])); return `${parts.year}-${parts.month}-${parts.day}`; };
const rangeFor = (preset) => { const now = new Date(); if (preset === "ALL") return {}; const days = Number(preset); return { from: indiaDay(new Date(now.getTime() - (days - 1) * 86400000)), to: indiaDay(now) }; };

export default function AdminDashboard() {
  const colors = useColors();
  const [preset, setPreset] = useState("7");
  const [custom, setCustom] = useState(rangeFor("7"));
  const [appliedRange, setAppliedRange] = useState(rangeFor("7"));
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const load = useCallback(async () => { try { setError(null); setData(await getDashboard(appliedRange)); } catch (requestError) { setError(requestError); } finally { setRefreshing(false); } }, [appliedRange]);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  const selectPreset = (value) => { setPreset(value); if (value !== "CUSTOM") setAppliedRange(rangeFor(value)); };

  return <Screen refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }}>
    <View style={{ marginBottom: 20 }}><Text style={{ color: colors.textSecondary, fontSize: 14 }}>Platform overview</Text><Text style={{ color: colors.textPrimary, fontSize: 30, fontWeight: "800", marginTop: 2 }}>Dashboard</Text><Text style={{ color: colors.textSecondary, fontSize: 14, marginTop: 3 }}>Food movement and fulfilment performance.</Text></View>
    <FilterChips value={preset} onChange={selectPreset} values={[{ label: "7 days", value: "7" }, { label: "30 days", value: "30" }, { label: "All time", value: "ALL" }, { label: "Custom", value: "CUSTOM" }]} />
    {preset === "CUSTOM" ? <Surface style={{ marginBottom: 16 }}><Field label="From (YYYY-MM-DD)" value={custom.from} onChangeText={(from) => setCustom((current) => ({ ...current, from }))} /><Field label="To (YYYY-MM-DD)" value={custom.to} onChangeText={(to) => setCustom((current) => ({ ...current, to }))} /><Button title="Apply date range" onPress={() => setAppliedRange({ ...custom })} /></Surface> : null}
    {!data && !error ? <LoadingState label="Loading dashboard…" /> : error ? <ErrorState message={error.message} onRetry={() => load()} /> : <>
      <Surface style={{ marginBottom: 24 }}>
        <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: "700" }}>Food snapshot</Text>
        <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 3, marginBottom: 13 }}>Weight recorded in the selected range</Text>
        <View style={{ flexDirection: "row", gap: 8 }}>{[
          { label: "Donated", value: `${data.kgDonated.toFixed(1)} kg` },
          { label: "Assigned", value: `${data.kgAssigned.toFixed(1)} kg` },
          { label: "Delivered", value: `${data.kgDelivered.toFixed(1)} kg` },
        ].map((item) => <View key={item.label} style={{ flex: 1, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.backgroundPrimary, paddingHorizontal: 11, paddingVertical: 11 }}><Text style={{ color: colors.textSecondary, fontSize: 11 }}>{item.label}</Text><Text adjustsFontSizeToFit numberOfLines={1} style={{ color: colors.textPrimary, fontSize: 19, fontWeight: "800", marginTop: 4 }}>{item.value}</Text></View>)}</View>
      </Surface>
      <Section title="Operations"><MetricGrid metrics={[{ label: "NGOs served", value: data.ngosServed }, { label: "Delivery success", value: `${(data.deliverySuccessRate * 100).toFixed(0)}%`, tone: "success" }, { label: "Awaiting match", value: data.unmatchedDonations, tone: "warning" }, { label: "Discarded", value: `${data.kgDiscarded.toFixed(1)} kg`, tone: "danger" }]} /></Section>
      <Section title="Over time">{data.dailyTrend.length ? <WeightTrend data={data.dailyTrend} /> : <Surface><Text style={{ color: colors.textSecondary }}>No activity in this date range.</Text></Surface>}</Section>
    </>}
  </Screen>;
}
