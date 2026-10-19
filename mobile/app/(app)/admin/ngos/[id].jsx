import { useCallback, useState } from "react";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";
import Toast from "react-native-toast-message";
import BackButtonHeader from "../../../../components/BackButtonHeader";
import DialogBox from "../../../../components/DialogBox";
import { DetailRow } from "../../../../components/AdminWidgets";
import { labelFor } from "../../../../constants/domain";
import { Button, ErrorState, Field, LoadingState, Screen, Section, Surface, useColors } from "../../../../components/ui";
import { clearNutritionOverride, getNgo, getNutritionStatus, setNutritionOverride } from "../../../../services/ngos";
import { useTranslation } from "../../../../utils/i18n/LanguageProvider";
export default function AdminNgoDetail() {
  const {
    tr
  } = useTranslation();
  const {
    id
  } = useLocalSearchParams();
  const colors = useColors();
  const [state, setState] = useState(null);
  const [error, setError] = useState(null);
  const [action, setAction] = useState(null);
  const [form, setForm] = useState({
    caloriesPerDay: "",
    proteinGramsPerDay: "",
    reason: ""
  });
  const [loading, setLoading] = useState(false);
  const load = useCallback(async () => {
    try {
      setError(null);
      const [ngo, nutrition] = await Promise.all([getNgo(id), getNutritionStatus(id)]);
      setState({
        ngo,
        nutrition
      });
    } catch (requestError) {
      setError(requestError);
    }
  }, [id]);
  useFocusEffect(useCallback(() => {
    load();
  }, [load]));
  const openOverride = () => {
    const current = state.ngo.nutritionOverride;
    setForm({
      caloriesPerDay: String(current?.caloriesPerDay || state.ngo.calculatedNutrition.caloriesPerDay),
      proteinGramsPerDay: String(current?.proteinGramsPerDay || state.ngo.calculatedNutrition.proteinGramsPerDay),
      reason: current?.reason || ""
    });
    setAction("override");
  };
  const mutate = async () => {
    if (action === "override" && (!Number(form.caloriesPerDay) || !Number(form.proteinGramsPerDay) || !form.reason.trim())) return Toast.show({
      type: "error",
      text1: tr("All override fields are required")
    });
    setLoading(true);
    try {
      if (action === "clear") await clearNutritionOverride(id);else await setNutritionOverride(id, {
        caloriesPerDay: Number(form.caloriesPerDay),
        proteinGramsPerDay: Number(form.proteinGramsPerDay),
        reason: form.reason.trim()
      });
      Toast.show({
        type: "success",
        text1: tr("Nutrition target updated")
      });
      setAction(null);
      load();
    } catch (requestError) {
      Toast.show({
        type: "error",
        text1: requestError.message
      });
    } finally {
      setLoading(false);
    }
  };
  if (!state && !error) return <Screen><LoadingState /></Screen>;
  if (error) return <Screen><ErrorState message={error.message} onRetry={load} /></Screen>;
  const {
    ngo,
    nutrition
  } = state;
  return <View style={{
    flex: 1,
    backgroundColor: colors.backgroundPrimary
  }}><BackButtonHeader title={tr("NGO details")} /><Screen><Text style={{
        color: colors.textPrimary,
        fontSize: 24,
        fontWeight: "900",
        marginBottom: 18
      }}>{ngo.userId?.organization || ngo.userId?.name}</Text><Section title={tr("Owner")}><Surface><DetailRow label={tr("Coordinator")} value={ngo.userId?.name} /><DetailRow label={tr("Email")} value={ngo.userId?.email} /><DetailRow label={tr("Phone")} value={ngo.userId?.phone} /><DetailRow label={tr("Account")} value={ngo.userId?.isActive === false ? tr("Disabled") : tr("Active")} last /></Surface></Section><Section title={tr("Profile")}><Surface><DetailRow label={tr("Type")} value={tr(labelFor(ngo.type))} /><DetailRow label={tr("Capacity")} value={ngo.capacity} /><DetailRow label={tr("Coordinates")} value={`${ngo.location.coordinates[1]}, ${ngo.location.coordinates[0]}`} last /></Surface></Section><Section title={tr("Beneficiary groups")}><Surface>{ngo.beneficiaryGroups.map((group, index) => <DetailRow key={group.category} label={tr(labelFor(group.category))} value={group.count} last={index === ngo.beneficiaryGroups.length - 1} />)}</Surface></Section><Section title={tr("Nutrition")}><Surface><DetailRow label={tr("Calculated calories")} value={`${ngo.calculatedNutrition.caloriesPerDay.toFixed(0)} kcal/day`} /><DetailRow label={tr("Calculated protein")} value={`${ngo.calculatedNutrition.proteinGramsPerDay.toFixed(0)} g/day`} /><DetailRow label={tr("Effective source")} value={nutrition.targetSource} /><DetailRow label={tr("Delivered today")} value={`${nutrition.deliveredCalories.toFixed(0)} kcal · ${nutrition.deliveredProtein.toFixed(0)} g`} /><DetailRow label={tr("Remaining gap")} value={`${nutrition.gapCalories.toFixed(0)} kcal · ${nutrition.gapProtein.toFixed(0)} g`} last /></Surface>{ngo.nutritionOverride?.reason ? <Surface style={{
          marginTop: 10,
          borderColor: colors.warning
        }}><Text style={{
            color: colors.warning,
            fontWeight: "800"
          }}>{tr("Active override")}</Text><Text style={{
            color: colors.textPrimary,
            marginTop: 5
          }}>{ngo.nutritionOverride.caloriesPerDay} kcal · {ngo.nutritionOverride.proteinGramsPerDay} {tr("g protein")}</Text><Text style={{
            color: colors.textSecondary,
            marginTop: 5
          }}>{ngo.nutritionOverride.reason}</Text></Surface> : null}</Section><View style={{
        gap: 10
      }}><Button title={ngo.nutritionOverride ? tr("Edit nutrition override") : tr("Set nutrition override")} onPress={openOverride} />{ngo.nutritionOverride ? <Button title={tr("Clear override")} variant="danger" onPress={() => setAction("clear")} /> : null}</View></Screen><DialogBox visible={action === "override"} title={tr("Nutrition override")} message={<View style={{
      width: "100%"
    }}><Field label={tr("Calories per day")} value={form.caloriesPerDay} onChangeText={caloriesPerDay => setForm(current => ({
        ...current,
        caloriesPerDay
      }))} keyboardType="numeric" /><Field label={tr("Protein grams per day")} value={form.proteinGramsPerDay} onChangeText={proteinGramsPerDay => setForm(current => ({
        ...current,
        proteinGramsPerDay
      }))} keyboardType="numeric" /><Field label={tr("Required reason")} value={form.reason} onChangeText={reason => setForm(current => ({
        ...current,
        reason
      }))} multiline /></View>} confirmText={tr("Save override")} onConfirm={mutate} onCancel={() => setAction(null)} loading={loading} /><DialogBox visible={action === "clear"} title={tr("Clear nutrition override?")} message={tr("The NGO will return to its calculated beneficiary target.")} confirmText={tr("Clear")} onConfirm={mutate} onCancel={() => setAction(null)} loading={loading} confirmButtonStyle={{
      backgroundColor: colors.danger
    }} /></View>;
}
