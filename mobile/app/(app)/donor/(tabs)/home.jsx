import { useCallback, useMemo, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import { ArrowRight, CalendarClock, ChartNoAxesCombined, HandHeart, ListChecks, PackageCheck, Sparkles } from "lucide-react-native";
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
          {greeting}
        </Text>
        <Text style={{
        color: colors.textPrimary,
        fontSize: 30,
        lineHeight: 37,
        fontWeight: "900",
        marginTop: 1
      }}>
          {firstName}
        </Text>
        <Text style={{
        color: colors.textSecondary,
        fontSize: 14,
        lineHeight: 20,
        marginTop: 4
      }}>{tr("Your food can become someone’s next meal.")}</Text>
      </View>

      <PressableBlock onPress={() => router.push("/(app)/donor/(tabs)/donate")} style={{
      overflow: "hidden",
      backgroundColor: colors.primary,
      borderRadius: 20,
      padding: 20,
      marginBottom: 20
    }}>
        <View style={{
        position: "absolute",
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: "rgba(255,255,255,0.10)",
        right: -45,
        top: -58
      }} />
        <View style={{
        position: "absolute",
        width: 86,
        height: 86,
        borderRadius: 43,
        backgroundColor: "rgba(255,255,255,0.10)",
        right: 54,
        bottom: -44
      }} />
        <View style={{
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: "rgba(255,255,255,0.22)",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 20
      }}>
          <HandHeart color={colors.onPrimary} size={23} />
        </View>
        <Text style={{
        color: colors.onPrimary,
        fontSize: 21,
        fontWeight: "900"
      }}>
          {tr("Share surplus food")}
        </Text>
        <Text style={{
        color: colors.onPrimary,
        opacity: 0.76,
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
          fontWeight: "900"
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
          fontSize: 19,
          fontWeight: "900"
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
        gap: 9,
        marginBottom: 24
      }}>
            <Metric label={tr("Shared")} value={`${summary.totalKg.toFixed(1)} kg`} icon={Sparkles} colors={colors} />
            <Metric label={tr("Active")} value={summary.active.length} icon={CalendarClock} colors={colors} />
            <Metric label={tr("Delivered")} value={summary.delivered.length} icon={PackageCheck} colors={colors} />
          </View>

          <Text style={{
        color: colors.textPrimary,
        fontSize: 19,
        fontWeight: "900",
        marginBottom: 11
      }}>{tr("Quick actions")}</Text>
          <View style={{
        flexDirection: "row",
        gap: 10,
        marginBottom: 26
      }}>
            <QuickAction icon={ListChecks} title={tr("Donation history")} subtitle={tr("Track every pickup")} colors={colors} onPress={() => router.push("/(app)/donor/(tabs)/donations")} />
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
            fontSize: 19,
            fontWeight: "900"
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
  icon: Icon,
  colors
}) {
  return <View style={{
    flex: 1,
    minWidth: 0,
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 12
  }}>
      <View style={{
      width: 30,
      height: 30,
      borderRadius: 9,
      backgroundColor: `${colors.primary}15`,
      alignItems: "center",
      justifyContent: "center"
    }}>
        <Icon size={15} color={colors.primary} />
      </View>
      <Text style={{
      color: colors.textPrimary,
      fontSize: 17,
      fontWeight: "900",
      marginTop: 12
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
  onPress
}) {
  return <PressableBlock onPress={onPress} style={{
    flex: 1,
    minWidth: 0,
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 15
  }}>
      <View style={{
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between"
    }}>
        <View style={{
        width: 36,
        height: 36,
        borderRadius: 11,
        backgroundColor: `${colors.primary}17`,
        alignItems: "center",
        justifyContent: "center"
      }}>
          <Icon size={18} color={colors.primary} />
        </View>
        <ArrowRight size={16} color={colors.textSecondary} />
      </View>
      <Text style={{
      color: colors.textPrimary,
      fontSize: 14,
      fontWeight: "800",
      marginTop: 13
    }} numberOfLines={1}>
        {title}
      </Text>
      <Text style={{
      color: colors.textSecondary,
      fontSize: 11,
      marginTop: 3
    }} numberOfLines={1}>
        {subtitle}
      </Text>
    </PressableBlock>;
}
