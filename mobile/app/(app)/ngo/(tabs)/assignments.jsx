import { useCallback, useMemo, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import { ArrowDownUp, Inbox, Search } from "lucide-react-native";
import { ActivityIndicator, RefreshControl, ScrollView, Text, TextInput, View } from "react-native";
import AllocationCard from "../../../../components/AllocationCard";
import PressableBlock from "../../../../components/PressableBlock";
import { darkColors, lightColors } from "../../../../colors";
import { labelFor } from "../../../../constants/domain";
import { listAllocations } from "../../../../services/allocations";
import { useTheme } from "../../../../utils/context/theme";
import { useTranslation } from "../../../../utils/i18n/LanguageProvider";
const statusTone = (status, colors) => ({
  ASSIGNED: colors.info,
  PICKED_UP: colors.warning,
  DELIVERED: colors.success,
  REJECTED: colors.danger,
  CANCELLED: colors.muted
})[status] || colors.primary;
const ACTIVE_STATUSES = ["ASSIGNED", "PICKED_UP"];
export default function Assignments() {
  const {
    tr
  } = useTranslation();
  const {
    colorScheme
  } = useTheme();
  const colors = colorScheme === "dark" ? darkColors : lightColors;
  const [status, setStatus] = useState("");
  const [query, setQuery] = useState("");
  const [oldestFirst, setOldestFirst] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const load = useCallback(async () => {
    try {
      setError(null);
      setData(await listAllocations({
        page: 1,
        limit: 100
      }));
    } catch (requestError) {
      setError(requestError);
    } finally {
      setRefreshing(false);
    }
  }, []);
  useFocusEffect(useCallback(() => {
    load();
  }, [load]));
  const items = useMemo(() => {
    const search = query.trim().toLowerCase();
    return [...(data?.items || [])].filter(item => ACTIVE_STATUSES.includes(item.status)).filter(item => !status || item.status === status).filter(item => !search || item.donationId?.items?.some(food => food.name.toLowerCase().includes(search))).sort((a, b) => (new Date(a.assignedAt || a.createdAt) - new Date(b.assignedAt || b.createdAt)) * (oldestFirst ? 1 : -1));
  }, [data, oldestFirst, query, status]);
  return <ScrollView style={{
    flex: 1,
    backgroundColor: colors.backgroundPrimary
  }} contentContainerStyle={{
    width: "100%",
    maxWidth: 820,
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingTop: 28,
    paddingBottom: 132
  }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {
    setRefreshing(true);
    load();
  }} colors={[colors.primary]} tintColor={colors.primary} />}>
    <View style={{
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 13
    }}>
      <View style={{
        flex: 1,
        height: 48,
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 13,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.backgroundSecondary,
        paddingHorizontal: 14
      }}><Search size={18} color={colors.textSecondary} /><TextInput value={query} onChangeText={setQuery} placeholder={tr("Search food assignments")} placeholderTextColor={colors.placeholder} selectionColor={colors.primary} style={{
          flex: 1,
          height: "100%",
          color: colors.textPrimary,
          fontSize: 14,
          marginLeft: 10,
          outlineStyle: "none"
        }} /></View>
      <PressableBlock onPress={() => setOldestFirst(current => !current)} accessibilityLabel={tr("Change sort order")} style={{
        width: 48,
        height: 48,
        borderRadius: 13,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.backgroundSecondary,
        alignItems: "center",
        justifyContent: "center"
      }}><ArrowDownUp size={18} color={colors.textPrimary} /></PressableBlock>
    </View>

    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{
      gap: 8,
      paddingRight: 16,
      paddingBottom: 20
    }}>
      {[{
        label: tr("All"),
        value: ""
      }, ...ACTIVE_STATUSES.map(value => ({
        label: tr(labelFor(value)),
        value
      }))].map(item => {
        const selected = item.value === status;
        const tone = statusTone(item.value, colors);
        return <PressableBlock key={item.value || "all"} onPress={() => setStatus(item.value)} style={{
          minHeight: 40,
          justifyContent: "center",
          paddingHorizontal: 14,
          paddingVertical: 9,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: selected ? tone : `${tone}66`,
          backgroundColor: selected ? tone : `${tone}14`
        }}><Text style={{
            color: selected ? colors.onPrimary : tone,
            fontSize: 12,
            fontWeight: "600"
          }}>{item.label}</Text></PressableBlock>;
      })}
    </ScrollView>

    <View style={{
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 11
    }}><Text style={{
        color: colors.textPrimary,
        fontSize: 18,
        fontWeight: "500"
      }}>{status ? tr(labelFor(status)) : tr("Collection queue")}</Text><Text style={{
        color: colors.textSecondary,
        fontSize: 12
      }}>{tr("{{count}} results", { count: items.length })} · {oldestFirst ? tr("Urgent first") : tr("Newest")}</Text></View>

    {!data && !error ? <View style={{
      paddingVertical: 48,
      alignItems: "center"
    }}><ActivityIndicator size="large" color={colors.primary} /></View> : error ? <View style={{
      backgroundColor: colors.backgroundSecondary,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      padding: 20
    }}><Text style={{
        color: colors.textPrimary,
        fontWeight: "800"
      }}>{tr("Couldn’t load assignments")}</Text><Text style={{
        color: colors.textSecondary,
        marginTop: 5
      }}>{error.message}</Text><PressableBlock onPress={load} style={{
        alignSelf: "flex-start",
        marginTop: 14
      }}><Text style={{
          color: colors.primary,
          fontWeight: "800"
        }}>{tr("Try again")}</Text></PressableBlock></View> : items.length ? items.map(allocation => <AllocationCard key={allocation._id} allocation={allocation} onPress={() => router.push({
      pathname: "/(app)/ngo/assignments/[id]",
      params: {
        id: allocation._id
      }
    })} />) : <View style={{
      alignItems: "center",
      backgroundColor: colors.backgroundSecondary,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      padding: 30
    }}><Inbox size={28} color={colors.textSecondary} /><Text style={{
        color: colors.textPrimary,
        fontWeight: "800",
        marginTop: 12
      }}>{tr("No assignments found")}</Text><Text style={{
        color: colors.textSecondary,
        fontSize: 12,
        textAlign: "center",
        lineHeight: 18,
        marginTop: 4
      }}>{tr("Change the search or status filter to see more results.")}</Text></View>}
  </ScrollView>;
}
