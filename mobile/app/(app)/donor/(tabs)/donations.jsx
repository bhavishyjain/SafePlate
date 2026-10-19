import { useCallback, useMemo, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import { ArrowDownUp, HandHeart, Inbox, Search } from "lucide-react-native";
import { ActivityIndicator, RefreshControl, ScrollView, Text, TextInput, View } from "react-native";
import DonationCard from "../../../../components/DonationCard";
import PressableBlock from "../../../../components/PressableBlock";
import { darkColors, lightColors } from "../../../../colors";
import { DONATION_STATUSES, labelFor } from "../../../../constants/domain";
import { listDonations } from "../../../../services/donations";
import { useTheme } from "../../../../utils/context/theme";
import { useTranslation } from "../../../../utils/i18n/LanguageProvider";
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
  const totalKg = (data?.items || []).reduce((total, item) => total + Number(item.quantityKg || 0), 0);
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
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: 16,
      marginBottom: 22
    }}>
        <View style={{
        flex: 1
      }}>
          <Text style={{
          color: colors.textPrimary,
          fontSize: 29,
          fontWeight: "900"
        }}>{tr("My donations")}</Text>
          <Text style={{
          color: colors.textSecondary,
          fontSize: 13,
          lineHeight: 19,
          marginTop: 4
        }}>{tr("Track every contribution from submission to delivery.")}</Text>
        </View>
        <PressableBlock onPress={() => router.push("/(app)/donor/(tabs)/donate")} accessibilityLabel={tr("Create donation")} style={{
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: colors.primary,
        alignItems: "center",
        justifyContent: "center"
      }}>
          <HandHeart size={21} color={colors.onPrimary} />
        </PressableBlock>
      </View>

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
      }}>
          <Text style={{
          color: colors.textSecondary,
          fontSize: 11
        }}>{tr("Total contributions")}</Text>
          <Text style={{
          color: colors.textPrimary,
          fontSize: 22,
          fontWeight: "900",
          marginTop: 4
        }}>
            {data?.pagination?.total || 0}
          </Text>
        </View>
        <View style={{
        flex: 1,
        backgroundColor: colors.backgroundSecondary,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 14
      }}>
          <Text style={{
          color: colors.textSecondary,
          fontSize: 11
        }}>
            {tr("Food shared")}
          </Text>
          <Text style={{
          color: colors.textPrimary,
          fontSize: 22,
          fontWeight: "900",
          marginTop: 4
        }}>
            {totalKg.toFixed(1)} <Text style={{
            fontSize: 12
          }}>{tr("kg")}</Text>
          </Text>
        </View>
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
        return <PressableBlock key={item.value || "all"} onPress={() => setStatus(item.value)} style={{
          paddingHorizontal: 14,
          paddingVertical: 9,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: selected ? colors.primary : colors.border,
          backgroundColor: selected ? colors.primary : colors.backgroundSecondary
        }}>
              <Text style={{
            color: selected ? colors.onPrimary : colors.textPrimary,
            fontSize: 12,
            fontWeight: "800"
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
        fontWeight: "900"
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
