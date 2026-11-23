import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { ChevronDown, ChevronUp, Plus, Trash2, UsersRound } from "lucide-react-native";
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
  const [expandedGroup, setExpandedGroup] = useState(null);
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
    paddingTop: 24,
    paddingBottom: 148
  }}>
    {profile ? <Surface style={{
      marginBottom: 20,
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
          fontWeight: "600"
        }}>{tr("{{count}} people registered", { count: profile.capacity })}</Text><Text style={{
          color: colors.textSecondary,
          fontSize: 12,
          marginTop: 3
        }}>{tr("{{count}} beneficiary groups · Update when your service changes", { count: groups.length })}</Text></View></Surface> : null}
    <Section title={tr("Organization type")}><CustomPicker data={NGO_TYPE_OPTIONS} value={type} onChange={item => setType(item.value)} placeholder={tr("NGO type")} searchPlaceholder="" /></Section>
    <Section title={tr("Beneficiary groups")} subtitle={tr("Add each age group you currently serve.")}>
      {groups.map((group, index) => {
        const option = BENEFICIARY_OPTIONS.find(item => item.value === group.category);
        const expanded = expandedGroup === index;
        return <Surface key={index} style={{
        marginBottom: 10
      }}>
        <Pressable accessibilityRole="button" accessibilityState={{ expanded }} onPress={() => setExpandedGroup(current => current === index ? null : index)} style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          minHeight: 40
        }}><Text style={{
            color: colors.textPrimary,
            fontWeight: "600",
            fontSize: 15
          }}>{tr(option?.label || group.category)}</Text>{expanded ? <ChevronUp size={19} color={colors.textSecondary} /> : <ChevronDown size={19} color={colors.textSecondary} />}</Pressable>
        {expanded ? <View style={{ marginTop: 14 }}><CustomPicker data={BENEFICIARY_OPTIONS} value={group.category} onChange={item => updateGroup(index, {
          category: item.value
        })} placeholder={tr("Age group")} />
        <View style={{
          height: 12
        }} />
        <Field label={tr("Number of beneficiaries")} value={group.count} onChangeText={count => updateGroup(index, {
          count
        })} keyboardType="numeric" />
        {groups.length > 1 ? <Pressable accessibilityRole="button" accessibilityLabel={`${tr("Remove group")} ${index + 1}`} onPress={() => {
          setGroups(current => current.filter((_, itemIndex) => itemIndex !== index));
          setExpandedGroup(null);
        }} style={{
          minHeight: 46,
          width: "100%",
          borderRadius: 10,
          backgroundColor: colors.danger,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center"
        }}><Trash2 size={17} color={colors.dark} /><Text style={{ color: colors.dark, fontSize: 14, fontWeight: "600", marginLeft: 7 }}>{tr("Remove group")}</Text></Pressable> : null}</View> : null}
      </Surface>;
      })}
      <Button title={tr("Add beneficiary group")} icon={Plus} variant="secondary" onPress={() => setGroups(current => [...current, {
        category: "ADULT_30_TO_59",
        count: ""
      }])} />
    </Section>
    <Section title={tr("Calculated daily need")}><Surface><View style={{
          flexDirection: "row",
          alignItems: "center"
        }}>{[{
            label: tr("People"),
            value: totals.capacity
          }, {
            label: tr("Calories"),
            value: totals.calories.toLocaleString("en-IN")
          }, {
            label: tr("Protein"),
            value: `${totals.protein.toLocaleString("en-IN")} g`
          }].map((item, index) => <View key={item.label} style={{
            flex: 1,
            minHeight: 54,
            paddingHorizontal: 8,
            justifyContent: "center",
            alignItems: "center",
            borderRightWidth: index < 2 ? 1 : 0,
            borderRightColor: colors.border
          }}><Text adjustsFontSizeToFit numberOfLines={1} style={{
              color: colors.textPrimary,
              fontSize: 16,
              fontWeight: "600"
            }}>{item.value}</Text><Text style={{
              color: colors.textSecondary,
              fontSize: 10,
              marginTop: 4,
              textAlign: "center"
            }}>{item.label}</Text></View>)}</View><Text style={{
          color: colors.textSecondary,
          fontSize: 11,
          lineHeight: 16,
          marginTop: 12
        }}>{tr("Preview based on SafePlate India references. The server calculates the final target.")}</Text></Surface></Section>
    <LocationField value={location} onChange={setLocation} />
    <Button title={profile ? tr("Save profile") : tr("Complete setup")} onPress={submit} loading={loading} style={{
      marginTop: 28
    }} />
  </Screen>;
}
