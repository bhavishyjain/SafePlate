import { useCallback, useState } from "react";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { CalendarClock, Edit3, MapPin, PackageOpen, Scale, Trash2 } from "lucide-react-native";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import Toast from "react-native-toast-message";
import BackButtonHeader from "../../../../components/BackButtonHeader";
import DialogBox from "../../../../components/DialogBox";
import PressableBlock from "../../../../components/PressableBlock";
import { darkColors, lightColors } from "../../../../colors";
import { discardDonation, getDonation } from "../../../../services/donations";
import { formatDateTime, labelFor, nutritionTotals } from "../../../../constants/domain";
import { useTheme } from "../../../../utils/context/theme";
import { useTranslation } from "../../../../utils/i18n/LanguageProvider";
const JOURNEY = ["PENDING", "ASSIGNED", "PICKED_UP", "DELIVERED"];
export default function DonationDetail() {
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
  const [donation, setDonation] = useState(null);
  const [error, setError] = useState(null);
  const [reason, setReason] = useState("");
  const [showDiscard, setShowDiscard] = useState(false);
  const [loading, setLoading] = useState(false);
  const load = useCallback(async () => {
    try {
      setError(null);
      setDonation(await getDonation(id));
    } catch (requestError) {
      setError(requestError);
    }
  }, [id]);
  useFocusEffect(useCallback(() => {
    load();
  }, [load]));
  const discard = async () => {
    if (!reason.trim()) return Toast.show({
      type: "error",
      text1: tr("Enter a reason")
    });
    setLoading(true);
    try {
      setDonation(await discardDonation(id, reason.trim()));
      setShowDiscard(false);
      Toast.show({
        type: "success",
        text1: tr("Donation discarded")
      });
    } catch (requestError) {
      Toast.show({
        type: "error",
        text1: tr("Could not discard"),
        text2: requestError.message
      });
    } finally {
      setLoading(false);
    }
  };
  const totals = nutritionTotals(donation?.items);
  const statusIndex = JOURNEY.indexOf(donation?.status);
  const statusTone = donation?.status === "DISCARDED" ? colors.danger : donation?.status === "DELIVERED" ? colors.success : donation?.status === "PENDING" ? colors.warning : colors.primary;
  return <View style={{
    flex: 1,
    backgroundColor: colors.backgroundPrimary
  }}>
    <BackButtonHeader title={tr("Donation details")} />
    {!donation && !error ? <View style={{
      flex: 1,
      alignItems: "center",
      justifyContent: "center"
    }}><ActivityIndicator size="large" color={colors.primary} /></View> : error ? <View style={{
      margin: 16,
      borderRadius: 16,
      padding: 20,
      backgroundColor: colors.backgroundSecondary,
      borderWidth: 1,
      borderColor: colors.border
    }}><Text style={{
        color: colors.textPrimary,
        fontWeight: "800"
      }}>{tr("Couldn’t load this donation")}</Text><Text style={{
        color: colors.textSecondary,
        marginTop: 5
      }}>{error.message}</Text><PressableBlock onPress={load} style={{
        marginTop: 14,
        alignSelf: "flex-start"
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
      }}>
        <View style={{
          width: 48,
          height: 48,
          borderRadius: 15,
          backgroundColor: `${colors.primary}18`,
          alignItems: "center",
          justifyContent: "center"
        }}><PackageOpen size={23} color={colors.primary} /></View>
        <View style={{
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
          }}>{tr("Created")}{formatDateTime(donation.createdAt)}</Text></View>
        <View style={{
          backgroundColor: `${statusTone}18`,
          borderRadius: 8,
          paddingHorizontal: 9,
          paddingVertical: 6
        }}><Text style={{
            color: statusTone,
            fontSize: 10,
            fontWeight: "900"
          }}>{tr(labelFor(donation.status)).toUpperCase()}</Text></View>
      </View>

      {donation.status !== "DISCARDED" ? <View style={{
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
        }}>{tr("Donation journey")}</Text><View style={{
          flexDirection: "row"
        }}>{JOURNEY.map((status, index) => {
            const completed = index <= statusIndex;
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
                  backgroundColor: completed ? colors.primary : colors.border
                }} /> : <View style={{
                  flex: 1
                }} />}<View style={{
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  backgroundColor: completed ? colors.primary : colors.backgroundElevated,
                  alignItems: "center",
                  justifyContent: "center"
                }}><Text style={{
                    color: completed ? colors.onPrimary : colors.textSecondary,
                    fontSize: 10,
                    fontWeight: "900"
                  }}>{index + 1}</Text></View>{index < JOURNEY.length - 1 ? <View style={{
                  height: 2,
                  flex: 1,
                  backgroundColor: index < statusIndex ? colors.primary : colors.border
                }} /> : <View style={{
                  flex: 1
                }} />}</View><Text style={{
                color: completed ? colors.textPrimary : colors.textSecondary,
                fontSize: 9,
                fontWeight: completed ? "800" : "600",
                marginTop: 7,
                textAlign: "center"
              }}>{tr(labelFor(status))}</Text></View>;
          })}</View></View> : null}

      <View style={{
        flexDirection: "row",
        gap: 10,
        marginBottom: 20
      }}>
        <Summary icon={Scale} label={tr("Food weight")} value={`${Number(donation.quantityKg).toFixed(2)} kg`} colors={colors} />
        <Summary icon={PackageOpen} label={tr("Food items")} value={donation.items.length} colors={colors} />
        <Summary icon={CalendarClock} label={tr("Calories")} value={Math.round(totals.calories)} colors={colors} />
      </View>

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
          alignItems: "center",
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
          }}>{item.quantityGrams} g</Text></View><View style={{
          flexDirection: "row",
          gap: 18,
          marginTop: 11
        }}><Nutrition label={tr("Calories")} value={`${item.nutritionPer100g.calories} kcal/100g`} colors={colors} /><Nutrition label={tr("Protein")} value={`${item.nutritionPer100g.proteinGrams} g/100g`} colors={colors} /></View></View>)}

      <Text style={{
        color: colors.textPrimary,
        fontSize: 18,
        fontWeight: "900",
        marginTop: 12,
        marginBottom: 11
      }}>{tr("Pickup details")}</Text>
      <View style={{
        backgroundColor: colors.backgroundSecondary,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 16,
        paddingHorizontal: 16,
        marginBottom: 20
      }}>
        <Detail icon={CalendarClock} label={tr("Prepared")} value={formatDateTime(donation.preparedAt)} colors={colors} />
        <Detail icon={CalendarClock} label={tr("Pickup deadline")} value={formatDateTime(donation.pickupDeadline)} colors={colors} />
        <Detail icon={PackageOpen} label={tr("Packaging")} value={tr(labelFor(donation.packagingType))} colors={colors} />
        <Detail icon={MapPin} label={tr("Location")} value={`${donation.location.coordinates[1].toFixed(5)}, ${donation.location.coordinates[0].toFixed(5)}`} colors={colors} last />
      </View>

      {donation.discardReason ? <View style={{
        borderWidth: 1,
        borderColor: `${colors.danger}55`,
        backgroundColor: `${colors.danger}0C`,
        borderRadius: 15,
        padding: 15,
        marginBottom: 18
      }}><Text style={{
          color: colors.danger,
          fontWeight: "900"
        }}>{tr("Why this donation was discarded")}</Text><Text style={{
          color: colors.textPrimary,
          lineHeight: 19,
          marginTop: 6
        }}>{donation.discardReason}</Text></View> : null}

      {donation.status === "PENDING" ? <View style={{
        flexDirection: "row",
        gap: 10
      }}><PressableBlock onPress={() => router.push({
          pathname: "/(app)/donor/donations/[id]/edit",
          params: {
            id
          }
        })} style={{
          flex: 1,
          height: 51,
          borderRadius: 13,
          backgroundColor: colors.primary,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center"
        }}><Edit3 size={17} color={colors.onPrimary} /><Text style={{
            color: colors.onPrimary,
            fontWeight: "900",
            marginLeft: 7
          }}>{tr("Edit")}</Text></PressableBlock><PressableBlock onPress={() => setShowDiscard(true)} style={{
          flex: 1,
          height: 51,
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
          }}>{tr("Discard")}</Text></PressableBlock></View> : null}
    </ScrollView>}

    <DialogBox visible={showDiscard} title={tr("Discard donation?")} message={tr("This cannot be undone. Tell us why the food is no longer available.")} showInput inputValue={reason} onInputChange={setReason} inputPlaceholder={tr("Reason")} confirmText={tr("Discard")} onConfirm={discard} onCancel={() => setShowDiscard(false)} loading={loading} confirmButtonStyle={{
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
function Nutrition({
  label,
  value,
  colors
}) {
  return <View><Text style={{
      color: colors.textSecondary,
      fontSize: 10
    }}>{label}</Text><Text style={{
      color: colors.textPrimary,
      fontSize: 12,
      fontWeight: "700",
      marginTop: 2
    }}>{value}</Text></View>;
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
