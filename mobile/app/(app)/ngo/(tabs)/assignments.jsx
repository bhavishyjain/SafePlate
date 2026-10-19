import { useCallback, useMemo, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import { ArrowDownUp, Inbox, Search } from "lucide-react-native";
import { ActivityIndicator, RefreshControl, ScrollView, Text, TextInput, View } from "react-native";
import AllocationCard from "../../../../components/AllocationCard";
import PressableBlock from "../../../../components/PressableBlock";
import { darkColors, lightColors } from "../../../../colors";
import { ALLOCATION_STATUSES, labelFor } from "../../../../constants/domain";
import { listAllocations } from "../../../../services/allocations";
import { useTheme } from "../../../../utils/context/theme";
import { useTranslation } from "../../../../utils/i18n/LanguageProvider";
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
    return [...(data?.items || [])].filter(item => !status || item.status === status).filter(item => !search || item.donationId?.items?.some(food => food.name.toLowerCase().includes(search))).sort((a, b) => (new Date(a.assignedAt || a.createdAt) - new Date(b.assignedAt || b.createdAt)) * (oldestFirst ? 1 : -1));
  }, [data, oldestFirst, query, status]);
  const all = data?.items || [];
  const activeCount = all.filter(item => ["ASSIGNED", "PICKED_UP"].includes(item.status)).length;
  const totalKg = all.reduce((sum, item) => sum + Number(item.donationId?.quantityKg || 0), 0);
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
    
    <Text style={{
      color: colors.textSecondary,
      fontSize: 13,
      lineHeight: 19,
      marginTop: 4,
      marginBottom: 22
    }}>{tr("Keep every assigned collection moving from pickup to delivery.")}</Text>

    <View style={{
      flexDirection: "row",
      gap: 10,
      marginBottom: 18
    }}>
      <View style={{
        flex: 1,
        backgroundColor: colors.backgroundSecondary,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 14
      }}><Text style={{
          color: colors.textSecondary,
          fontSize: 11
        }}>{tr("Needs attention")}</Text><Text style={{
          color: colors.textPrimary,
          fontSize: 22,
          fontWeight: "900",
          marginTop: 4
        }}>{activeCount}</Text></View>
      <View style={{
        flex: 1,
        backgroundColor: colors.backgroundSecondary,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 14
      }}><Text style={{
          color: colors.textSecondary,
          fontSize: 11
        }}>{tr("Food allocated")}</Text><Text style={{
          color: colors.textPrimary,
          fontSize: 22,
          fontWeight: "900",
          marginTop: 4
        }}>{totalKg.toFixed(1)} <Text style={{
            fontSize: 12
          }}>{tr("kg")}</Text></Text></View>
    </View>

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
      paddingBottom: 20
    }}>
      {[{
        label: tr("All"),
        value: ""
      }, ...ALLOCATION_STATUSES.map(value => ({
        label: tr(labelFor(value)),
        value
      }))].map(item => {
        const selected = item.value === status;
        return <PressableBlock key={item.value || "all"} onPress={() => setStatus(item.value)} style={{
          paddingHorizontal: 14,
          paddingVertical: 9,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: selected ? colors.primary : colors.border,
          backgroundColor: selected ? colors.primary : colors.backgroundSecondary
        }}><Text style={{
            color: selected ? colors.onPrimary : colors.textPrimary,
            fontSize: 12,
            fontWeight: "800"
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
        fontWeight: "900"
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
