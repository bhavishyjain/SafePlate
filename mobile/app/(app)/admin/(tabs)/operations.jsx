import { useState } from "react";
import { router } from "expo-router";
import { ArrowRight, CheckCircle2, Clock3, HandHeart, Network, PackageCheck, Route, Sparkles, TriangleAlert } from "lucide-react-native";
import { Text, View } from "react-native";
import Toast from "react-native-toast-message";
import DialogBox from "../../../../components/DialogBox";
import PressableBlock from "../../../../components/PressableBlock";
import { Button, Screen, Section, Surface, useColors } from "../../../../components/ui";
import { runOptimization } from "../../../../services/admin";
import { useTranslation } from "../../../../utils/i18n/LanguageProvider";
export default function AdminOperations() {
  const {
    tr
  } = useTranslation();
  const colors = useColors();
  const [confirming, setConfirming] = useState(false);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const optimize = async () => {
    setRunning(true);
    try {
      const next = await runOptimization();
      setResult(next);
      setConfirming(false);
      Toast.show({
        type: "success",
        text1: tr("Allocation run complete")
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: tr("Optimization failed"),
        text2: error.message
      });
    } finally {
      setRunning(false);
    }
  };
  return <Screen contentStyle={{
    paddingBottom: 132
  }}>
    <View style={{
      borderRadius: 22,
      padding: 20,
      backgroundColor: colors.primary,
      marginBottom: 22,
      overflow: "hidden"
    }}>
      <View style={{
        position: "absolute",
        width: 150,
        height: 150,
        borderRadius: 75,
        right: -45,
        top: -55,
        backgroundColor: "rgba(255,255,255,0.10)"
      }} />
      <View style={{
        width: 46,
        height: 46,
        borderRadius: 15,
        backgroundColor: "rgba(255,255,255,0.18)",
        alignItems: "center",
        justifyContent: "center"
      }}><Sparkles size={23} color={colors.onPrimary} /></View>
      <Text style={{
        color: colors.onPrimary,
        fontSize: 21,
        fontWeight: "900",
        marginTop: 17
      }}>{tr("Smart allocation")}</Text><Text style={{
        color: colors.onPrimary,
        opacity: 0.78,
        fontSize: 13,
        lineHeight: 19,
        marginTop: 5
      }}>{tr("Match safe pending food with eligible NGOs using nutrition gaps and pickup distance.")}</Text>
      <Button title={tr("Run allocation now")} loading={running} onPress={() => setConfirming(true)} textColor={colors.primary} style={{
        marginTop: 18,
        backgroundColor: colors.onPrimary
      }} />
    </View>

    {result ? <Section title={tr("Latest run")} subtitle={tr("Results from this device session")}><View style={{
        flexDirection: "row",
        gap: 9
      }}><RunMetric icon={CheckCircle2} label={tr("Assigned")} value={result.allocationsCreatedCount} tone={colors.success} colors={colors} /><RunMetric icon={Clock3} label={tr("Unmatched")} value={result.unmatchedDonationsCount} tone={colors.warning} colors={colors} /><RunMetric icon={TriangleAlert} label={tr("Expired")} value={result.expiredDonationsDiscarded} tone={colors.danger} colors={colors} /></View></Section> : null}

    <Section title={tr("How a run works")} subtitle={tr("SafePlate evaluates the full eligible queue")}>
      <Surface>{[{
          icon: HandHeart,
          title: tr("Check pending donations"),
          subtitle: tr("Only safe, confirmed and unexpired food is considered.")
        }, {
          icon: Network,
          title: tr("Score eligible NGOs"),
          subtitle: tr("Nutrition need and distance determine the best match.")
        }, {
          icon: Route,
          title: tr("Create assignments"),
          subtitle: tr("NGOs receive a collection task with pickup details.")
        }].map((item, index) => <View key={item.title} style={{
          flexDirection: "row",
          paddingBottom: index === 2 ? 0 : 17,
          marginBottom: index === 2 ? 0 : 17,
          borderBottomWidth: index === 2 ? 0 : 1,
          borderBottomColor: colors.border
        }}><View style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            backgroundColor: `${colors.primary}16`,
            alignItems: "center",
            justifyContent: "center"
          }}><item.icon size={18} color={colors.primary} /></View><View style={{
            flex: 1,
            marginLeft: 13
          }}><Text style={{
              color: colors.textPrimary,
              fontSize: 14,
              fontWeight: "900"
            }}>{index + 1}. {item.title}</Text><Text style={{
              color: colors.textSecondary,
              fontSize: 12,
              lineHeight: 17,
              marginTop: 3
            }}>{item.subtitle}</Text></View></View>)}</Surface>
    </Section>

    <Section title={tr("Manage activity")}>
      <OperationLink icon={HandHeart} title={tr("Donations")} subtitle={tr("Review pending, assigned and discarded food")} colors={colors} onPress={() => router.push("/(app)/admin/donations")} />
      <OperationLink icon={PackageCheck} title={tr("Allocations")} subtitle={tr("Track every assignment through delivery")} colors={colors} onPress={() => router.push("/(app)/admin/allocations")} />
    </Section>

    <Surface style={{
      flexDirection: "row",
      alignItems: "flex-start",
      borderColor: `${colors.info}55`
    }}><TriangleAlert size={18} color={colors.info} /><View style={{
        flex: 1,
        marginLeft: 11
      }}><Text style={{
          color: colors.textPrimary,
          fontSize: 13,
          fontWeight: "900"
        }}>{tr("Review before rerunning")}</Text><Text style={{
          color: colors.textSecondary,
          fontSize: 12,
          lineHeight: 18,
          marginTop: 3
        }}>{tr("A new run evaluates all currently pending donations. Existing active assignments are kept.")}</Text></View></Surface>

    <DialogBox visible={confirming} title={tr("Run allocation now?")} message={tr("Eligible pending donations will be evaluated against active NGO profiles.")} confirmText={tr("Run allocation")} loading={running} onConfirm={optimize} onCancel={() => setConfirming(false)} />
  </Screen>;
}
function RunMetric({
  icon: Icon,
  label,
  value,
  tone,
  colors
}) {
  return <View style={{
    flex: 1,
    minWidth: 0,
    borderRadius: 15,
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 13
  }}><Icon size={17} color={tone} /><Text style={{
      color: tone,
      fontSize: 22,
      fontWeight: "900",
      marginTop: 11
    }}>{value}</Text><Text style={{
      color: colors.textSecondary,
      fontSize: 10,
      marginTop: 3
    }}>{label}</Text></View>;
}
function OperationLink({
  icon: Icon,
  title,
  subtitle,
  colors,
  onPress
}) {
  return <PressableBlock onPress={onPress} style={{
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 15,
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 15,
    marginBottom: 10
  }}><View style={{
      width: 42,
      height: 42,
      borderRadius: 13,
      backgroundColor: colors.backgroundElevated,
      alignItems: "center",
      justifyContent: "center"
    }}><Icon size={20} color={colors.primary} /></View><View style={{
      flex: 1,
      marginLeft: 13
    }}><Text style={{
        color: colors.textPrimary,
        fontSize: 15,
        fontWeight: "900"
      }}>{title}</Text><Text style={{
        color: colors.textSecondary,
        fontSize: 12,
        marginTop: 3
      }}>{subtitle}</Text></View><ArrowRight size={18} color={colors.textTertiary} /></PressableBlock>;
}
