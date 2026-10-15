import { useCallback, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import { ArrowRight, Building2 } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import AllocationCard from "../../../../components/AllocationCard";
import { Button, EmptyState, ErrorState, LoadingState, Screen, Surface, useColors } from "../../../../components/ui";
import { listAllocations } from "../../../../services/allocations";
import { getMyNgo, getNutritionStatus } from "../../../../services/ngos";
import { useAuth } from "../../../../utils/context/auth";

export default function NgoHome() {
  const colors = useColors();
  const { user } = useAuth();
  const [state, setState] = useState(null);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const load = useCallback(async () => { try { setError(null); const profile = await getMyNgo(); const [nutrition, allocations] = await Promise.all([getNutritionStatus(profile._id), listAllocations({ page: 1, limit: 20 })]); setState({ profile, nutrition, allocations }); } catch (requestError) { if (requestError.code === "NGO_NOT_FOUND") setState({ needsProfile: true }); else setError(requestError); } finally { setRefreshing(false); } }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  if (state?.needsProfile) return <Screen><View style={{ marginBottom: 24 }}><Text style={{ color: colors.textSecondary, fontSize: 14 }}>Welcome</Text><Text style={{ color: colors.textPrimary, fontSize: 30, fontWeight: "800", marginTop: 2 }}>{user?.name?.split(" ")[0] || "Partner"}</Text></View><Surface style={{ marginBottom: 14 }}><Building2 color={colors.primary} size={24} /><Text style={{ color: colors.textPrimary, fontWeight: "700", fontSize: 18, marginTop: 13 }}>Complete your NGO profile</Text><Text style={{ color: colors.textSecondary, lineHeight: 20, marginTop: 6 }}>Add your service area and beneficiary groups before receiving food assignments.</Text></Surface><Button title="Set up profile" onPress={() => router.push("/(app)/ngo/(tabs)/profile")} /></Screen>;
  const nutrition = state?.nutrition;
  const active = state?.allocations?.items?.filter((item) => ["ASSIGNED", "PICKED_UP"].includes(item.status)).slice(0, 3) || [];
  const calorieRatio = nutrition?.targetCalories ? Math.min(1, nutrition.deliveredCalories / nutrition.targetCalories) : 0;
  const proteinRatio = nutrition?.targetProtein ? Math.min(1, nutrition.deliveredProtein / nutrition.targetProtein) : 0;

  return <Screen refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }}>
    <View style={{ marginBottom: 24 }}><Text style={{ color: colors.textSecondary, fontSize: 14 }}>NGO dashboard</Text><Text style={{ color: colors.textPrimary, fontSize: 30, fontWeight: "800", marginTop: 2 }}>{user?.organization || user?.name?.split(" ")[0] || "Partner"}</Text><Text style={{ color: colors.textSecondary, fontSize: 14, marginTop: 3 }}>Daily needs and assignments in one place.</Text></View>
    {!state && !error ? <LoadingState /> : error ? <ErrorState message={error.message} onRetry={load} /> : <>
      <Surface style={{ marginBottom: 24 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}><View><Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: "700" }}>Today&apos;s nutrition</Text><Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 3 }}>Delivered against the daily target</Text></View><Pressable onPress={() => router.push("/(app)/ngo/nutrition")}><Text style={{ color: colors.primary, fontSize: 13, fontWeight: "700" }}>Details</Text></Pressable></View>
        {[{ label: "Calories", delivered: nutrition?.deliveredCalories || 0, target: nutrition?.targetCalories || 0, ratio: calorieRatio, suffix: " kcal" }, { label: "Protein", delivered: nutrition?.deliveredProtein || 0, target: nutrition?.targetProtein || 0, ratio: proteinRatio, suffix: " g" }].map((item) => <View key={item.label} style={{ marginTop: 18 }}><View style={{ flexDirection: "row", justifyContent: "space-between" }}><Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: "700" }}>{item.label}</Text><Text style={{ color: colors.textSecondary, fontSize: 12 }}>{item.delivered.toFixed(0)} / {item.target.toFixed(0)}{item.suffix}</Text></View><View style={{ height: 7, borderRadius: 7, backgroundColor: colors.backgroundDark, marginTop: 8, overflow: "hidden" }}><View style={{ height: "100%", width: `${item.ratio * 100}%`, backgroundColor: colors.primary, borderRadius: 7 }} /></View></View>)}
      </Surface>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}><Text style={{ color: colors.textPrimary, fontSize: 19, fontWeight: "800" }}>Needs attention</Text><Pressable onPress={() => router.push("/(app)/ngo/(tabs)/assignments")} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}><Text style={{ color: colors.primary, fontSize: 13, fontWeight: "700" }}>View all</Text><ArrowRight size={14} color={colors.primary} /></Pressable></View>
      {active.length ? active.map((allocation) => <AllocationCard key={allocation._id} allocation={allocation} onPress={() => router.push({ pathname: "/(app)/ngo/assignments/[id]", params: { id: allocation._id } })} />) : <EmptyState title="All caught up" message="New food assignments will appear here." />}
    </>}
  </Screen>;
}
