import { useCallback, useMemo, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import { ArrowRight, Building2, ClipboardCheck, ClipboardList, HeartPulse, History, PackageCheck, Truck } from "lucide-react-native";
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from "react-native";
import AllocationCard from "../../../../components/AllocationCard";
import PressableBlock from "../../../../components/PressableBlock";
import { darkColors, lightColors } from "../../../../colors";
import { listAllocations } from "../../../../services/allocations";
import { getMyNgo, getNutritionStatus } from "../../../../services/ngos";
import { useAuth } from "../../../../utils/context/auth";
import { useTheme } from "../../../../utils/context/theme";
import { useTranslation } from "../../../../utils/i18n/LanguageProvider";
export default function NgoHome() {
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
  const [state, setState] = useState(null);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const load = useCallback(async () => {
    try {
      setError(null);
      const profile = await getMyNgo();
      const [nutrition, allocations] = await Promise.all([getNutritionStatus(profile._id), listAllocations({
        page: 1,
        limit: 100
      })]);
      setState({
        profile,
        nutrition,
        allocations
      });
    } catch (requestError) {
      if (requestError.code === "NGO_NOT_FOUND") setState({
        needsProfile: true
      });else setError(requestError);
    } finally {
      setRefreshing(false);
    }
  }, []);
  useFocusEffect(useCallback(() => {
    load();
  }, [load]));
  const summary = useMemo(() => {
    const items = state?.allocations?.items || [];
    return {
      active: items.filter(item => ["ASSIGNED", "PICKED_UP"].includes(item.status)),
      assigned: items.filter(item => item.status === "ASSIGNED").length,
      pickedUp: items.filter(item => item.status === "PICKED_UP").length,
      delivered: items.filter(item => item.status === "DELIVERED").length
    };
  }, [state]);
  const nutrition = state?.nutrition;
  const caloriePercent = nutrition?.targetCalories ? Math.min(100, Math.round(nutrition.deliveredCalories / nutrition.targetCalories * 100)) : 0;
  const proteinPercent = nutrition?.targetProtein ? Math.min(100, Math.round(nutrition.deliveredProtein / nutrition.targetProtein * 100)) : 0;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const organization = state?.profile?.userId?.organization || user?.organization || user?.name || "NGO partner";
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
    }}><Text style={{
        color: colors.textSecondary,
        fontSize: 14,
        fontWeight: "600"
      }}>{greeting}</Text><Text style={{
        color: colors.textPrimary,
        fontSize: 29,
        lineHeight: 36,
        fontWeight: "900",
        marginTop: 1
      }}>{organization}</Text><Text style={{
        color: colors.textSecondary,
        fontSize: 13,
        lineHeight: 19,
        marginTop: 4
      }}>{tr("Manage today’s nutrition needs and food collections.")}</Text></View>

    {state?.needsProfile ? <View><View style={{
        backgroundColor: colors.primary,
        borderRadius: 20,
        overflow: "hidden",
        padding: 21,
        marginBottom: 18
      }}><View style={{
          position: "absolute",
          width: 160,
          height: 160,
          borderRadius: 80,
          right: -55,
          top: -65,
          backgroundColor: "rgba(255,255,255,0.11)"
        }} /><Building2 size={26} color={colors.onPrimary} /><Text style={{
          color: colors.onPrimary,
          fontSize: 21,
          fontWeight: "900",
          marginTop: 20
        }}>{tr("Complete your organization profile")}</Text><Text style={{
          color: colors.onPrimary,
          opacity: 0.75,
          fontSize: 13,
          lineHeight: 19,
          marginTop: 6,
          maxWidth: 330
        }}>{tr("Add your beneficiary groups and service location before SafePlate can match food donations to you.")}</Text></View><PressableBlock onPress={() => router.push("/(app)/ngo/(tabs)/profile")} style={{
        height: 52,
        borderRadius: 14,
        backgroundColor: colors.primary,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center"
      }}><Text style={{
          color: colors.onPrimary,
          fontWeight: "900"
        }}>{tr("Set up NGO profile")}</Text><ArrowRight size={18} color={colors.onPrimary} style={{
          marginLeft: 7
        }} /></PressableBlock></View> : !state && !error ? <View style={{
      paddingVertical: 60,
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
      }}>{tr("Couldn’t load the NGO dashboard")}</Text><Text style={{
        color: colors.textSecondary,
        marginTop: 5
      }}>{error.message}</Text><PressableBlock onPress={load} style={{
        alignSelf: "flex-start",
        marginTop: 14
      }}><Text style={{
          color: colors.primary,
          fontWeight: "800"
        }}>{tr("Try again")}</Text></PressableBlock></View> : <>
      <PressableBlock onPress={() => router.push("/(app)/ngo/(tabs)/nutrition")} style={{
        backgroundColor: colors.primary,
        borderRadius: 20,
        overflow: "hidden",
        padding: 20,
        marginBottom: 18
      }}>
        <View style={{
          position: "absolute",
          width: 170,
          height: 170,
          borderRadius: 85,
          right: -60,
          top: -70,
          backgroundColor: "rgba(255,255,255,0.11)"
        }} />
        <View style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between"
        }}><View style={{
            width: 42,
            height: 42,
            borderRadius: 13,
            backgroundColor: "rgba(255,255,255,0.20)",
            alignItems: "center",
            justifyContent: "center"
          }}><HeartPulse size={22} color={colors.onPrimary} /></View><View style={{
            flexDirection: "row",
            alignItems: "center"
          }}><Text style={{
              color: colors.onPrimary,
              fontSize: 12,
              fontWeight: "900"
            }}>{tr("Nutrition details")}</Text><ArrowRight size={16} color={colors.onPrimary} style={{
              marginLeft: 5
            }} /></View></View>
        <Text style={{
          color: colors.onPrimary,
          fontSize: 20,
          fontWeight: "900",
          marginTop: 18
        }}>{tr("Today’s coverage")}</Text>
        <View style={{
          flexDirection: "row",
          gap: 18,
          marginTop: 12
        }}><Coverage label={tr("Calories")} percent={caloriePercent} colors={colors} /><Coverage label={tr("Protein")} percent={proteinPercent} colors={colors} /></View>
      </PressableBlock>

      <View style={{
        flexDirection: "row",
        backgroundColor: colors.backgroundSecondary,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 14,
        paddingVertical: 16,
        marginBottom: 24
      }}>
        <Metric icon={ClipboardList} label={tr("Assigned")} value={summary.assigned} colors={colors} divider />
        <Metric icon={Truck} label={tr("Picked up")} value={summary.pickedUp} colors={colors} divider />
        <Metric icon={PackageCheck} label={tr("Delivered")} value={summary.delivered} colors={colors} />
      </View>

      <Text style={{
        color: colors.textPrimary,
        fontSize: 19,
        fontWeight: "500",
        marginBottom: 11
      }}>{tr("Quick actions")}</Text>
      <View style={{
        flexDirection: "row",
        gap: 10,
        marginBottom: 26
      }}>
        <QuickAction icon={ClipboardCheck} title={tr("All assignments")} subtitle={tr("Manage collection queue")} colors={colors} onPress={() => router.push("/(app)/ngo/(tabs)/assignments")} />
        <QuickAction icon={History} title={tr("Delivery history")} subtitle={tr("Completed collections")} colors={colors} onPress={() => router.push("/(app)/ngo/(tabs)/history")} />
      </View>

      <View style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 11
      }}><View><Text style={{
            color: colors.textPrimary,
            fontSize: 19,
            fontWeight: "500"
          }}>{tr("Needs attention")}</Text><Text style={{
            color: colors.textSecondary,
            fontSize: 12,
            marginTop: 3
          }}>{tr("Collections still in progress")}</Text></View><PressableBlock onPress={() => router.push("/(app)/ngo/(tabs)/assignments")} style={{
          flexDirection: "row",
          alignItems: "center"
        }}><Text style={{
            color: colors.primary,
            fontSize: 12,
            fontWeight: "600"
          }}>{tr("View all")}</Text><ArrowRight size={14} color={colors.primary} style={{
            marginLeft: 4
          }} /></PressableBlock></View>
      {summary.active.length ? summary.active.slice(0, 3).map(allocation => <AllocationCard key={allocation._id} allocation={allocation} onPress={() => router.push({
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
        padding: 26
      }}><PackageCheck size={27} color={colors.primary} /><Text style={{
          color: colors.textPrimary,
          fontWeight: "800",
          marginTop: 11
        }}>{tr("All caught up")}</Text><Text style={{
          color: colors.textSecondary,
          fontSize: 12,
          textAlign: "center",
          marginTop: 4
        }}>{tr("New matched donations will appear here.")}</Text></View>}
    </>}
  </ScrollView>;
}
function Coverage({
  label,
  percent,
  colors
}) {
  return <View style={{
    flex: 1
  }}><View style={{
      flexDirection: "row",
      justifyContent: "space-between"
    }}><Text style={{
        color: colors.onPrimary,
        opacity: 0.78,
        fontSize: 11
      }}>{label}</Text><Text style={{
        color: colors.onPrimary,
        fontSize: 13,
        fontWeight: "900"
      }}>{percent}%</Text></View><View style={{
      height: 7,
      borderRadius: 4,
      backgroundColor: "rgba(255,255,255,0.22)",
      overflow: "hidden",
      marginTop: 7
    }}><View style={{
        width: `${percent}%`,
        height: "100%",
        backgroundColor: colors.onPrimary,
        borderRadius: 4
      }} /></View></View>;
}
function Metric({
  icon: Icon,
  label,
  value,
  colors,
  divider = false
}) {
  return <View style={{
    flex: 1,
    minWidth: 0,
    minHeight: 58,
    alignItems: "center",
    justifyContent: "center",
    borderRightWidth: divider ? 1 : 0,
    borderRightColor: colors.border,
    paddingHorizontal: 8
  }}><Icon size={15} color={colors.textSecondary} /><Text style={{
      color: colors.textPrimary,
      fontSize: 18,
      fontWeight: "600",
      marginTop: 6
    }}>{value}</Text><Text style={{
      color: colors.textSecondary,
      fontSize: 10,
      marginTop: 3,
      textAlign: "center"
    }}>{label}</Text></View>;
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
  }}><View style={{
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center"
    }}><View style={{
        width: 36,
        height: 36,
        borderRadius: 11,
        backgroundColor: `${colors.primary}17`,
        alignItems: "center",
        justifyContent: "center"
      }}><Icon size={18} color={colors.primary} /></View><ArrowRight size={16} color={colors.textSecondary} /></View><Text style={{
      color: colors.textPrimary,
      fontSize: 14,
      fontWeight: "600",
      marginTop: 13
    }} numberOfLines={1}>{title}</Text><Text style={{
      color: colors.textSecondary,
      fontSize: 11,
      marginTop: 3
    }} numberOfLines={1}>{subtitle}</Text></PressableBlock>;
}
