import { Fragment } from "react";
import { Text, View } from "react-native";
import Svg, { Circle, Line, Path, Text as SvgText } from "react-native-svg";
import { Button, Surface, useColors } from "./ui";
import { useTranslation } from "../utils/i18n/LanguageProvider";
export function MetricGrid({
  metrics
}) {
  const colors = useColors();
  return <View style={{
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 24
  }}>{metrics.map(metric => <Surface key={metric.label} style={{
      width: "48%",
      minHeight: 112,
      justifyContent: "space-between"
    }}><Text style={{
        color: colors.textSecondary,
        fontSize: 12,
        fontWeight: "600"
      }}>{metric.label}</Text><Text adjustsFontSizeToFit numberOfLines={1} style={{
        color: metric.tone ? colors[metric.tone] : colors.textPrimary,
        fontSize: 25,
        fontWeight: "800",
        marginTop: 15,
        letterSpacing: -0.4
      }}>{metric.value}</Text></Surface>)}</View>;
}
export function DetailRow({
  label,
  value,
  last = false
}) {
  const colors = useColors();
  return <View style={{
    flexDirection: "row",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: last ? 0 : 1,
    borderColor: colors.border
  }}><Text style={{
      color: colors.textSecondary,
      flex: 1
    }}>{label}</Text><Text selectable style={{
      color: colors.textPrimary,
      fontWeight: "700",
      flex: 1.5,
      textAlign: "right"
    }}>{value ?? "—"}</Text></View>;
}
export function PaginationFooter({
  pagination,
  onPage,
  loading
}) {
  const {
    tr
  } = useTranslation();
  if (!pagination || pagination.pages <= 1) return null;
  return <View style={{
    flexDirection: "row",
    gap: 10,
    marginTop: 10
  }}><Button title={tr("Previous")} variant="secondary" disabled={pagination.page <= 1} onPress={() => onPage(pagination.page - 1)} style={{
      flex: 1
    }} /><Button title={loading ? tr("Loading…") : `${pagination.page} / ${pagination.pages}`} disabled style={{
      flex: 1
    }} /><Button title={tr("Next")} variant="secondary" disabled={pagination.page >= pagination.pages} onPress={() => onPage(pagination.page + 1)} style={{
      flex: 1
    }} /></View>;
}
export function WeightTrend({
  data = []
}) {
  const {
    tr
  } = useTranslation();
  const colors = useColors();
  if (!data.length) return null;
  const width = 320;
  const height = 176;
  const horizontalPad = 28;
  const topPad = 18;
  const bottomPad = 30;
  const max = Math.max(1, ...data.flatMap(item => [item.donatedKg, item.deliveredKg]));
  const coordinates = key => data.map((item, index) => ({
    x: horizontalPad + index * (width - horizontalPad * 2) / Math.max(1, data.length - 1),
    y: height - bottomPad - Number(item[key] || 0) / max * (height - topPad - bottomPad)
  }));
  const smoothPath = points => {
    if (!points.length) return "";
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
    return points.slice(1).reduce((path, point, index) => {
      const previous = points[index];
      const midpoint = (previous.x + point.x) / 2;
      return `${path} C ${midpoint} ${previous.y}, ${midpoint} ${point.y}, ${point.x} ${point.y}`;
    }, `M ${points[0].x} ${points[0].y}`);
  };
  const donated = coordinates("donatedKg");
  const delivered = coordinates("deliveredKg");
  return <Surface style={{
    marginBottom: 18
  }}><Text style={{
      color: colors.textPrimary,
      fontSize: 17,
      fontWeight: "800",
      marginBottom: 6
    }}>{tr("Daily weight trend")}</Text><Text style={{
      color: colors.textSecondary,
      fontSize: 12,
      marginBottom: 14
    }}>{tr("Food donated and successfully delivered")}</Text><View style={{
      flexDirection: "row",
      gap: 16,
      marginBottom: 4
    }}><View style={{ flexDirection: "row", alignItems: "center" }}><View style={{ width: 16, height: 3, borderRadius: 2, backgroundColor: colors.primary, marginRight: 6 }} /><Text style={{ color: colors.textSecondary, fontSize: 11 }}>{tr("Donated")}</Text></View><View style={{ flexDirection: "row", alignItems: "center" }}><View style={{ width: 16, height: 3, borderRadius: 2, backgroundColor: colors.success, marginRight: 6 }} /><Text style={{ color: colors.textSecondary, fontSize: 11 }}>{tr("Delivered")}</Text></View></View><Svg accessibilityLabel={tr("Daily donated versus delivered kilograms chart")} width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>{[0, 0.5, 1].map((ratio, index) => {
      const y = topPad + ratio * (height - topPad - bottomPad);
      const value = Math.round(max * (1 - ratio));
      return <Fragment key={index}><Line x1={horizontalPad} y1={y} x2={width - horizontalPad} y2={y} stroke={colors.border} strokeWidth="1" /><SvgText x={horizontalPad - 5} y={y + 3} textAnchor="end" fill={colors.textTertiary} fontSize="8">{value}</SvgText></Fragment>;
    })}<Path d={smoothPath(donated)} fill="none" stroke={colors.primary} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /><Path d={smoothPath(delivered)} fill="none" stroke={colors.success} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />{donated.map((point, index) => <Circle key={`d-${index}`} cx={point.x} cy={point.y} r="2.5" fill={colors.backgroundSecondary} stroke={colors.primary} strokeWidth="2" />)}{delivered.map((point, index) => <Circle key={`v-${index}`} cx={point.x} cy={point.y} r="2.5" fill={colors.backgroundSecondary} stroke={colors.success} strokeWidth="2" />)}</Svg><View style={{
      flexDirection: "row",
      justifyContent: "space-between"
    }}><Text style={{
        color: colors.textSecondary,
        fontSize: 11
      }}>{data[0].date}</Text><Text style={{
        color: colors.textSecondary,
        fontSize: 11
      }}>{data[data.length - 1].date}</Text></View></Surface>;
}
