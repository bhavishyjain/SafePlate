import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { Text, View } from "react-native";
import { MetricGrid, WeightTrend } from "../../../../components/AdminWidgets";
import { Button, ErrorState, Field, FilterChips, LoadingState, Screen, Surface, Title, useColors } from "../../../../components/ui";
import { getDashboard } from "../../../../services/admin";

const iso = (date) => date.toISOString().slice(0, 10);
const rangeFor = (preset) => { const now = new Date(); if (preset === "ALL") return {}; const days = Number(preset); return { from: iso(new Date(now.getTime() - (days - 1) * 86400000)), to: iso(now) }; };

export default function AdminDashboard() {
  const colors = useColors(); const [preset, setPreset] = useState("7"); const [custom, setCustom] = useState(rangeFor("7")); const [data, setData] = useState(null); const [error, setError] = useState(null); const [refreshing, setRefreshing] = useState(false);
  const load = useCallback(async (params = preset === "CUSTOM" ? custom : rangeFor(preset)) => { try { setError(null); setData(await getDashboard(params)); } catch (requestError) { setError(requestError); } finally { setRefreshing(false); } }, [preset, custom]);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  const selectPreset = (value) => { setPreset(value); if (value !== "CUSTOM") load(rangeFor(value)); };
  return <Screen refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }}><Title subtitle="Monitor redistribution outcomes across SafePlate.">Admin dashboard</Title><FilterChips value={preset} onChange={selectPreset} values={[{ label: "7 days", value: "7" }, { label: "30 days", value: "30" }, { label: "All time", value: "ALL" }, { label: "Custom", value: "CUSTOM" }]} />{preset === "CUSTOM" ? <Surface style={{ marginBottom: 16 }}><View style={{ flexDirection: "row", gap: 10 }}><Field label="From (YYYY-MM-DD)" value={custom.from} onChangeText={(from) => setCustom((current) => ({ ...current, from }))} style={{ flex: 1 }} /><Field label="To (YYYY-MM-DD)" value={custom.to} onChangeText={(to) => setCustom((current) => ({ ...current, to }))} style={{ flex: 1 }} /></View><Button title="Apply date range" onPress={() => load(custom)} /></Surface> : null}{!data && !error ? <LoadingState label="Loading dashboard…" /> : error ? <ErrorState message={error.message} onRetry={load} /> : <><MetricGrid metrics={[{ label: "Donated", value: `${data.kgDonated.toFixed(1)} kg` }, { label: "Assigned", value: `${data.kgAssigned.toFixed(1)} kg`, tone: "info" }, { label: "Delivered", value: `${data.kgDelivered.toFixed(1)} kg`, tone: "success" }, { label: "Discarded", value: `${data.kgDiscarded.toFixed(1)} kg`, tone: "danger" }, { label: "NGOs served", value: data.ngosServed }, { label: "Unmatched", value: data.unmatchedDonations, tone: "warning" }, { label: "Delivery success", value: `${(data.deliverySuccessRate * 100).toFixed(0)}%` }]} /><WeightTrend data={data.dailyTrend} />{!data.dailyTrend.length ? <Surface><Text style={{ color: colors.textSecondary }}>No activity exists for this date range.</Text></Surface> : null}</>}</Screen>;
}
