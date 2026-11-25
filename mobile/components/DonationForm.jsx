import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Check, Minus, Plus } from "lucide-react-native";
import Toast from "react-native-toast-message";
import CustomPicker from "./CustomPicker";
import DateTimePickerModal from "./DateTimePickerModal";
import LocationField from "./LocationField";
import { Button, Field, Screen, Section, StatusBadge, Surface, useColors } from "./ui";
import { PACKAGING_OPTIONS, nutritionTotals } from "../constants/domain";
import { buildDonationPayload, validateDonationItems, validateDonationLogistics } from "../constants/forms";
import { analyzeNutrition, createDonation, updateDonation } from "../services/donations";
import { useTranslation } from "../utils/i18n/LanguageProvider";
const pad = value => String(value).padStart(2, "0");
const datePart = value => {
  const date = new Date(value || Date.now());
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};
const timePart = value => {
  const date = new Date(value || Date.now());
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
};
const combine = (date, time) => new Date(`${date}T${time}:00`).toISOString();
export default function DonationForm({
  donation,
  onSuccess
}) {
  const {
    tr,
    locale
  } = useTranslation();
  const colors = useColors();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const defaultDeadline = new Date(Date.now() + 2 * 60 * 60 * 1000);
  const [items, setItems] = useState(donation?.items?.map(item => ({
    ...item,
    quantityGrams: String(item.quantityGrams),
    donorConfirmed: false
  })) || [{
    name: "",
    quantityGrams: ""
  }]);
  const [preparedDate, setPreparedDate] = useState(datePart(donation?.preparedAt));
  const [preparedTime, setPreparedTime] = useState(timePart(donation?.preparedAt));
  const [deadlineDate, setDeadlineDate] = useState(datePart(donation?.pickupDeadline || defaultDeadline));
  const [deadlineTime, setDeadlineTime] = useState(timePart(donation?.pickupDeadline || defaultDeadline));
  const [packagingType, setPackagingType] = useState(donation?.packagingType || "CLOSED_CONTAINER");
  const [location, setLocation] = useState(donation?.location || {
    type: "Point",
    coordinates: ["", ""]
  });
  const totals = useMemo(() => nutritionTotals(items), [items]);
  const updateItem = (index, patch) => setItems(current => current.map((item, itemIndex) => itemIndex === index ? {
    ...item,
    ...patch
  } : item));
  const validItems = validateDonationItems(items);
  const nutritionReady = items.every(item => item.analysisStatus === "READY_FOR_CONFIRMATION" && item.donorConfirmed);
  const runAnalysis = async () => {
    if (!validItems) return Toast.show({
      type: "error",
      text1: tr("Each item needs a name and at least 250 g")
    });
    setLoading(true);
    try {
      const suggestions = await analyzeNutrition(items.map(item => ({
        name: item.name.trim(),
        quantityGrams: Number(item.quantityGrams)
      })));
      setItems(suggestions.map(item => ({
        ...item,
        quantityGrams: String(item.quantityGrams)
      })));
      setStep(1);
    } catch (error) {
      Toast.show({
        type: "error",
        text1: tr("Analysis failed"),
        text2: error.message
      });
    } finally {
      setLoading(false);
    }
  };
  const validateLogistics = () => validateDonationLogistics({
    preparedAt: combine(preparedDate, preparedTime),
    pickupDeadline: combine(deadlineDate, deadlineTime),
    coordinates: location.coordinates
  });
  const submit = async () => {
    const error = validateLogistics();
    if (error) return Toast.show({
      type: "error",
      text1: error
    });
    const payload = buildDonationPayload({
      items,
      preparedAt: combine(preparedDate, preparedTime),
      pickupDeadline: combine(deadlineDate, deadlineTime),
      packagingType,
      coordinates: location.coordinates
    });
    setLoading(true);
    try {
      const result = donation?._id ? await updateDonation(donation._id, payload) : await createDonation(payload);
      Toast.show({
        type: "success",
        text1: donation ? tr("Donation updated") : tr("Donation created")
      });
      onSuccess?.(result);
    } catch (requestError) {
      Toast.show({
        type: "error",
        text1: tr("Could not save donation"),
        text2: requestError.message
      });
    } finally {
      setLoading(false);
    }
  };
  const stepCopy = [{
    title: tr("Tell us what you have"),
    subtitle: tr("Add each food item and its prepared weight.")
  }, {
    title: tr("Confirm nutrition"),
    subtitle: tr("Review the nutrition estimate for every item.")
  }, {
    title: tr("Arrange pickup"),
    subtitle: tr("Choose timing, packaging and the collection point.")
  }, {
    title: tr("Review donation"),
    subtitle: tr("Check the details once before submitting.")
  }][step];
  return <Screen contentStyle={{
    paddingTop: 24,
    paddingHorizontal: 16,
    paddingBottom: 164
  }}><View style={{
      paddingBottom: 20,
      marginBottom: 24,
      borderBottomWidth: 1,
      borderBottomColor: colors.border
    }}><View style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 18
      }}><View style={{
          flex: 1
        }}><Text style={{
            color: colors.textPrimary,
            fontSize: 16,
            fontWeight: "600"
          }}>{stepCopy.title}</Text><Text style={{
            color: colors.textSecondary,
            fontSize: 12,
            lineHeight: 17,
            marginTop: 3
          }}>{stepCopy.subtitle}</Text></View><View style={{
          paddingTop: 2,
          marginLeft: 12
        }}><Text style={{
            color: colors.textSecondary,
            fontSize: 10,
            fontWeight: "500"
          }}>{step + 1}/4</Text></View></View><StepProgress step={step} colors={colors} /></View>
    {step === 0 ? <><Section title={tr("Food items")} subtitle={tr("Each item must weigh at least 250 grams.")}>{items.map((item, index) => <Surface key={index} style={{
          marginBottom: 12
        }}><View style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12
          }}><View><Text style={{
                color: colors.textPrimary,
                fontWeight: "600",
                fontSize: 16
              }}>{tr("Item {{number}}", { number: String(index + 1).padStart(2, "0") })}</Text><Text style={{
                color: colors.textSecondary,
                fontSize: 12,
                marginTop: 2
              }}>{tr("Food and prepared weight")}</Text></View>{items.length > 1 ? <Pressable accessibilityRole="button" accessibilityLabel={`${tr("Remove item")} ${index + 1}`} onPress={() => setItems(current => current.filter((_, i) => i !== index))} style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              backgroundColor: `${colors.danger}18`,
              alignItems: "center",
              justifyContent: "center"
            }}><Minus color={colors.danger} size={18} /></Pressable> : null}</View><Field label={tr("Food name")} value={item.name} onChangeText={name => updateItem(index, {
            name
          })} placeholder={tr("e.g. Cooked rice")} /><Field label={tr("Weight in grams")} value={String(item.quantityGrams)} onChangeText={quantityGrams => updateItem(index, {
            quantityGrams
          })} keyboardType="numeric" placeholder={tr("Minimum 250")} /></Surface>)}</Section><Button title={tr("Add another item")} icon={Plus} variant="secondary" onPress={() => setItems(current => [...current, {
        name: "",
        quantityGrams: ""
      }])} style={{
        width: "100%"
      }} /><Button title={tr("Analyse nutrition")} onPress={runAnalysis} loading={loading} style={{ width: "100%", marginTop: 12 }} /></> : null}
    {step === 1 ? <><Section title={tr("Confirm nutrition")}>{items.map((item, index) => <Surface key={index} style={{
          marginBottom: 12
        }}><View style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 10
          }}><Text style={{
              color: colors.textPrimary,
              fontWeight: "600",
              fontSize: 16
            }}>{item.name}</Text>{item.nutritionSource ? <StatusBadge status={item.nutritionSource} /> : null}</View>{item.analysisStatus === "UNAVAILABLE" ? <Text style={{
            color: colors.danger
          }}>{item.message}. {tr("Change the food name or try again later.")}</Text> : <><Text style={{
              color: colors.textSecondary
            }}>{tr("{{calories}} kcal and {{protein}} g protein per 100 g", { calories: item.nutritionPer100g?.calories, protein: item.nutritionPer100g?.proteinGrams })}</Text><Pressable onPress={() => updateItem(index, {
              donorConfirmed: !item.donorConfirmed
            })} style={{
              marginTop: 14,
              padding: 12,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: item.donorConfirmed ? colors.success : colors.border,
              backgroundColor: item.donorConfirmed ? `${colors.success}18` : colors.backgroundPrimary
            }}><Text style={{
                color: item.donorConfirmed ? colors.success : colors.textPrimary,
              fontWeight: "700"
            }}>{item.donorConfirmed ? tr("✓ Nutrition confirmed") : tr("Tap to confirm this suggestion")}</Text></Pressable></>}</Surface>)}</Section><View style={{
        gap: 12
      }}><Button title={tr("Back")} variant="secondary" onPress={() => setStep(0)} style={{
          width: "100%"
        }} /><Button title={tr("Pickup details")} onPress={() => {
          if (!nutritionReady) {
            Toast.show({
              type: "error",
              text1: tr("Confirm each nutrition estimate first")
            });
            return;
          }
          setStep(2);
        }} style={{
          width: "100%"
        }} /></View></> : null}
    {step === 2 ? <><Section title={tr("Preparation")}><View style={{
          flexDirection: "row",
          gap: 10
        }}><DateTimePickerModal mode="date" value={preparedDate} onChange={setPreparedDate} label={tr("Prepared date")} /><DateTimePickerModal mode="time" value={preparedTime} onChange={setPreparedTime} label={tr("Prepared time")} /></View></Section><Section title={tr("Pickup deadline")}><View style={{
          flexDirection: "row",
          gap: 10
      }}><DateTimePickerModal mode="date" value={deadlineDate} onChange={setDeadlineDate} label={tr("Deadline date")} disablePastDates /><DateTimePickerModal mode="time" value={deadlineTime} onChange={setDeadlineTime} label={tr("Deadline time")} /></View></Section><Section title={tr("Packaging")}><CustomPicker data={PACKAGING_OPTIONS} value={packagingType} onChange={item => setPackagingType(item.value)} placeholder={tr("Packaging type")} searchPlaceholder="" /></Section><LocationField value={location} onChange={setLocation} /><View style={{
        gap: 12,
        marginTop: 16
      }}><Button title={tr("Back")} variant="secondary" onPress={() => setStep(1)} style={{
          width: "100%"
        }} /><Button title={tr("Review")} onPress={() => {
          const error = validateLogistics();
          if (error) Toast.show({
            type: "error",
            text1: error
          });else setStep(3);
        }} style={{
          width: "100%"
        }} /></View></> : null}
    {step === 3 ? <><Surface style={{
        marginBottom: 16
      }}><Text style={{
          color: colors.textPrimary,
          fontSize: 19,
          fontWeight: "600",
          marginBottom: 12
        }}>{tr("{{count}} food items", { count: items.length })}</Text>{items.map(item => <Text key={item.name} style={{
          color: colors.textSecondary,
          marginBottom: 5
        }}>{item.name} · {item.quantityGrams} g</Text>)}<View style={{
          height: 1,
          backgroundColor: colors.border,
          marginVertical: 12
        }} /><Text style={{
          color: colors.textPrimary,
          fontWeight: "500"
        }}>{totals.calories.toFixed(0)} kcal · {totals.protein.toFixed(1)} {tr("g protein")}</Text><Text style={{
          color: colors.textSecondary,
          marginTop: 8
        }}>{tr("Pickup deadline: {{date}}", { date: new Date(combine(deadlineDate, deadlineTime)).toLocaleString(locale === "hi" ? "hi-IN" : "en-IN") })}</Text><Text style={{
          color: colors.textSecondary,
          marginTop: 4
        }}>{tr("Packaging: {{type}}", { type: tr(PACKAGING_OPTIONS.find(item => item.value === packagingType)?.label || "") })}</Text></Surface><View style={{
        gap: 12
      }}><Button title={tr("Back")} variant="secondary" onPress={() => setStep(2)} style={{
          width: "100%"
        }} /><Button title={donation ? tr("Save changes") : tr("Submit donation")} loading={loading} onPress={submit} style={{
          width: "100%"
        }} /></View></> : null}
  </Screen>;
}
function StepProgress({
  step,
  colors
}) {
  const { tr } = useTranslation();
  const labels = ["Food", "Nutrition", "Pickup", "Review"];
  return <View style={{
    flexDirection: "row"
  }}>{labels.map((label, index) => <View key={label} style={{
      flex: 1,
      alignItems: "center"
    }}><View style={{
        flexDirection: "row",
        alignItems: "center",
        width: "100%"
      }}>{index > 0 ? <View style={{
          flex: 1,
          height: 2,
          backgroundColor: index <= step ? colors.primary : colors.border
        }} /> : <View style={{
          flex: 1
        }} />}<View style={{
          width: 28,
          height: 28,
          borderRadius: 14,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: index <= step ? colors.primary : colors.backgroundElevated,
          borderWidth: 1,
          borderColor: index <= step ? colors.primary : colors.borderStrong
        }}>{index < step ? <Check size={14} color={colors.onPrimary} strokeWidth={3} /> : <Text style={{
            color: index === step ? colors.onPrimary : colors.textSecondary,
            fontWeight: "600",
            fontSize: 11
          }}>{index + 1}</Text>}</View>{index < labels.length - 1 ? <View style={{
          flex: 1,
          height: 2,
          backgroundColor: index < step ? colors.primary : colors.border
        }} /> : <View style={{
          flex: 1
        }} />}</View><Text style={{
        color: index === step ? colors.textPrimary : colors.textSecondary,
        fontSize: 10,
        fontWeight: index === step ? "600" : "400",
        marginTop: 6
      }}>{tr(label)}</Text></View>)}</View>;
}
