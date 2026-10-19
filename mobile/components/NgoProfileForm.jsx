import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Building2, Minus, Plus, UsersRound } from "lucide-react-native";
import Toast from "react-native-toast-message";
import { BENEFICIARY_OPTIONS, NGO_TYPE_OPTIONS } from "../constants/domain";
import { validateBeneficiaryGroups, validateCoordinates } from "../constants/forms";
import { saveMyNgo } from "../services/ngos";
import CustomPicker from "./CustomPicker";
import LocationField from "./LocationField";
import { Button, Field, Screen, Section, Surface, useColors } from "./ui";
import { useTranslation } from "../utils/i18n/LanguageProvider";
export default function NgoProfileForm({
  profile,
  onSuccess
}) {
  const {
    tr
  } = useTranslation();
  const colors = useColors();
  const [type, setType] = useState(profile?.type || "SHELTER");
  const [location, setLocation] = useState(profile?.location || {
    type: "Point",
    coordinates: ["", ""]
  });
  const [groups, setGroups] = useState(profile?.beneficiaryGroups?.map(group => ({
    category: group.category,
    count: String(group.count)
  })) || [{
    category: "ADULT_30_TO_59",
    count: ""
  }]);
  const [loading, setLoading] = useState(false);
  const updateGroup = (index, patch) => setGroups(current => current.map((group, groupIndex) => groupIndex === index ? {
    ...group,
    ...patch
  } : group));
  const totals = useMemo(() => groups.reduce((result, group) => {
    const reference = BENEFICIARY_OPTIONS.find(item => item.value === group.category);
    const count = Number(group.count || 0);
    result.capacity += count;
    result.calories += count * (reference?.calories || 0);
    result.protein += count * (reference?.protein || 0);
    return result;
  }, {
    capacity: 0,
    calories: 0,
    protein: 0
  }), [groups]);
  const submit = async () => {
    const [lng, lat] = location.coordinates.map(Number);
    if (!validateBeneficiaryGroups(groups)) return Toast.show({
      type: "error",
      text1: tr("Every beneficiary count must be a positive whole number")
    });
    if (!validateCoordinates(location.coordinates)) return Toast.show({
      type: "error",
      text1: tr("Enter a valid location")
    });
    setLoading(true);
    try {
      const saved = await saveMyNgo({
        type,
        location: {
          type: "Point",
          coordinates: [lng, lat]
        },
        beneficiaryGroups: groups.map(group => ({
          category: group.category,
          count: Number(group.count)
        }))
      });
      Toast.show({
        type: "success",
        text1: profile ? tr("NGO profile updated") : tr("NGO profile created")
      });
      onSuccess?.(saved);
    } catch (error) {
      Toast.show({
        type: "error",
        text1: tr("Could not save profile"),
        text2: error.message
      });
    } finally {
      setLoading(false);
    }
  };
  return <Screen contentStyle={{
    paddingTop: 24
  }}>
    <View style={{
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 14,
      marginBottom: 22
    }}><View style={{
        width: 48,
        height: 48,
        borderRadius: 15,
        backgroundColor: `${colors.primary}18`,
        alignItems: "center",
        justifyContent: "center"
      }}><Building2 size={23} color={colors.primary} /></View><View style={{
        flex: 1
      }}><Text style={{
          color: colors.textPrimary,
          fontSize: 27,
          fontWeight: "900"
        }}>{profile ? tr("Organization profile") : tr("Set up your NGO")}</Text><Text style={{
          color: colors.textSecondary,
          fontSize: 13,
          lineHeight: 19,
          marginTop: 4
        }}>{tr("Beneficiary groups and location determine your daily needs and matching eligibility.")}</Text></View></View>
    {profile ? <Surface style={{
      marginBottom: 24,
      flexDirection: "row",
      alignItems: "center"
    }}><View style={{
        width: 42,
        height: 42,
        borderRadius: 13,
        backgroundColor: `${colors.primary}17`,
        alignItems: "center",
        justifyContent: "center"
      }}><UsersRound size={20} color={colors.primary} /></View><View style={{
        flex: 1,
        marginLeft: 13
      }}><Text style={{
          color: colors.textPrimary,
          fontSize: 15,
          fontWeight: "900"
        }}>{tr("{{count}} people registered", { count: profile.capacity })}</Text><Text style={{
          color: colors.textSecondary,
          fontSize: 12,
          marginTop: 3
        }}>{tr("{{count}} beneficiary groups · Update when your service changes", { count: groups.length })}</Text></View></Surface> : null}
    <Section title={tr("Organization type")}><CustomPicker data={NGO_TYPE_OPTIONS} value={type} onChange={item => setType(item.value)} placeholder={tr("NGO type")} searchPlaceholder="" /></Section>
    <Section title={tr("Beneficiary groups")} subtitle={tr("Add each age group you currently serve.")}>
      {groups.map((group, index) => <Surface key={index} style={{
        marginBottom: 10
      }}>
        <View style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12
        }}><Text style={{
            color: colors.textPrimary,
            fontWeight: "700",
            fontSize: 15
          }}>{tr("Group {{number}}", { number: index + 1 })}</Text>{groups.length > 1 ? <Pressable accessibilityRole="button" accessibilityLabel={`${tr("Remove group")} ${index + 1}`} onPress={() => setGroups(current => current.filter((_, itemIndex) => itemIndex !== index))} style={{
            width: 34,
            height: 34,
            borderRadius: 9,
            backgroundColor: `${colors.danger}18`,
            alignItems: "center",
            justifyContent: "center"
          }}><Minus size={17} color={colors.danger} /></Pressable> : null}</View>
        <CustomPicker data={BENEFICIARY_OPTIONS} value={group.category} onChange={item => updateGroup(index, {
          category: item.value
        })} placeholder={tr("Age group")} />
        <View style={{
          height: 12
        }} />
        <Field label={tr("Number of beneficiaries")} value={group.count} onChangeText={count => updateGroup(index, {
          count
        })} keyboardType="numeric" />
      </Surface>)}
      <Button title={tr("Add beneficiary group")} icon={Plus} variant="secondary" onPress={() => setGroups(current => [...current, {
        category: "ADULT_30_TO_59",
        count: ""
      }])} />
    </Section>
    <Section title={tr("Calculated daily need")}><Surface><View style={{
          flexDirection: "row",
          gap: 8
        }}>{[{
            label: tr("People"),
            value: totals.capacity
          }, {
            label: tr("Calories"),
            value: totals.calories.toLocaleString("en-IN")
          }, {
            label: tr("Protein"),
            value: `${totals.protein.toLocaleString("en-IN")} g`
          }].map(item => <View key={item.label} style={{
            flex: 1,
            backgroundColor: colors.backgroundPrimary,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 11,
            padding: 10
          }}><Text adjustsFontSizeToFit numberOfLines={1} style={{
              color: colors.textPrimary,
              fontSize: 17,
              fontWeight: "800"
            }}>{item.value}</Text><Text style={{
              color: colors.textSecondary,
              fontSize: 10,
              marginTop: 4
            }}>{item.label}</Text></View>)}</View><Text style={{
          color: colors.textSecondary,
          fontSize: 11,
          lineHeight: 16,
          marginTop: 12
        }}>{tr("Preview based on SafePlate India references. The server calculates the final target.")}</Text></Surface></Section>
    <LocationField value={location} onChange={setLocation} />
    <Button title={profile ? tr("Save profile") : tr("Complete setup")} onPress={submit} loading={loading} style={{
      marginTop: 16
    }} />
  </Screen>;
}
