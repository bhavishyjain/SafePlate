import { useTheme } from "../utils/context/theme";
import { darkColors, lightColors } from "../colors";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from "react-native";
import { AlertCircle, Inbox } from "lucide-react-native";

export function useColors() {
  const { colorScheme } = useTheme();
  return colorScheme === "dark" ? darkColors : lightColors;
}

export function Screen({ children, scroll = true, refreshing = false, onRefresh, contentStyle }) {
  const colors = useColors();
  const base = { width: "100%", maxWidth: 820, alignSelf: "center", paddingHorizontal: 16, paddingTop: 28, paddingBottom: 116 };
  if (!scroll) return <View style={[{ flex: 1, backgroundColor: colors.backgroundPrimary }, base, contentStyle]}>{children}</View>;
  return <ScrollView style={{ flex: 1, backgroundColor: colors.backgroundPrimary }} contentContainerStyle={[base, contentStyle]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} /> : undefined}>{children}</ScrollView>;
}

export function Title({ children, subtitle, action }) {
  const colors = useColors();
  return <View style={{ marginBottom: 22 }}><View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 14 }}><Text style={{ color: colors.textPrimary, fontSize: 28, lineHeight: 34, fontWeight: "800", flex: 1 }}>{children}</Text>{action}</View>{subtitle ? <Text style={{ color: colors.textSecondary, marginTop: 6, fontSize: 14, lineHeight: 20, maxWidth: 580 }}>{subtitle}</Text> : null}</View>;
}

export function Section({ title, children, style, action, subtitle }) {
  const colors = useColors();
  return <View style={[{ marginBottom: 24 }, style]}>{title ? <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 11 }}><View style={{ flex: 1 }}><Text style={{ color: colors.textPrimary, fontSize: 19, fontWeight: "800" }}>{title}</Text>{subtitle ? <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 3 }}>{subtitle}</Text> : null}</View>{action}</View> : null}{children}</View>;
}

export function Surface({ children, style, onPress, accessibilityLabel }) {
  const colors = useColors();
  const surfaceStyle = [{ backgroundColor: colors.backgroundSecondary, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 16 }, style];
  if (onPress) return <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} onPress={onPress} style={({ pressed }) => [surfaceStyle, { opacity: pressed ? 0.72 : 1 }]}>{children}</Pressable>;
  return <View style={surfaceStyle}>{children}</View>;
}

export function Field({ label, error, multiline, style, ...props }) {
  const colors = useColors();
  return <View style={{ marginBottom: 15 }}><Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: "600", marginBottom: 7 }}>{label}</Text><TextInput accessibilityLabel={props.accessibilityLabel || label} {...props} multiline={multiline} placeholderTextColor={colors.placeholder} selectionColor={colors.primary} style={[{ minHeight: multiline ? 104 : 50, color: colors.textPrimary, backgroundColor: colors.backgroundSecondary, borderWidth: 1, borderColor: error ? colors.danger : colors.borderStrong, borderRadius: 12, paddingHorizontal: 15, paddingVertical: 12, fontSize: 15, textAlignVertical: multiline ? "top" : "center" }, style]} />{error ? <Text accessibilityRole="alert" style={{ color: colors.danger, fontSize: 12, marginTop: 5 }}>{error}</Text> : null}</View>;
}

export function Button({ title, onPress, loading, disabled, variant = "primary", style, icon: Icon }) {
  const colors = useColors();
  const backgroundColor = variant === "danger" ? colors.danger : variant === "secondary" ? colors.backgroundSecondary : variant === "ghost" ? "transparent" : colors.primary;
  const color = variant === "primary" ? colors.onPrimary : variant === "danger" ? colors.light : variant === "ghost" ? colors.primary : colors.textPrimary;
  return <Pressable accessibilityRole="button" accessibilityLabel={title} accessibilityState={{ disabled: Boolean(disabled || loading), busy: Boolean(loading) }} disabled={disabled || loading} onPress={onPress} style={({ pressed }) => [{ minHeight: 50, borderRadius: 10, flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", paddingHorizontal: 16, backgroundColor, borderWidth: variant === "secondary" ? 1 : 0, borderColor: colors.borderStrong, opacity: disabled || loading ? 0.5 : pressed ? 0.76 : 1 }, style]}>{loading ? <ActivityIndicator color={color} /> : <>{Icon ? <Icon color={color} size={18} /> : null}<Text style={{ color, fontWeight: "800", fontSize: 15 }}>{title}</Text></>}</Pressable>;
}

const statusTone = { PENDING: "warning", ASSIGNED: "info", PICKED_UP: "primary", DELIVERED: "success", DISCARDED: "danger", REJECTED: "danger", CANCELLED: "muted", CATALOG: "success", GEMINI_ESTIMATE: "info", ADMIN_OVERRIDE: "warning", ACTIVE: "success", INACTIVE: "muted", DISABLED: "danger" };
export function StatusBadge({ status }) {
  const colors = useColors(); const color = colors[statusTone[status] || "muted"] || colors.muted;
  return <View style={{ alignSelf: "flex-start", paddingHorizontal: 9, paddingVertical: 5, borderRadius: 7, backgroundColor: `${color}20` }}><Text style={{ color, fontSize: 10, fontWeight: "800" }}>{status?.replaceAll("_", " ")}</Text></View>;
}

export function LoadingState({ label = "Loading…" }) { const colors = useColors(); return <View style={{ paddingVertical: 46, alignItems: "center" }}><ActivityIndicator color={colors.primary} size="large" /><Text style={{ color: colors.textSecondary, marginTop: 12 }}>{label}</Text></View>; }
export function EmptyState({ title = "Nothing here yet", message }) { const colors = useColors(); return <Surface style={{ paddingVertical: 34, alignItems: "center" }}><Inbox color={colors.textSecondary} size={30} /><Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: "700", marginTop: 12 }}>{title}</Text>{message ? <Text style={{ color: colors.textSecondary, textAlign: "center", lineHeight: 19, marginTop: 5, maxWidth: 320 }}>{message}</Text> : null}</Surface>; }
export function ErrorState({ message, onRetry }) { const colors = useColors(); return <Surface style={{ paddingVertical: 32, alignItems: "center" }}><AlertCircle color={colors.danger} size={30} /><Text style={{ color: colors.textPrimary, textAlign: "center", lineHeight: 20, marginVertical: 12, maxWidth: 340 }}>{message}</Text>{onRetry ? <Button title="Try again" onPress={onRetry} variant="secondary" style={{ minWidth: 140 }} /> : null}</Surface>; }

export function FilterChips({ values, value, onChange }) {
  const colors = useColors();
  return <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 16 }}>{values.map((item) => { const selected = item.value === value; return <Pressable accessibilityRole="button" accessibilityState={{ selected }} accessibilityLabel={`Filter: ${item.label}`} key={String(item.value)} onPress={() => onChange(item.value)} style={({ pressed }) => ({ minHeight: 40, justifyContent: "center", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: selected ? colors.primary : colors.backgroundSecondary, borderWidth: 1, borderColor: selected ? colors.primary : colors.border, opacity: pressed ? 0.72 : 1 })}><Text style={{ color: selected ? colors.onPrimary : colors.textPrimary, fontWeight: "700", fontSize: 12 }}>{item.label}</Text></Pressable>; })}</ScrollView>;
}
