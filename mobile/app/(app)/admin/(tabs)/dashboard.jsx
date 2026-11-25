import { useCallback, useRef, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import { ArrowRight, Building2, CircleGauge, Clock3, HandHeart, Network, PackageCheck, Truck } from "lucide-react-native";
import { Text, View } from "react-native";
import PressableBlock from "../../../../components/PressableBlock";
import { WeightTrend } from "../../../../components/AdminWidgets";
import { Button, ErrorState, Field, FilterChips, LoadingState, Screen, Section, Surface, useColors } from "../../../../components/ui";
import { getDashboard } from "../../../../services/admin";
import { useAuth } from "../../../../utils/context/auth";
import { useTranslation } from "../../../../utils/i18n/LanguageProvider";
const indiaDay = date => {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date).filter(part => part.type !== "literal").map(part => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
};
const rangeFor = preset => {
  const now = new Date();
  if (preset === "ALL") return {};
  const days = Number(preset);
  return {
    from: indiaDay(new Date(now.getTime() - (days - 1) * 86400000)),
    to: indiaDay(now)
  };
};
const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};
export default function AdminDashboard() {
  const {
    tr
  } = useTranslation();
  const colors = useColors();
  const {
    user
  } = useAuth();
  const [preset, setPreset] = useState("7");
  const [custom, setCustom] = useState(rangeFor("7"));
  const [appliedRange, setAppliedRange] = useState(rangeFor("7"));
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const latestRequest = useRef(0);
  const load = useCallback(async () => {
    const requestId = ++latestRequest.current;
    try {
      setError(null);
      const nextData = await getDashboard(appliedRange);
      if (requestId === latestRequest.current) setData(nextData);
    } catch (requestError) {
      if (requestId === latestRequest.current) setError(requestError);
    } finally {
      if (requestId === latestRequest.current) setRefreshing(false);
    }
  }, [appliedRange]);
  useFocusEffect(useCallback(() => {
    load();
  }, [load]));
  const selectPreset = value => {
    setPreset(value);
    if (value !== "CUSTOM") {
      setData(null);
      setAppliedRange(rangeFor(value));
    }
  };
  const deliveryRate = Math.round((data?.deliverySuccessRate || 0) * 100);
  const assignedRate = data?.kgDonated ? Math.min(100, Math.round(data.kgAssigned / data.kgDonated * 100)) : 0;
  return <Screen refreshing={refreshing} onRefresh={() => {
    setRefreshing(true);
    load();
  }} contentStyle={{
    paddingBottom: 132
  }}>
    <View style={{
      marginBottom: 22
    }}><Text style={{
        color: colors.textSecondary,
        fontSize: 14
      }}>{tr(greeting())}</Text><Text style={{
        color: colors.textPrimary,
        fontSize: 30,
        fontWeight: "900",
        marginTop: 2
      }}>{user?.name || "SafePlate admin"}</Text><Text style={{
        color: colors.textSecondary,
        fontSize: 13,
        lineHeight: 19,
        marginTop: 4
      }}>{tr("Monitor food movement, matching and partner activity.")}</Text></View>

    <FilterChips value={preset} onChange={selectPreset} values={[{
      label: tr("7 days"),
      value: "7"
    }, {
      label: tr("30 days"),
      value: "30"
    }, {
      label: tr("All time"),
      value: "ALL"
    }, {
      label: tr("Custom"),
      value: "CUSTOM"
    }]} />
    {preset === "CUSTOM" ? <Surface style={{
      marginBottom: 18
    }}><Field label={tr("From date")} value={custom.from} onChangeText={from => setCustom(current => ({
        ...current,
        from
      }))} placeholder={tr("YYYY-MM-DD")} /><Field label={tr("To date")} value={custom.to} onChangeText={to => setCustom(current => ({
        ...current,
        to
      }))} placeholder={tr("YYYY-MM-DD")} /><Button title={tr("Apply range")} onPress={() => {
        setData(null);
        setAppliedRange({ ...custom });
      }} /></Surface> : null}

    {!data && !error ? <LoadingState label={tr("Loading platform activity…")} /> : error ? <ErrorState message={error.message} onRetry={load} /> : <>
      <View style={{
        backgroundColor: colors.primary,
        borderRadius: 22,
        padding: 20,
        marginBottom: 16,
        overflow: "hidden"
      }}>
        <View style={{
          position: "absolute",
          right: -35,
          top: -38,
          width: 130,
          height: 130,
          borderRadius: 65,
          backgroundColor: "rgba(255,255,255,0.10)"
        }} />
        <View style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between"
        }}><View style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(255,255,255,0.18)"
          }}><CircleGauge size={22} color={colors.onPrimary} /></View><View style={{
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 999,
            backgroundColor: "rgba(255,255,255,0.18)"
          }}><Text style={{
              color: colors.onPrimary,
              fontSize: 10,
              fontWeight: "900"
            }}>{tr("SELECTED RANGE")}</Text></View></View>
        <Text style={{
          color: colors.onPrimary,
          fontSize: 12,
          fontWeight: "800",
          letterSpacing: 0.6,
          marginTop: 18
        }}>{tr("DELIVERY SUCCESS")}</Text><Text style={{
          color: colors.onPrimary,
          fontSize: 42,
          lineHeight: 48,
          fontWeight: "900",
          marginTop: 2
        }}>{deliveryRate}%</Text><Text style={{
          color: colors.onPrimary,
          opacity: 0.78,
          fontSize: 12,
          marginTop: 2
        }}>{tr("{{count}} NGOs served in this period", { count: data.ngosServed })}</Text>
        <View style={{
          height: 6,
          borderRadius: 99,
          backgroundColor: "rgba(0,0,0,0.16)",
          marginTop: 17,
          overflow: "hidden"
        }}><View style={{
            width: `${deliveryRate}%`,
            height: "100%",
            borderRadius: 99,
            backgroundColor: colors.onPrimary
          }} /></View>
      </View>

      <View style={{
        flexDirection: "row",
        gap: 9,
        marginBottom: 24
      }}>
        <FlowMetric icon={HandHeart} label={tr("Donated")} value={`${data.kgDonated.toFixed(1)} kg`} colors={colors} />
        <FlowMetric icon={Network} label={tr("Assigned")} value={`${data.kgAssigned.toFixed(1)} kg`} colors={colors} />
        <FlowMetric icon={PackageCheck} label={tr("Delivered")} value={`${data.kgDelivered.toFixed(1)} kg`} colors={colors} />
      </View>

      <Section title={tr("Needs attention")} subtitle={tr("Items that may need an admin decision")}>
        <View style={{
          flexDirection: "row",
          gap: 10
        }}>
          <AttentionCard icon={Clock3} label={tr("Awaiting match")} value={data.unmatchedDonations} tone={colors.warning} colors={colors} onPress={() => router.push("/(app)/admin/donations")} />
          <AttentionCard icon={Truck} label={tr("Food discarded")} value={`${data.kgDiscarded.toFixed(1)} kg`} tone={colors.danger} colors={colors} onPress={() => router.push("/(app)/admin/donations")} />
        </View>
      </Section>

      <Section title={tr("Platform flow")} subtitle={tr("{{rate}}% of donated weight has been assigned", {
        rate: assignedRate
      })}>
        <Surface><ProgressLine label={tr("Matching progress")} value={assignedRate} color={colors.primary} colors={colors} /><ProgressLine label={tr("Delivery success")} value={deliveryRate} color={colors.success} colors={colors} last /></Surface>
      </Section>

      <Section title={tr("Quick actions")}>
        <QuickLink icon={Network} title={tr("Run allocation")} subtitle={tr("Match eligible pending donations")} colors={colors} onPress={() => router.push("/(app)/admin/(tabs)/operations")} />
        <QuickLink icon={Building2} title={tr("Review NGO partners")} subtitle={tr("Profiles, capacity and nutrition targets")} colors={colors} onPress={() => router.push("/(app)/admin/ngos")} />
      </Section>

      <Section title={tr("Weight over time")} subtitle={tr("Donated and delivered kilograms")}>{data.dailyTrend.length ? <WeightTrend data={data.dailyTrend} /> : <Surface><Text style={{
            color: colors.textSecondary
          }}>{tr("No activity in this date range.")}</Text></Surface>}</Section>
    </>}
  </Screen>;
}
function FlowMetric({
  icon: Icon,
  label,
  value,
  colors
}) {
  return <View style={{
    flex: 1,
    minWidth: 0,
    borderRadius: 15,
    padding: 13,
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border
  }}><Icon size={17} color={colors.primary} /><Text style={{
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: "900",
      marginTop: 12
    }} numberOfLines={1} adjustsFontSizeToFit>{value}</Text><Text style={{
      color: colors.textSecondary,
      fontSize: 10,
      marginTop: 4
    }}>{label}</Text></View>;
}
function AttentionCard({
  icon: Icon,
  label,
  value,
  tone,
  colors,
  onPress
}) {
  return <PressableBlock onPress={onPress} style={{
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 15
  }}><View style={{
      width: 38,
      height: 38,
      borderRadius: 12,
      backgroundColor: `${tone}18`,
      alignItems: "center",
      justifyContent: "center"
    }}><Icon size={18} color={tone} /></View><Text style={{
      color: tone,
      fontSize: 22,
      fontWeight: "900",
      marginTop: 12
    }}>{value}</Text><Text style={{
      color: colors.textSecondary,
      fontSize: 11,
      marginTop: 3
    }}>{label}</Text></PressableBlock>;
}
function ProgressLine({
  label,
  value,
  color,
  colors,
  last
}) {
  return <View style={{
    paddingBottom: last ? 0 : 17,
    marginBottom: last ? 0 : 17,
    borderBottomWidth: last ? 0 : 1,
    borderBottomColor: colors.border
  }}><View style={{
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 9
    }}><Text style={{
        color: colors.textPrimary,
        fontSize: 13,
        fontWeight: "800"
      }}>{label}</Text><Text style={{
        color,
        fontSize: 13,
        fontWeight: "900"
      }}>{value}%</Text></View><View style={{
      height: 7,
      borderRadius: 99,
      backgroundColor: colors.backgroundElevated,
      overflow: "hidden"
    }}><View style={{
        width: `${value}%`,
        height: "100%",
        backgroundColor: color,
        borderRadius: 99
      }} /></View></View>;
}
function QuickLink({
  icon: Icon,
  title,
  subtitle,
  colors,
  onPress
}) {
  return <PressableBlock onPress={onPress} style={{
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 15,
    padding: 15,
    marginBottom: 10
  }}><View style={{
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: colors.backgroundElevated,
      alignItems: "center",
      justifyContent: "center"
    }}><Icon size={19} color={colors.primary} /></View><View style={{
      flex: 1,
      marginLeft: 13
    }}><Text style={{
        color: colors.textPrimary,
        fontSize: 14,
        fontWeight: "900"
      }}>{title}</Text><Text style={{
        color: colors.textSecondary,
        fontSize: 12,
        marginTop: 3
      }}>{subtitle}</Text></View><ArrowRight size={18} color={colors.textTertiary} /></PressableBlock>;
}
