import { useCallback, useMemo, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import { ArrowDownUp, Inbox, Search } from "lucide-react-native";
import { ActivityIndicator, RefreshControl, ScrollView, Text, TextInput, View } from "react-native";
import DonationCard from "../../../../components/DonationCard";
import PressableBlock from "../../../../components/PressableBlock";
import { darkColors, lightColors } from "../../../../colors";
import { DONATION_STATUSES, labelFor } from "../../../../constants/domain";
import { listDonations } from "../../../../services/donations";
import { useTheme } from "../../../../utils/context/theme";
import { useTranslation } from "../../../../utils/i18n/LanguageProvider";
const statusTone = (status, colors) => ({
  PENDING: colors.warning,
  ASSIGNED: colors.info,
  PICKED_UP: colors.primary,
  DELIVERED: colors.success,
  DISCARDED: colors.danger
})[status] || colors.primary;
export default function Donations() {
  const {
    tr
  } = useTranslation();
  const {
    colorScheme
  } = useTheme();
  const colors = colorScheme === "dark" ? darkColors : lightColors;
  const [status, setStatus] = useState("");
  const [query, setQuery] = useState("");
  const [newestFirst, setNewestFirst] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const load = useCallback(async () => {
    try {
      setError(null);
      setData(await listDonations({
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
    const normalizedQuery = query.trim().toLowerCase();
    return [...(data?.items || [])].filter(item => !status || item.status === status).filter(item => !normalizedQuery || item.items?.some(food => food.name.toLowerCase().includes(normalizedQuery))).sort((a, b) => (new Date(b.createdAt) - new Date(a.createdAt)) * (newestFirst ? 1 : -1));
  }, [data, newestFirst, query, status]);
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
  }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {
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
      }}>
          <Search size={18} color={colors.textSecondary} />
          <TextInput value={query} onChangeText={setQuery} placeholder={tr("Search food items")} placeholderTextColor={colors.placeholder} selectionColor={colors.primary} style={{
          flex: 1,
          height: "100%",
          color: colors.textPrimary,
          fontSize: 14,
          marginLeft: 10,
          outlineStyle: "none"
        }} />
        </View>
        <PressableBlock onPress={() => setNewestFirst(current => !current)} accessibilityLabel={tr("Change sort order")} style={{
        width: 48,
        height: 48,
        borderRadius: 13,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.backgroundSecondary,
        alignItems: "center",
        justifyContent: "center"
      }}>
          <ArrowDownUp size={18} color={colors.textPrimary} />
        </PressableBlock>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{
      gap: 8,
      paddingRight: 16,
      paddingBottom: 20
    }}>
        {[{
        label: tr("All"),
        value: ""
      }, ...DONATION_STATUSES.map(value => ({
        label: tr(labelFor(value)),
        value
      }))].map(item => {
        const selected = status === item.value;
        const tone = statusTone(item.value, colors);
        return <PressableBlock key={item.value || "all"} onPress={() => setStatus(item.value)} style={{
          minHeight: 40,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 14,
          paddingVertical: 9,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: selected ? tone : `${tone}66`,
          backgroundColor: selected ? tone : `${tone}14`
        }}>
              <Text style={{
            color: selected ? colors.onPrimary : tone,
            fontSize: 12,
            fontWeight: "600"
          }}>
                {item.label}
              </Text>
            </PressableBlock>;
      })}
      </ScrollView>

      <View style={{
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 11
    }}>
        <Text style={{
        color: colors.textPrimary,
        fontSize: 18,
        fontWeight: "500"
      }}>
          {status ? tr(labelFor(status)) : tr("All donations")}
        </Text>
        <Text style={{
        color: colors.textSecondary,
        fontSize: 12
      }}>
          {tr("{{count}} results", { count: items.length })} ·{" "}
          {newestFirst ? tr("Newest") : tr("Oldest")}
        </Text>
      </View>

      {!data && !error ? <View style={{
      paddingVertical: 48,
      alignItems: "center"
    }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View> : error ? <View style={{
      backgroundColor: colors.backgroundSecondary,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      padding: 20
    }}>
          <Text style={{
        color: colors.textPrimary,
        fontWeight: "800"
      }}>{tr("Couldn’t load donations")}</Text>
          <Text style={{
        color: colors.textSecondary,
        marginTop: 5
      }}>
            {error.message}
          </Text>
          <PressableBlock onPress={load} style={{
        alignSelf: "flex-start",
        marginTop: 14
      }}>
            <Text style={{
          color: colors.primary,
          fontWeight: "800"
        }}>{tr("Try again")}</Text>
          </PressableBlock>
        </View> : items.length ? items.map(donation => <DonationCard key={donation._id} donation={donation} onPress={() => router.push({
      pathname: "/(app)/donor/donations/[id]",
      params: {
        id: donation._id
      }
    })} />) : <View style={{
      alignItems: "center",
      backgroundColor: colors.backgroundSecondary,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      padding: 30
    }}>
          <Inbox size={28} color={colors.textSecondary} />
          <Text style={{
        color: colors.textPrimary,
        fontWeight: "800",
        marginTop: 12
      }}>{tr("No donations found")}</Text>
          <Text style={{
        color: colors.textSecondary,
        fontSize: 12,
        textAlign: "center",
        lineHeight: 18,
        marginTop: 4
      }}>{tr("Change the search or status filter to see more results.")}</Text>
        </View>}
    </ScrollView>;
}
