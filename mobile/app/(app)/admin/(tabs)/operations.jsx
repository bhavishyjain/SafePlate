import { useState } from "react";
import { router } from "expo-router";
import { CircleGauge, HandHeart, Network } from "lucide-react-native";
import Toast from "react-native-toast-message";
import DialogBox from "../../../../components/DialogBox";
import MenuItem from "../../../../components/MenuItem";
import { MetricGrid } from "../../../../components/AdminWidgets";
import { Button, Screen, Surface, Title, useColors } from "../../../../components/ui";
import { runOptimization } from "../../../../services/admin";
import { Text } from "react-native";

export default function AdminOperations() {
  const colors = useColors(); const [confirming, setConfirming] = useState(false); const [running, setRunning] = useState(false); const [result, setResult] = useState(null);
  const optimize = async () => { setRunning(true); try { const next = await runOptimization(); setResult(next); setConfirming(false); Toast.show({ type: "success", text1: "Allocation run complete" }); } catch (error) { Toast.show({ type: "error", text1: "Optimization failed", text2: error.message }); } finally { setRunning(false); } };
  return <Screen><Title subtitle="Allocate pending donations and manage every lifecycle transition.">Operations</Title><Surface style={{ marginBottom: 18 }}><CircleGauge color={colors.primary} size={30} /><Text style={{ color: colors.textPrimary, fontWeight: "900", fontSize: 18, marginTop: 10 }}>Run allocation optimization</Text><Text style={{ color: colors.textSecondary, lineHeight: 20, marginVertical: 8 }}>Expires overdue pending donations, scores eligible nearby NGOs by nutrition need and distance, and creates assignments. Duplicate runs are blocked.</Text><Button title="Run optimization" loading={running} onPress={() => setConfirming(true)} /></Surface>{result ? <><MetricGrid metrics={[{ label: "Assigned", value: result.allocationsCreatedCount, tone: "success" }, { label: "Unmatched", value: result.unmatchedDonationsCount, tone: "warning" }, { label: "Expired", value: result.expiredDonationsDiscarded, tone: "danger" }]} /></> : null}<MenuItem icon={<HandHeart />} title="Donations" subtitle="Filter, inspect, edit, or discard pending donations" onPress={() => router.push("/(app)/admin/donations")} /><MenuItem icon={<Network />} title="Allocations" subtitle="Inspect scores and manage assignment progress" onPress={() => router.push("/(app)/admin/allocations")} /><DialogBox visible={confirming} title="Run allocation now?" message="All eligible pending donations will be evaluated against active NGO profiles." confirmText="Run" loading={running} onConfirm={optimize} onCancel={() => setConfirming(false)} /></Screen>;
}
