import { Text, View } from "react-native";
import Svg, { Line, Polyline, Text as SvgText } from "react-native-svg";
import { Button, Surface, useColors } from "./ui";

export function MetricGrid({ metrics }) {
  const colors = useColors();
  return <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 18 }}>{metrics.map((metric) => <Surface key={metric.label} style={{ width: "48%", minHeight: 92 }}><Text style={{ color: colors.textSecondary, fontSize: 12 }}>{metric.label}</Text><Text adjustsFontSizeToFit numberOfLines={1} style={{ color: metric.tone ? colors[metric.tone] : colors.primary, fontSize: 24, fontWeight: "900", marginTop: 8 }}>{metric.value}</Text></Surface>)}</View>;
}

export function DetailRow({ label, value, last = false }) {
  const colors = useColors();
  return <View style={{ flexDirection: "row", gap: 12, paddingVertical: 10, borderBottomWidth: last ? 0 : 1, borderColor: colors.border }}><Text style={{ color: colors.textSecondary, flex: 1 }}>{label}</Text><Text selectable style={{ color: colors.textPrimary, fontWeight: "700", flex: 1.5, textAlign: "right" }}>{value ?? "—"}</Text></View>;
}

export function PaginationFooter({ pagination, onPage, loading }) {
  if (!pagination || pagination.pages <= 1) return null;
  return <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}><Button title="Previous" variant="secondary" disabled={pagination.page <= 1} onPress={() => onPage(pagination.page - 1)} style={{ flex: 1 }} /><Button title={loading ? "Loading…" : `${pagination.page} / ${pagination.pages}`} disabled style={{ flex: 1 }} /><Button title="Next" variant="secondary" disabled={pagination.page >= pagination.pages} onPress={() => onPage(pagination.page + 1)} style={{ flex: 1 }} /></View>;
}

export function WeightTrend({ data = [] }) {
  const colors = useColors();
  if (!data.length) return null;
  const width = 320; const height = 150; const pad = 24;
  const max = Math.max(1, ...data.flatMap((item) => [item.donatedKg, item.deliveredKg]));
  const points = (key) => data.map((item, index) => `${pad + (index * (width - pad * 2)) / Math.max(1, data.length - 1)},${height - pad - (item[key] / max) * (height - pad * 2)}`).join(" ");
  return <Surface style={{ marginBottom: 18 }}><Text style={{ color: colors.textPrimary, fontWeight: "800", marginBottom: 10 }}>Daily weight trend</Text><Svg accessibilityLabel="Daily donated versus delivered kilograms chart" width="100%" height={height} viewBox={`0 0 ${width} ${height}`}><Line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke={colors.border} /><Polyline points={points("donatedKg")} fill="none" stroke={colors.primary} strokeWidth="3" /><Polyline points={points("deliveredKg")} fill="none" stroke={colors.success} strokeWidth="3" /><SvgText x={pad} y={14} fill={colors.primary} fontSize="10">Donated</SvgText><SvgText x={90} y={14} fill={colors.success} fontSize="10">Delivered</SvgText></Svg><View>{data.map((item) => <Text key={item.date} style={{ color: colors.textSecondary, fontSize: 11 }}>{item.date}: {item.donatedKg.toFixed(1)} kg donated · {item.deliveredKg.toFixed(1)} kg delivered</Text>)}</View></Surface>;
}
