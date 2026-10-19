import { useCallback, useState } from "react";
import { Linking, ActivityIndicator, ScrollView, Text, View } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { CalendarClock, Mail, MapPin, Navigation, PackageOpen, Phone, Scale, Trash2, UserRound } from "lucide-react-native";
import Toast from "react-native-toast-message";
import BackButtonHeader from "../../../../components/BackButtonHeader";
import DialogBox from "../../../../components/DialogBox";
import PressableBlock from "../../../../components/PressableBlock";
import SwipeButton from "../../../../components/SwipeButton";
import { darkColors, lightColors } from "../../../../colors";
import { confirmDelivery, confirmPickup, getAllocation, rejectAllocation } from "../../../../services/allocations";
import { getDonation } from "../../../../services/donations";
import { formatDateTime, labelFor, nutritionTotals } from "../../../../constants/domain";
import { useTheme } from "../../../../utils/context/theme";
import { useTranslation } from "../../../../utils/i18n/LanguageProvider";
const JOURNEY = ["ASSIGNED", "PICKED_UP", "DELIVERED"];
export default function AssignmentDetail() {
  const {
    tr
  } = useTranslation();
  const {
    id
  } = useLocalSearchParams();
  const {
    colorScheme
  } = useTheme();
  const colors = colorScheme === "dark" ? darkColors : lightColors;
  const [state, setState] = useState(null);
  const [error, setError] = useState(null);
  const [reason, setReason] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [loading, setLoading] = useState(false);
  const load = useCallback(async () => {
    try {
      setError(null);
      const allocation = await getAllocation(id);
      const donation = await getDonation(allocation.donationId._id || allocation.donationId);
      setState({
        allocation,
        donation
      });
    } catch (requestError) {
      setError(requestError);
    }
  }, [id]);
  useFocusEffect(useCallback(() => {
    load();
  }, [load]));
  const mutate = async (action, success) => {
    setLoading(true);
    try {
      await action(id);
      Toast.show({
        type: "success",
        text1: success
      });
      await load();
    } catch (requestError) {
      Toast.show({
        type: "error",
        text1: tr("Action failed"),
        text2: requestError.message
      });
    } finally {
      setLoading(false);
    }
  };
  const reject = async () => {
    if (!reason.trim()) return Toast.show({
      type: "error",
      text1: tr("Enter a rejection reason")
    });
    setLoading(true);
    try {
      await rejectAllocation(id, reason.trim());
      setRejecting(false);
      Toast.show({
        type: "success",
        text1: tr("Assignment rejected"),
        text2: tr("SafePlate attempted reassignment.")
      });
      router.replace("/(app)/ngo/(tabs)/assignments");
    } catch (requestError) {
      Toast.show({
        type: "error",
        text1: tr("Rejection failed"),
        text2: requestError.message
      });
    } finally {
      setLoading(false);
    }
  };
  const donation = state?.donation;
  const allocation = state?.allocation;
  const totals = nutritionTotals(donation?.items);
  const journeyIndex = JOURNEY.indexOf(allocation?.status);
  const tone = allocation?.status === "DELIVERED" ? colors.success : allocation?.status === "PICKED_UP" ? colors.warning : allocation?.status === "ASSIGNED" ? colors.info : colors.danger;
  return <View style={{
    flex: 1,
    backgroundColor: colors.backgroundPrimary
  }}>
    <BackButtonHeader title={tr("Assignment details")} />
    {!state && !error ? <View style={{
      flex: 1,
      alignItems: "center",
      justifyContent: "center"
    }}><ActivityIndicator size="large" color={colors.primary} /></View> : error ? <View style={{
      margin: 16,
      backgroundColor: colors.backgroundSecondary,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      padding: 20
    }}><Text style={{
        color: colors.textPrimary,
        fontWeight: "800"
      }}>{tr("Couldn’t load this assignment")}</Text><Text style={{
        color: colors.textSecondary,
        marginTop: 5
      }}>{error.message}</Text><PressableBlock onPress={load} style={{
        alignSelf: "flex-start",
        marginTop: 14
      }}><Text style={{
          color: colors.primary,
          fontWeight: "800"
        }}>{tr("Try again")}</Text></PressableBlock></View> : <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{
      width: "100%",
      maxWidth: 820,
      alignSelf: "center",
      padding: 16,
      paddingBottom: 42
    }}>
      <View style={{
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 14,
        marginBottom: 20
      }}><View style={{
          width: 48,
          height: 48,
          borderRadius: 15,
          backgroundColor: `${colors.primary}18`,
          alignItems: "center",
          justifyContent: "center"
        }}><PackageOpen size={23} color={colors.primary} /></View><View style={{
          flex: 1
        }}><Text style={{
            color: colors.textPrimary,
            fontSize: 23,
            lineHeight: 29,
            fontWeight: "900"
          }}>{donation.items.map(item => item.name).join(", ")}</Text><Text style={{
            color: colors.textSecondary,
            fontSize: 12,
            marginTop: 5
          }}>{tr("Assigned")}{formatDateTime(allocation.assignedAt)}</Text></View><View style={{
          backgroundColor: `${tone}18`,
          borderRadius: 8,
          paddingHorizontal: 9,
          paddingVertical: 6
        }}><Text style={{
            color: tone,
            fontSize: 10,
            fontWeight: "900"
          }}>{tr(labelFor(allocation.status)).toUpperCase()}</Text></View></View>

      <View style={{
        backgroundColor: colors.backgroundSecondary,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 18,
        padding: 17,
        marginBottom: 20
      }}><Text style={{
          color: colors.textPrimary,
          fontSize: 16,
          fontWeight: "900",
          marginBottom: 15
        }}>{tr("Collection progress")}</Text><View style={{
          flexDirection: "row"
        }}>{JOURNEY.map((status, index) => {
            const complete = index <= journeyIndex;
            return <View key={status} style={{
              flex: 1,
              alignItems: "center"
            }}><View style={{
                flexDirection: "row",
                alignItems: "center",
                width: "100%"
              }}>{index ? <View style={{
                  height: 2,
                  flex: 1,
                  backgroundColor: complete ? colors.primary : colors.border
                }} /> : <View style={{
                  flex: 1
                }} />}<View style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: complete ? colors.primary : colors.backgroundElevated,
                  alignItems: "center",
                  justifyContent: "center"
                }}><Text style={{
                    color: complete ? colors.onPrimary : colors.textSecondary,
                    fontSize: 10,
                    fontWeight: "900"
                  }}>{index + 1}</Text></View>{index < JOURNEY.length - 1 ? <View style={{
                  height: 2,
                  flex: 1,
                  backgroundColor: index < journeyIndex ? colors.primary : colors.border
                }} /> : <View style={{
                  flex: 1
                }} />}</View><Text style={{
                color: complete ? colors.textPrimary : colors.textSecondary,
                fontSize: 10,
                fontWeight: complete ? "800" : "600",
                marginTop: 7
              }}>{tr(labelFor(status))}</Text></View>;
          })}</View></View>

      <View style={{
        flexDirection: "row",
        gap: 10,
        marginBottom: 20
      }}><Summary icon={Scale} label={tr("Weight")} value={`${donation.quantityKg.toFixed(2)} kg`} colors={colors} /><Summary icon={PackageOpen} label={tr("Food items")} value={donation.items.length} colors={colors} /><Summary icon={CalendarClock} label={tr("Calories")} value={Math.round(totals.calories)} colors={colors} /></View>

      <Text style={{
        color: colors.textPrimary,
        fontSize: 18,
        fontWeight: "900",
        marginBottom: 11
      }}>{tr("Pickup information")}</Text>
      <View style={{
        backgroundColor: colors.backgroundSecondary,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 16,
        paddingHorizontal: 16,
        marginBottom: 10
      }}><Detail icon={CalendarClock} label={tr("Pickup deadline")} value={formatDateTime(donation.pickupDeadline)} colors={colors} /><Detail icon={PackageOpen} label={tr("Packaging")} value={tr(labelFor(donation.packagingType))} colors={colors} /><Detail icon={MapPin} label={tr("Coordinates")} value={`${donation.location.coordinates[1].toFixed(5)}, ${donation.location.coordinates[0].toFixed(5)}`} colors={colors} last /></View>
      <PressableBlock onPress={() => {
        const [lng, lat] = donation.location.coordinates;
        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
      }} style={{
        height: 49,
        borderRadius: 13,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.backgroundSecondary,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 22
      }}><Navigation size={17} color={colors.primary} /><Text style={{
          color: colors.primary,
          fontWeight: "900",
          marginLeft: 7
        }}>{tr("Open pickup in Maps")}</Text></PressableBlock>

      <Text style={{
        color: colors.textPrimary,
        fontSize: 18,
        fontWeight: "900",
        marginBottom: 11
      }}>{tr("Food and nutrition")}</Text>
      {donation.items.map(item => <View key={item._id || item.name} style={{
        backgroundColor: colors.backgroundSecondary,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 15,
        padding: 15,
        marginBottom: 10
      }}><View style={{
          flexDirection: "row",
          justifyContent: "space-between",
          gap: 12
        }}><Text style={{
            color: colors.textPrimary,
            fontSize: 15,
            fontWeight: "800",
            flex: 1
          }}>{item.name}</Text><Text style={{
            color: colors.primary,
            fontSize: 13,
            fontWeight: "900"
          }}>{item.quantityGrams} g</Text></View><Text style={{
          color: colors.textSecondary,
          fontSize: 12,
          marginTop: 8
        }}>{item.nutritionPer100g.calories} kcal · {item.nutritionPer100g.proteinGrams} {tr("g protein / 100 g")}</Text></View>)}

      <Text style={{
        color: colors.textPrimary,
        fontSize: 18,
        fontWeight: "900",
        marginTop: 12,
        marginBottom: 11
      }}>{tr("Donor contact")}</Text>
      <View style={{
        backgroundColor: colors.backgroundSecondary,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 16,
        paddingHorizontal: 16,
        marginBottom: 22
      }}><Detail icon={UserRound} label={tr("Donor")} value={donation.donorId?.name || "—"} colors={colors} /><Detail icon={Phone} label={tr("Phone")} value={donation.donorId?.phone || "—"} colors={colors} /><Detail icon={Mail} label={tr("Email")} value={donation.donorId?.email || "—"} colors={colors} last /></View>

      {allocation.status === "ASSIGNED" ? <View style={{
        gap: 12
      }}><SwipeButton title={tr("Swipe to confirm pickup")} loader={loading} onSwipeSuccess={() => mutate(confirmPickup, "Pickup confirmed")} /><PressableBlock onPress={() => setRejecting(true)} style={{
          height: 49,
          borderRadius: 13,
          borderWidth: 1,
          borderColor: colors.danger,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center"
        }}><Trash2 size={17} color={colors.danger} /><Text style={{
            color: colors.danger,
            fontWeight: "900",
            marginLeft: 7
          }}>{tr("Reject assignment")}</Text></PressableBlock></View> : null}
      {allocation.status === "PICKED_UP" ? <SwipeButton type="success" title={tr("Swipe to confirm delivery")} loader={loading} onSwipeSuccess={() => mutate(confirmDelivery, "Delivery confirmed")} /> : null}
    </ScrollView>}
    <DialogBox visible={rejecting} title={tr("Reject assignment?")} message={tr("The donation will return to Pending and SafePlate will try another eligible NGO.")} showInput inputValue={reason} onInputChange={setReason} inputPlaceholder={tr("Reason for rejection")} confirmText={tr("Reject")} onConfirm={reject} onCancel={() => setRejecting(false)} loading={loading} confirmButtonStyle={{
      backgroundColor: colors.danger
    }} />
  </View>;
}
function Summary({
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
  }}><Icon size={16} color={colors.primary} /><Text style={{
      color: colors.textPrimary,
      fontSize: 14,
      fontWeight: "900",
      marginTop: 10
    }} numberOfLines={1}>{value}</Text><Text style={{
      color: colors.textSecondary,
      fontSize: 9,
      marginTop: 3
    }} numberOfLines={1}>{label}</Text></View>;
}
function Detail({
  icon: Icon,
  label,
  value,
  colors,
  last
}) {
  return <View style={{
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: last ? 0 : 1,
    borderBottomColor: colors.border
  }}><Icon size={17} color={colors.textSecondary} /><View style={{
      flex: 1,
      marginLeft: 12
    }}><Text style={{
        color: colors.textSecondary,
        fontSize: 10
      }}>{label}</Text><Text style={{
        color: colors.textPrimary,
        fontSize: 13,
        fontWeight: "700",
        marginTop: 2
      }}>{value}</Text></View></View>;
}
