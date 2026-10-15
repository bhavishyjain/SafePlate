import { useState } from "react";
import { router } from "expo-router";
import { CircleGauge, HandHeart, Network } from "lucide-react-native";
import { Text, View } from "react-native";
import Toast from "react-native-toast-message";
import DialogBox from "../../../../components/DialogBox";
import MenuItem from "../../../../components/MenuItem";
import { MetricGrid } from "../../../../components/AdminWidgets";
import { Button, Screen, Surface, useColors } from "../../../../components/ui";
import { runOptimization } from "../../../../services/admin";

export default function AdminOperations() {
  const colors = useColors();
  const [confirming, setConfirming] = useState(false);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const optimize = async () => { setRunning(true); try { const next = await runOptimization(); setResult(next); setConfirming(false); Toast.show({ type: "success", text1: "Allocation run complete" }); } catch (error) { Toast.show({ type: "error", text1: "Optimization failed", text2: error.message }); } finally { setRunning(false); } };

  return <Screen>
    <View style={{ marginBottom: 24 }}><Text style={{ color: colors.textSecondary, fontSize: 14 }}>Control centre</Text><Text style={{ color: colors.textPrimary, fontSize: 30, fontWeight: "800", marginTop: 2 }}>Operations</Text><Text style={{ color: colors.textSecondary, fontSize: 14, marginTop: 3 }}>Run matching and manage the donation lifecycle.</Text></View>
    <Surface style={{ marginBottom: 22 }}>
      <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}><CircleGauge color={colors.primary} size={24} /><View style={{ flex: 1 }}><Text style={{ color: colors.textPrimary, fontWeight: "700", fontSize: 17 }}>Allocation optimization</Text><Text style={{ color: colors.textSecondary, lineHeight: 19, fontSize: 13, marginTop: 3 }}>Match pending food using nutrition need and distance.</Text></View></View>
      <Button title="Run optimization" loading={running} onPress={() => setConfirming(true)} style={{ marginTop: 18 }} />
    </Surface>
    {result ? <MetricGrid metrics={[{ label: "Assigned", value: result.allocationsCreatedCount, tone: "success" }, { label: "Unmatched", value: result.unmatchedDonationsCount, tone: "warning" }, { label: "Expired", value: result.expiredDonationsDiscarded, tone: "danger" }]} /> : null}
    <Text style={{ color: colors.textPrimary, fontSize: 19, fontWeight: "800", marginBottom: 11 }}>Manage activity</Text>
    <MenuItem icon={<HandHeart />} title="Donations" subtitle="Filter, inspect, edit, or discard donations" onPress={() => router.push("/(app)/admin/donations")} />
    <MenuItem icon={<Network />} title="Allocations" subtitle="Review matches and assignment progress" onPress={() => router.push("/(app)/admin/allocations")} />
    <DialogBox visible={confirming} title="Run allocation now?" message="Eligible pending donations will be evaluated against active NGO profiles." confirmText="Run" loading={running} onConfirm={optimize} onCancel={() => setConfirming(false)} />
  </Screen>;
}
