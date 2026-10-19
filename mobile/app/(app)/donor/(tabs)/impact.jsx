import { useCallback, useMemo, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import { ArrowRight, CheckCircle2, HandHeart, PackageCheck, Sparkles, Truck } from "lucide-react-native";
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from "react-native";
import PressableBlock from "../../../../components/PressableBlock";
import { darkColors, lightColors } from "../../../../colors";
import { listDonations } from "../../../../services/donations";
import { useTheme } from "../../../../utils/context/theme";
import { useTranslation } from "../../../../utils/i18n/LanguageProvider";
export default function DonorImpact() {
  const {
    tr
  } = useTranslation();
  const {
    colorScheme
  } = useTheme();
  const colors = colorScheme === "dark" ? darkColors : lightColors;
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
  const impact = useMemo(() => {
    const items = data?.items || [];
    const delivered = items.filter(item => item.status === "DELIVERED");
    const completedPool = items.filter(item => ["DELIVERED", "DISCARDED"].includes(item.status));
    const totalKg = items.reduce((sum, item) => sum + Number(item.quantityKg || 0), 0);
    const deliveredKg = delivered.reduce((sum, item) => sum + Number(item.quantityKg || 0), 0);
    const months = Array.from({
      length: 6
    }, (_, offset) => {
      const date = new Date();
      date.setDate(1);
      date.setMonth(date.getMonth() - (5 - offset));
      const value = items.filter(item => {
        const created = new Date(item.createdAt);
        return created.getMonth() === date.getMonth() && created.getFullYear() === date.getFullYear();
      }).reduce((sum, item) => sum + Number(item.quantityKg || 0), 0);
      return {
        label: date.toLocaleDateString("en-IN", {
          month: "short"
        }),
        value
      };
    });
    return {
      total: items.length,
      delivered: delivered.length,
      totalKg,
      deliveredKg,
      deliveryRate: completedPool.length ? Math.round(delivered.length / completedPool.length * 100) : 0,
      months
    };
  }, [data]);
  const nextMilestone = Math.max(10, Math.ceil((impact.totalKg + 0.01) / 10) * 10);
  const milestoneProgress = Math.min(100, impact.totalKg / nextMilestone * 100);
  const maxMonthKg = Math.max(...impact.months.map(month => month.value), 1);
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
      <Text style={{
      color: colors.textPrimary,
      fontSize: 29,
      fontWeight: "900"
    }}>{tr("Your impact")}</Text>
      <Text style={{
      color: colors.textSecondary,
      fontSize: 13,
      lineHeight: 19,
      marginTop: 4,
      marginBottom: 22
    }}>{tr("A clear view of the food you have shared through SafePlate.")}</Text>

      {!data && !error ? <View style={{
      paddingVertical: 60,
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
      }}>
            {tr("Couldn’t calculate your impact")}
          </Text>
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
        </View> : <>
          <View style={{
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
            <Sparkles size={24} color={colors.onPrimary} />
            <Text style={{
          color: colors.onPrimary,
          fontSize: 13,
          fontWeight: "700",
          opacity: 0.72,
          marginTop: 18
        }}>{tr("TOTAL FOOD SHARED")}</Text>
            <View style={{
          flexDirection: "row",
          alignItems: "flex-end",
          marginTop: 3
        }}>
              <Text style={{
            color: colors.onPrimary,
            fontSize: 40,
            lineHeight: 46,
            fontWeight: "900"
          }}>
                {impact.totalKg.toFixed(1)}
              </Text>
              <Text style={{
            color: colors.onPrimary,
            fontSize: 17,
            fontWeight: "800",
            marginLeft: 6,
            marginBottom: 6
          }}>
                {tr("kg")}
              </Text>
            </View>
            <Text style={{
          color: colors.onPrimary,
          opacity: 0.75,
          fontSize: 12,
          marginTop: 3
        }}>
              {tr("Across {{count}} donations", { count: impact.total })}
            </Text>
          </View>

          <View style={{
        flexDirection: "row",
        gap: 10,
        marginBottom: 24
      }}>
            <ImpactMetric icon={PackageCheck} label={tr("Delivered")} value={impact.delivered} colors={colors} />
            <ImpactMetric icon={Truck} label={tr("Delivered food")} value={`${impact.deliveredKg.toFixed(1)} kg`} colors={colors} />
            <ImpactMetric icon={CheckCircle2} label={tr("Delivery rate")} value={`${impact.deliveryRate}%`} colors={colors} />
          </View>

          <View style={{
        backgroundColor: colors.backgroundSecondary,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 18,
        padding: 17,
        marginBottom: 24
      }}>
            <View style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between"
        }}>
              <View>
                <Text style={{
              color: colors.textPrimary,
              fontSize: 17,
              fontWeight: "900"
            }}>{tr("Next milestone")}</Text>
                <Text style={{
              color: colors.textSecondary,
              fontSize: 12,
              marginTop: 3
            }}>
                  {tr("{{remaining}} kg to reach {{target}} kg", { remaining: Math.max(0, nextMilestone - impact.totalKg).toFixed(1), target: nextMilestone })}
                </Text>
              </View>
              <View style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            backgroundColor: `${colors.primary}18`,
            alignItems: "center",
            justifyContent: "center"
          }}>
                <HandHeart size={19} color={colors.primary} />
              </View>
            </View>
            <View style={{
          height: 8,
          borderRadius: 4,
          backgroundColor: colors.backgroundElevated,
          overflow: "hidden",
          marginTop: 17
        }}>
              <View style={{
            width: `${milestoneProgress}%`,
            height: "100%",
            borderRadius: 4,
            backgroundColor: colors.primary
          }} />
            </View>
          </View>

          <Text style={{
        color: colors.textPrimary,
        fontSize: 19,
        fontWeight: "900",
        marginBottom: 4
      }}>{tr("Last six months")}</Text>
          <Text style={{
        color: colors.textSecondary,
        fontSize: 12,
        marginBottom: 13
      }}>{tr("Kilograms shared each month")}</Text>
          <View style={{
        height: 184,
        flexDirection: "row",
        alignItems: "flex-end",
        gap: 9,
        backgroundColor: colors.backgroundSecondary,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 18,
        paddingHorizontal: 16,
        paddingTop: 20,
        paddingBottom: 14,
        marginBottom: 24
      }}>
            {impact.months.map(month => <View key={month.label} style={{
          flex: 1,
          height: "100%",
          justifyContent: "flex-end",
          alignItems: "center"
        }}>
                <Text style={{
            color: colors.textPrimary,
            fontSize: 10,
            fontWeight: "800",
            marginBottom: 6
          }}>
                  {month.value ? month.value.toFixed(1) : ""}
                </Text>
                <View style={{
            width: "72%",
            minWidth: 12,
            height: Math.max(5, month.value / maxMonthKg * 104),
            borderRadius: 6,
            backgroundColor: month.value ? colors.primary : colors.backgroundElevated
          }} />
                <Text style={{
            color: colors.textSecondary,
            fontSize: 10,
            marginTop: 8
          }}>
                  {month.label}
                </Text>
              </View>)}
          </View>

          <Text style={{
        color: colors.textPrimary,
        fontSize: 19,
        fontWeight: "900",
        marginBottom: 12
      }}>
            {tr("How each donation helps")}
          </Text>
          <View style={{
        backgroundColor: colors.backgroundSecondary,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 18,
        padding: 17,
        marginBottom: 18
      }}>
            <Journey number="1" title={tr("You share safe surplus food")} text="Food details, preparation time and nutrition are recorded." colors={colors} />
            <Journey number="2" title={tr("A suitable NGO is assigned")} text="Allocation considers nutrition needs and pickup distance." colors={colors} />
            <Journey number="3" title={tr("Pickup and delivery are confirmed")} text="You can follow the status until the donation is delivered." colors={colors} last />
          </View>

          <PressableBlock onPress={() => router.push("/(app)/donor/(tabs)/donate")} style={{
        height: 52,
        borderRadius: 14,
        backgroundColor: colors.primary,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center"
      }}>
            <Text style={{
          color: colors.onPrimary,
          fontSize: 15,
          fontWeight: "900"
        }}>{tr("Make another donation")}</Text>
            <ArrowRight size={18} color={colors.onPrimary} style={{
          marginLeft: 7
        }} />
          </PressableBlock>
        </>}
    </ScrollView>;
}
function ImpactMetric({
  icon: Icon,
  label,
  value,
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
      <Icon size={17} color={colors.primary} />
      <Text style={{
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: "900",
      marginTop: 12
    }} numberOfLines={1}>
        {value}
      </Text>
      <Text style={{
      color: colors.textSecondary,
      fontSize: 10,
      marginTop: 3
    }} numberOfLines={1}>
        {label}
      </Text>
    </View>;
}
function Journey({
  number,
  title,
  text,
  colors,
  last
}) {
  return <View style={{
    flexDirection: "row"
  }}>
      <View style={{
      alignItems: "center",
      marginRight: 13
    }}>
        <View style={{
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: `${colors.primary}18`,
        alignItems: "center",
        justifyContent: "center"
      }}>
          <Text style={{
          color: colors.primary,
          fontSize: 12,
          fontWeight: "900"
        }}>
            {number}
          </Text>
        </View>
        {!last ? <View style={{
        width: 1,
        flex: 1,
        minHeight: 38,
        backgroundColor: colors.border
      }} /> : null}
      </View>
      <View style={{
      flex: 1,
      paddingBottom: last ? 0 : 18
    }}>
        <Text style={{
        color: colors.textPrimary,
        fontSize: 14,
        fontWeight: "800",
        paddingTop: 4
      }}>
          {title}
        </Text>
        <Text style={{
        color: colors.textSecondary,
        fontSize: 12,
        lineHeight: 18,
        marginTop: 4
      }}>
          {text}
        </Text>
      </View>
    </View>;
}
