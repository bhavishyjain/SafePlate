import { ChevronRight, Clock3, PackageOpen } from "lucide-react-native";
import { Text, View } from "react-native";
import { darkColors, lightColors } from "../colors";
import { formatDateTime, labelFor } from "../constants/domain";
import { useTheme } from "../utils/context/theme";
import PressableBlock from "./PressableBlock";
import { useTranslation } from "../utils/i18n/LanguageProvider";
const statusColors = colors => ({
  PENDING: colors.warning,
  ASSIGNED: colors.info,
  PICKED_UP: colors.primary,
  DELIVERED: colors.success,
  DISCARDED: colors.danger
});
export default function DonationCard({
  donation,
  onPress
}) {
  const {
    tr
  } = useTranslation();
  const {
    colorScheme
  } = useTheme();
  const colors = colorScheme === "dark" ? darkColors : lightColors;
  const title = donation.items?.map(item => item.name).join(", ") || tr("Food donation");
  const tone = statusColors(colors)[donation.status] || colors.muted;
  const itemCount = donation.items?.length || 0;
  return <PressableBlock accessibilityRole="button" accessibilityLabel={`${tr("View")} ${title}`} onPress={onPress} style={{
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 8
  }}>
    <View style={{
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 12
    }}>
      <View style={{
        width: 42,
        height: 42,
        borderRadius: 12,
        backgroundColor: `${colors.primary}18`,
        alignItems: "center",
        justifyContent: "center"
      }}>
        <PackageOpen size={20} color={colors.primary} />
      </View>
      <View style={{
        flex: 1
      }}>
        <Text style={{
          color: colors.textPrimary,
          fontSize: 16,
          lineHeight: 21,
        fontWeight: "600"
        }} numberOfLines={2}>{title}</Text>
        <Text style={{
          color: colors.textSecondary,
          fontSize: 12,
          marginTop: 4
        }}>{itemCount} {tr(itemCount === 1 ? "item" : "items")} · {tr(labelFor(donation.packagingType))}</Text>
      </View>
      <View style={{
        flexShrink: 0,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: `${tone}66`,
        backgroundColor: `${tone}14`
      }}>
        <Text style={{
          color: tone,
          fontSize: 10,
          fontWeight: "600"
        }} numberOfLines={1}>{tr(labelFor(donation.status)).toUpperCase()}</Text>
      </View>
    </View>

    <View style={{
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 14
    }} />

    <View style={{
      flexDirection: "row",
      alignItems: "center"
    }}>
      <Text style={{
        color: colors.primary,
        fontSize: 18,
      fontWeight: "600"
      }}>{Number(donation.quantityKg || 0).toFixed(2)}</Text>
      <Text style={{
        color: colors.primary,
        fontSize: 12,
        fontWeight: "800",
        marginLeft: 3
      }}>{tr("kg")}</Text>
      <View style={{
        width: 1,
        height: 24,
        backgroundColor: colors.border,
        marginHorizontal: 13
      }} />
      <Clock3 size={15} color={colors.textSecondary} />
      <Text style={{
        color: colors.textSecondary,
        fontSize: 12,
        marginLeft: 7,
        flex: 1
      }} numberOfLines={1}>{donation.status === "DELIVERED" ? tr("Delivered") : tr("Pickup by")} {formatDateTime(donation.pickupDeadline)}</Text>
      <ChevronRight size={18} color={colors.textSecondary} />
    </View>
  </PressableBlock>;
}
