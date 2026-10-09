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
  if (!scroll) return <View style={[{ flex: 1, backgroundColor: colors.backgroundPrimary }, contentStyle]}>{children}</View>;
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.backgroundPrimary }}
      contentContainerStyle={[{ padding: 16, paddingBottom: 112 }, contentStyle]}
      keyboardShouldPersistTaps="handled"
      refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} /> : undefined}
    >
      {children}
    </ScrollView>
  );
}

export function Title({ children, subtitle }) {
  const colors = useColors();
  return <View style={{ marginBottom: 20 }}><Text style={{ color: colors.textPrimary, fontSize: 28, fontWeight: "800" }}>{children}</Text>{subtitle ? <Text style={{ color: colors.textSecondary, marginTop: 5, lineHeight: 20 }}>{subtitle}</Text> : null}</View>;
}

export function Section({ title, children, style }) {
  const colors = useColors();
  return <View style={[{ marginBottom: 18 }, style]}>{title ? <Text style={{ color: colors.textPrimary, fontSize: 17, fontWeight: "700", marginBottom: 10 }}>{title}</Text> : null}{children}</View>;
}

export function Surface({ children, style, onPress, accessibilityLabel }) {
  const colors = useColors();
  const body = <View style={[{ backgroundColor: colors.backgroundSecondary, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 16 }, style]}>{children}</View>;
  return onPress ? <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}>{body}</Pressable> : body;
}

export function Field({ label, error, multiline, style, ...props }) {
  const colors = useColors();
  return <View style={{ marginBottom: 14 }}><Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: "600", marginBottom: 7 }}>{label}</Text><TextInput accessibilityLabel={props.accessibilityLabel || label} {...props} multiline={multiline} placeholderTextColor={colors.placeholder} style={[{ minHeight: multiline ? 92 : 50, color: colors.textPrimary, backgroundColor: colors.backgroundSecondary, borderWidth: 1, borderColor: error ? colors.danger : colors.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, textAlignVertical: multiline ? "top" : "center" }, style]} />{error ? <Text accessibilityRole="alert" style={{ color: colors.danger, fontSize: 12, marginTop: 5 }}>{error}</Text> : null}</View>;
}

export function Button({ title, onPress, loading, disabled, variant = "primary", style }) {
  const colors = useColors();
  const backgroundColor = variant === "danger" ? colors.danger : variant === "secondary" ? colors.backgroundSecondary : colors.primary;
  const color = variant === "primary" ? colors.dark : colors.textPrimary;
  return <Pressable accessibilityRole="button" accessibilityLabel={title} accessibilityState={{ disabled: Boolean(disabled || loading), busy: Boolean(loading) }} disabled={disabled || loading} onPress={onPress} style={({ pressed }) => [{ minHeight: 50, borderRadius: 10, alignItems: "center", justifyContent: "center", paddingHorizontal: 16, backgroundColor, borderWidth: variant === "secondary" ? 1 : 0, borderColor: colors.border, opacity: disabled || loading ? 0.5 : pressed ? 0.78 : 1 }, style]}>{loading ? <ActivityIndicator color={color} /> : <Text style={{ color, fontWeight: "800", fontSize: 15 }}>{title}</Text>}</Pressable>;
}

const statusTone = { PENDING: "warning", ASSIGNED: "info", PICKED_UP: "primary", DELIVERED: "success", DISCARDED: "danger", REJECTED: "danger", CANCELLED: "muted", CATALOG: "success", GEMINI_ESTIMATE: "info", ADMIN_OVERRIDE: "warning", ACTIVE: "success", INACTIVE: "muted", DISABLED: "danger" };
export function StatusBadge({ status }) {
  const colors = useColors();
  const tone = statusTone[status] || "muted";
  const color = colors[tone] || colors.muted;
  return <View style={{ alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: `${color}22`, borderWidth: 1, borderColor: color }}><Text style={{ color, fontSize: 11, fontWeight: "800" }}>{status?.replaceAll("_", " ")}</Text></View>;
}

export function LoadingState({ label = "Loading…" }) { const colors = useColors(); return <View style={{ padding: 32, alignItems: "center" }}><ActivityIndicator color={colors.primary} /><Text style={{ color: colors.textSecondary, marginTop: 12 }}>{label}</Text></View>; }
export function EmptyState({ title = "Nothing here yet", message }) { const colors = useColors(); return <View style={{ padding: 34, alignItems: "center" }}><Inbox color={colors.textSecondary} size={34} /><Text style={{ color: colors.textPrimary, fontWeight: "700", marginTop: 12 }}>{title}</Text>{message ? <Text style={{ color: colors.textSecondary, textAlign: "center", marginTop: 6 }}>{message}</Text> : null}</View>; }
export function ErrorState({ message, onRetry }) { const colors = useColors(); return <View style={{ padding: 28, alignItems: "center" }}><AlertCircle color={colors.danger} size={34} /><Text style={{ color: colors.textPrimary, textAlign: "center", marginVertical: 12 }}>{message}</Text>{onRetry ? <Button title="Try again" onPress={onRetry} variant="secondary" style={{ width: 150 }} /> : null}</View>; }

export function FilterChips({ values, value, onChange }) {
  const colors = useColors();
  return <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 12 }}>{values.map((item) => { const selected = item.value === value; return <Pressable accessibilityRole="button" accessibilityState={{ selected }} accessibilityLabel={`Filter: ${item.label}`} key={String(item.value)} onPress={() => onChange(item.value)} style={{ minHeight: 44, justifyContent: "center", paddingHorizontal: 13, paddingVertical: 8, borderRadius: 999, backgroundColor: selected ? colors.primary : colors.backgroundSecondary, borderWidth: 1, borderColor: selected ? colors.primary : colors.border }}><Text style={{ color: selected ? colors.dark : colors.textPrimary, fontWeight: "700", fontSize: 12 }}>{item.label}</Text></Pressable>; })}</ScrollView>;
}
