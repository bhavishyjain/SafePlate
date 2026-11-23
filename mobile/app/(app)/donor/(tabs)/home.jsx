import { useCallback, useMemo, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import { ArrowRight, ChartNoAxesCombined, HandHeart, ListChecks, PackageCheck } from "lucide-react-native";
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from "react-native";
import DonationCard from "../../../../components/DonationCard";
import PressableBlock from "../../../../components/PressableBlock";
import { darkColors, lightColors } from "../../../../colors";
import { listDonations } from "../../../../services/donations";
import { useAuth } from "../../../../utils/context/auth";
import { useTheme } from "../../../../utils/context/theme";
import { useTranslation } from "../../../../utils/i18n/LanguageProvider";
const ACTIVE_STATUSES = ["PENDING", "ASSIGNED", "PICKED_UP"];
export default function DonorHome() {
  const {
    tr
  } = useTranslation();
  const {
    colorScheme
  } = useTheme();
  const colors = colorScheme === "dark" ? darkColors : lightColors;
  const {
    user
  } = useAuth();
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
  const summary = useMemo(() => {
    const items = data?.items || [];
    const now = new Date();
    const thisMonth = items.filter(item => {
      const date = new Date(item.createdAt);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    });
    const active = items.filter(item => ACTIVE_STATUSES.includes(item.status));
    const delivered = items.filter(item => item.status === "DELIVERED");
    return {
      items,
      active,
      delivered,
      totalKg: items.reduce((total, item) => total + Number(item.quantityKg || 0), 0),
      deliveredKg: delivered.reduce((total, item) => total + Number(item.quantityKg || 0), 0),
      monthCount: thisMonth.length
    };
  }, [data]);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = user?.name?.split(" ")[0] || "Donor";
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
  }} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {
    setRefreshing(true);
    load();
  }} colors={[colors.primary]} tintColor={colors.primary} />}>
      <View style={{
      marginBottom: 22
    }}>
        <Text style={{
        color: colors.textSecondary,
        fontSize: 14,
        fontWeight: "600"
      }}>
          {tr(greeting)}
        </Text>
        <Text style={{
        color: colors.textPrimary,
        fontSize: 30,
        lineHeight: 37,
        fontWeight: "600",
        marginTop: 1
      }}>{firstName}</Text>
        <Text style={{
        color: colors.textSecondary,
        fontSize: 14,
        lineHeight: 20,
        marginTop: 4
      }}>{tr("Your food can become someone’s next meal.")}</Text>
      </View>

      <PressableBlock onPress={() => router.push("/(app)/donor/(tabs)/donate")} style={{
      backgroundColor: colors.primary,
      borderRadius: 16,
      padding: 20,
      marginBottom: 24
    }}>
        <View style={{
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: "rgba(255,255,255,0.20)",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16
      }}>
          <HandHeart color={colors.onPrimary} size={18} strokeWidth={1.7} />
        </View>
        <Text style={{
        color: colors.onPrimary,
        fontSize: 20,
        fontWeight: "600"
      }}>
          {tr("Share surplus food")}
        </Text>
        <Text style={{
        color: colors.onPrimary,
        opacity: 0.78,
        fontSize: 13,
        lineHeight: 19,
        marginTop: 5,
        maxWidth: 300
      }}>{tr("Add the food, confirm nutrition and arrange a safe pickup.")}</Text>
        <View style={{
        flexDirection: "row",
        alignItems: "center",
        marginTop: 18
      }}>
          <Text style={{
          color: colors.onPrimary,
          fontSize: 13,
          fontWeight: "600"
        }}>{tr("Start a donation")}</Text>
          <ArrowRight color={colors.onPrimary} size={17} style={{
          marginLeft: 6
        }} />
        </View>
      </PressableBlock>

      {!data && !error ? <View style={{
      paddingVertical: 46,
      alignItems: "center"
    }}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={{
        color: colors.textSecondary,
        marginTop: 12
      }}>
            {tr("Loading your dashboard…")}
          </Text>
        </View> : error ? <View style={{
      backgroundColor: colors.backgroundSecondary,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      padding: 20,
      marginBottom: 20
    }}>
          <Text style={{
        color: colors.textPrimary,
        fontWeight: "800"
      }}>
            {tr("Couldn’t load your donations")}
          </Text>
          <Text style={{
        color: colors.textSecondary,
        lineHeight: 19,
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
        </View> : <>
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
        }}>{tr("At a glance")}</Text>
            <PressableBlock onPress={() => router.push("/(app)/donor/(tabs)/impact")} style={{
          flexDirection: "row",
          alignItems: "center"
        }}>
              <Text style={{
            color: colors.primary,
            fontSize: 12,
            fontWeight: "800"
          }}>{tr("View impact")}</Text>
              <ArrowRight color={colors.primary} size={14} style={{
            marginLeft: 4
          }} />
            </PressableBlock>
          </View>
          <View style={{
        flexDirection: "row",
        backgroundColor: colors.backgroundSecondary,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 14,
        paddingVertical: 16,
        marginBottom: 24
      }}>
            <Metric label={tr("Shared")} value={`${summary.deliveredKg.toFixed(1)} kg`} colors={colors} divider />
            <Metric label={tr("Active")} value={summary.active.length} colors={colors} divider />
            <Metric label={tr("Delivered")} value={summary.delivered.length} colors={colors} />
          </View>

          <Text style={{
        color: colors.textPrimary,
        fontSize: 18,
        fontWeight: "500",
        marginBottom: 11
      }}>{tr("Quick actions")}</Text>
          <View style={{
        backgroundColor: colors.backgroundSecondary,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 14,
        paddingHorizontal: 16,
        marginBottom: 26
      }}>
            <QuickAction icon={ListChecks} title={tr("Donation history")} subtitle={tr("Track every pickup")} colors={colors} divider onPress={() => router.push("/(app)/donor/(tabs)/donations")} />
            <QuickAction icon={ChartNoAxesCombined} title={tr("Your impact")} subtitle={`${summary.monthCount} this month`} colors={colors} onPress={() => router.push("/(app)/donor/(tabs)/impact")} />
          </View>

          <View style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 11
      }}>
            <View>
              <Text style={{
            color: colors.textPrimary,
            fontSize: 18,
            fontWeight: "500"
          }}>{tr("Active pickups")}</Text>
              <Text style={{
            color: colors.textSecondary,
            fontSize: 12,
            marginTop: 3
          }}>
                {tr("Donations that still need attention")}
              </Text>
            </View>
            <PressableBlock onPress={() => router.push("/(app)/donor/(tabs)/donations")} style={{
          flexDirection: "row",
          alignItems: "center"
        }}>
              <Text style={{
            color: colors.primary,
            fontSize: 12,
            fontWeight: "800"
          }}>{tr("View all")}</Text>
              <ArrowRight color={colors.primary} size={14} style={{
            marginLeft: 4
          }} />
            </PressableBlock>
          </View>
          {summary.active.length ? summary.active.slice(0, 3).map(donation => <DonationCard key={donation._id} donation={donation} onPress={() => router.push({
        pathname: "/(app)/donor/donations/[id]",
        params: {
          id: donation._id
        }
      })} />) : <View style={{
        backgroundColor: colors.backgroundSecondary,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 16,
        padding: 22,
        alignItems: "center"
      }}>
              <PackageCheck color={colors.primary} size={26} />
              <Text style={{
          color: colors.textPrimary,
          fontWeight: "800",
          marginTop: 10
        }}>{tr("You’re all caught up")}</Text>
              <Text style={{
          color: colors.textSecondary,
          textAlign: "center",
          lineHeight: 18,
          fontSize: 12,
          marginTop: 4
        }}>{tr("There are no pickups in progress right now.")}</Text>
            </View>}
        </>}
    </ScrollView>;
}
function Metric({
  label,
  value,
  colors,
  divider = false
}) {
  return <View style={{
    flex: 1,
    minWidth: 0,
    minHeight: 52,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    borderRightWidth: divider ? 1 : 0,
    borderRightColor: colors.border
  }}>
      <Text style={{
      color: colors.textPrimary,
      fontSize: 17,
      fontWeight: "600",
      textAlign: "center"
    }} numberOfLines={1}>
        {value}
      </Text>
      <Text style={{
      color: colors.textSecondary,
      fontSize: 11,
      marginTop: 2
    }}>
        {label}
      </Text>
    </View>;
}
function QuickAction({
  icon: Icon,
  title,
  subtitle,
  colors,
  onPress,
  divider = false
}) {
  return <PressableBlock onPress={onPress} style={{
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: divider ? 1 : 0,
    borderBottomColor: colors.border
  }}>
      <View style={{
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: colors.backgroundElevated,
      alignItems: "center",
      justifyContent: "center"
    }}>
          <Icon size={17} strokeWidth={1.7} color={colors.textSecondary} />
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
      <Text style={{
      color: colors.textPrimary,
      fontSize: 14,
      fontWeight: "600"
    }} numberOfLines={1}>
        {title}
      </Text>
      <Text style={{
      color: colors.textSecondary,
      fontSize: 11,
      marginTop: 2
    }} numberOfLines={1}>
        {subtitle}
      </Text>
      </View><ArrowRight size={16} color={colors.textSecondary} />
    </PressableBlock>;
}
