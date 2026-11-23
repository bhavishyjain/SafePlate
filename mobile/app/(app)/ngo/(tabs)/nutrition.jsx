import { useCallback, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import { ArrowRight, HeartPulse, UsersRound } from "lucide-react-native";
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from "react-native";
import PressableBlock from "../../../../components/PressableBlock";
import { darkColors, lightColors } from "../../../../colors";
import { BENEFICIARY_OPTIONS, labelFor } from "../../../../constants/domain";
import { getMyNgo, getNutritionStatus } from "../../../../services/ngos";
import { useTheme } from "../../../../utils/context/theme";
import { useTranslation } from "../../../../utils/i18n/LanguageProvider";
export default function NutritionDetail() {
  const {
    tr
  } = useTranslation();
  const {
    colorScheme
  } = useTheme();
  const colors = colorScheme === "dark" ? darkColors : lightColors;
  const [state, setState] = useState(null);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const load = useCallback(async () => {
    try {
      setError(null);
      const profile = await getMyNgo();
      setState({
        profile,
        nutrition: await getNutritionStatus(profile._id)
      });
    } catch (requestError) {
      setError(requestError);
    } finally {
      setRefreshing(false);
    }
  }, []);
  useFocusEffect(useCallback(() => {
    load();
  }, [load]));
  const nutrition = state?.nutrition;
  const caloriePercent = nutrition?.targetCalories ? Math.min(100, Math.round(nutrition.deliveredCalories / nutrition.targetCalories * 100)) : 0;
  const proteinPercent = nutrition?.targetProtein ? Math.min(100, Math.round(nutrition.deliveredProtein / nutrition.targetProtein * 100)) : 0;
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
    {!state && !error ? <View style={{
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
      }}>{tr("Couldn’t load nutrition")}</Text><Text style={{
        color: colors.textSecondary,
        marginTop: 5
      }}>{error.message}</Text><PressableBlock onPress={load} style={{
        alignSelf: "flex-start",
        marginTop: 14
      }}><Text style={{
          color: colors.primary,
          fontWeight: "800"
        }}>{tr("Try again")}</Text></PressableBlock></View> : <>
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
          right: -58,
          top: -72,
          backgroundColor: "rgba(255,255,255,0.11)"
        }} />
        <HeartPulse size={25} color={colors.onPrimary} />
        <Text style={{
          color: colors.onPrimary,
          opacity: 0.72,
          fontSize: 12,
          fontWeight: "800",
          marginTop: 18
        }}>{tr("DAILY COVERAGE")}</Text>
        <Text style={{
          color: colors.onPrimary,
          fontSize: 38,
          lineHeight: 45,
          fontWeight: "900",
          marginTop: 2
        }}>{Math.round((caloriePercent + proteinPercent) / 2)}%</Text>
        <Text style={{
          color: colors.onPrimary,
          opacity: 0.75,
          fontSize: 12,
          marginTop: 3
        }}>{tr("Average of calorie and protein progress")}</Text>
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
        <Metric label={tr("Calorie gap")} value={Math.round(nutrition.gapCalories).toLocaleString("en-IN")} suffix="kcal" colors={colors} divider />
        <Metric label={tr("Protein gap")} value={nutrition.gapProtein.toFixed(1)} suffix="grams" colors={colors} divider />
        <Metric label={tr("People served")} value={state.profile.capacity} suffix="people" colors={colors} />
      </View>

      <Text style={{
        color: colors.textPrimary,
        fontSize: 19,
        fontWeight: "500",
        marginBottom: 11
      }}>{tr("Daily progress")}</Text>
      <View style={{
        backgroundColor: colors.backgroundSecondary,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 18,
        padding: 17,
        marginBottom: 24
      }}>
        <Progress label={tr("Calories")} delivered={nutrition.deliveredCalories} target={nutrition.targetCalories} percent={caloriePercent} suffix="kcal" colors={colors} />
        <View style={{
          height: 1,
          backgroundColor: colors.border,
          marginVertical: 17
        }} />
        <Progress label={tr("Protein")} delivered={nutrition.deliveredProtein} target={nutrition.targetProtein} percent={proteinPercent} suffix="g" colors={colors} />
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
          }}>{tr("Beneficiary groups")}</Text><Text style={{
            color: colors.textSecondary,
            fontSize: 12,
            marginTop: 3
          }}>{tr("Used to calculate the daily target")}</Text></View><PressableBlock onPress={() => router.push("/(app)/ngo/(tabs)/profile")} style={{
          flexDirection: "row",
          alignItems: "center"
        }}><Text style={{
            color: colors.primary,
            fontSize: 12,
            fontWeight: "600"
          }}>{tr("Edit")}</Text><ArrowRight size={14} color={colors.primary} style={{
            marginLeft: 4
          }} /></PressableBlock></View>
      {state.profile.beneficiaryGroups.map(group => {
        const option = BENEFICIARY_OPTIONS.find(item => item.value === group.category);
        return <View key={group.category} style={{
          flexDirection: "row",
          alignItems: "center",
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          paddingVertical: 14
        }}><View style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            backgroundColor: `${colors.primary}16`,
            alignItems: "center",
            justifyContent: "center"
          }}><UsersRound size={18} color={colors.primary} /></View><View style={{
            flex: 1,
            marginLeft: 12
          }}><Text style={{
              color: colors.textPrimary,
              fontSize: 13,
              fontWeight: "600"
            }}>{tr(option?.label || labelFor(group.category))}</Text><Text style={{
              color: colors.textSecondary,
              fontSize: 11,
              marginTop: 3
            }}>{option?.calories.toLocaleString("en-IN")} kcal · {option?.protein} {tr("g protein per person")}</Text></View><Text style={{
            color: colors.primary,
            fontSize: 19,
            fontWeight: "600"
          }}>{group.count}</Text></View>;
      })}
    </>}
  </ScrollView>;
}
function Metric({
  label,
  value,
  suffix,
  colors,
  divider = false
}) {
  return <View style={{
    flex: 1,
    minWidth: 0,
    minHeight: 58,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    borderRightWidth: divider ? 1 : 0,
    borderRightColor: colors.border
  }}><Text style={{
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: "600"
    }} numberOfLines={1}>{value}</Text><Text style={{
      color: colors.textSecondary,
      fontSize: 9,
      marginTop: 4,
      textAlign: "center"
    }} numberOfLines={1}>{label}</Text><Text style={{
      color: colors.textTertiary,
      fontSize: 9,
      marginTop: 1
    }} numberOfLines={1}>{suffix}</Text></View>;
}
function Progress({
  label,
  delivered,
  target,
  percent,
  suffix,
  colors
}) {
  const { tr } = useTranslation();
  return <View><View style={{
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-end"
    }}><View><Text style={{
          color: colors.textPrimary,
          fontSize: 14,
          fontWeight: "800"
        }}>{label}</Text><Text style={{
          color: colors.textSecondary,
          fontSize: 11,
          marginTop: 3
        }}>{tr("{{delivered}} of {{target}} {{suffix}}", { delivered: Math.round(delivered).toLocaleString("en-IN"), target: Math.round(target).toLocaleString("en-IN"), suffix })}</Text></View><Text style={{
        color: colors.primary,
        fontSize: 18,
        fontWeight: "900"
      }}>{percent}%</Text></View><View style={{
      height: 9,
      borderRadius: 5,
      backgroundColor: colors.backgroundElevated,
      overflow: "hidden",
      marginTop: 11
    }}><View style={{
        width: `${percent}%`,
        height: "100%",
        backgroundColor: colors.primary,
        borderRadius: 5
      }} /></View></View>;
}
