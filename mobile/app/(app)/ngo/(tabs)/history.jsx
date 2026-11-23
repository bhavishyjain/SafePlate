import { useCallback, useMemo, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import { Archive, CheckCircle2 } from "lucide-react-native";
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from "react-native";
import AllocationCard from "../../../../components/AllocationCard";
import PressableBlock from "../../../../components/PressableBlock";
import { darkColors, lightColors } from "../../../../colors";
import { labelFor } from "../../../../constants/domain";
import { listAllocations } from "../../../../services/allocations";
import { useTheme } from "../../../../utils/context/theme";
import { useTranslation } from "../../../../utils/i18n/LanguageProvider";

const FILTERS = ["", "DELIVERED", "REJECTED", "CANCELLED"];
const toneFor = (status, colors) => ({
  DELIVERED: colors.success,
  REJECTED: colors.danger,
  CANCELLED: colors.muted
})[status] || colors.primary;

export default function DeliveryHistory() {
  const { tr } = useTranslation();
  const { colorScheme } = useTheme();
  const colors = colorScheme === "dark" ? darkColors : lightColors;
  const [status, setStatus] = useState("");
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const load = useCallback(async () => {
    try {
      setError(null);
      setData(await listAllocations({ page: 1, limit: 100 }));
    } catch (requestError) {
      setError(requestError);
    } finally {
      setRefreshing(false);
    }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  const items = useMemo(() => (data?.items || [])
    .filter(item => ["DELIVERED", "REJECTED", "CANCELLED"].includes(item.status))
    .filter(item => !status || item.status === status)
    .sort((a, b) => new Date(b.deliveredAt || b.updatedAt) - new Date(a.deliveredAt || a.updatedAt)), [data, status]);

  return <ScrollView style={{ flex: 1, backgroundColor: colors.backgroundPrimary }} contentContainerStyle={{
    width: "100%", maxWidth: 820, alignSelf: "center", paddingHorizontal: 16, paddingTop: 28, paddingBottom: 132
  }} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {
    setRefreshing(true);
    load();
  }} colors={[colors.primary]} tintColor={colors.primary} />}>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 16, paddingBottom: 20 }}>
      {FILTERS.map(value => {
        const selected = value === status;
        const tone = toneFor(value, colors);
        return <PressableBlock key={value || "all"} onPress={() => setStatus(value)} style={{
          minHeight: 40, justifyContent: "center", paddingHorizontal: 14, borderRadius: 999,
          borderWidth: 1, borderColor: selected ? tone : `${tone}66`, backgroundColor: selected ? tone : `${tone}14`
        }}><Text style={{ color: selected ? colors.onPrimary : tone, fontSize: 12, fontWeight: "600" }}>
          {value ? tr(labelFor(value)) : tr("All")}
        </Text></PressableBlock>;
      })}
    </ScrollView>
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 11 }}>
      <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: "500" }}>{tr("Completed collections")}</Text>
      <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{tr("{{count}} results", { count: items.length })}</Text>
    </View>
    {!data && !error ? <View style={{ paddingVertical: 48, alignItems: "center" }}><ActivityIndicator size="large" color={colors.primary} /></View>
      : error ? <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 20 }}>
        <Text style={{ color: colors.textPrimary, fontWeight: "600" }}>{tr("Couldn’t load assignments")}</Text>
        <PressableBlock onPress={load} style={{ alignSelf: "flex-start", marginTop: 14 }}><Text style={{ color: colors.primary, fontWeight: "600" }}>{tr("Try again")}</Text></PressableBlock>
      </View>
      : items.length ? items.map(allocation => <AllocationCard key={allocation._id} allocation={allocation} onPress={() => router.push({ pathname: "/(app)/ngo/assignments/[id]", params: { id: allocation._id } })} />)
        : <View style={{ alignItems: "center", borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 30 }}>
          {status === "DELIVERED" ? <CheckCircle2 size={28} color={colors.success} /> : <Archive size={28} color={colors.textSecondary} />}
          <Text style={{ color: colors.textPrimary, fontWeight: "600", marginTop: 12 }}>{tr("No completed assignments")}</Text>
        </View>}
  </ScrollView>;
}
