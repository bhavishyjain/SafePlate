import { useState } from "react";
import { router } from "expo-router";
import { Save } from "lucide-react-native";
import { Text } from "react-native";
import Toast from "react-native-toast-message";
import { Button, Field, FilterChips, Screen, Surface } from "./ui";
import { createCatalogItem, updateCatalogItem } from "../services/admin";
import { useTranslation } from "../utils/i18n/LanguageProvider";
export default function CatalogForm({
  item
}) {
  const {
    tr
  } = useTranslation();
  const [form, setForm] = useState({
    name: item?.name || "",
    aliases: item?.aliases?.join(", ") || "",
    caloriesPer100g: String(item?.caloriesPer100g ?? ""),
    proteinPer100g: String(item?.proteinPer100g ?? ""),
    active: item?.active === false ? "false" : "true"
  });
  const [loading, setLoading] = useState(false);
  const save = async () => {
    if (!form.name.trim() || form.caloriesPer100g === "" || form.proteinPer100g === "") return Toast.show({
      type: "error",
      text1: tr("Name and nutrition values are required")
    });
    const payload = {
      name: form.name.trim(),
      aliases: form.aliases.split(",").map(value => value.trim()).filter(Boolean),
      caloriesPer100g: Number(form.caloriesPer100g),
      proteinPer100g: Number(form.proteinPer100g),
      active: form.active === "true"
    };
    setLoading(true);
    try {
      const result = item ? await updateCatalogItem(item._id, payload) : await createCatalogItem(payload);
      Toast.show({
        type: "success",
        text1: item ? tr("Catalog item updated") : tr("Catalog item created")
      });
      router.replace({
        pathname: "/(app)/admin/catalog/[id]",
        params: {
          id: result._id
        }
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: error.message
      });
    } finally {
      setLoading(false);
    }
  };
  return <Screen>
    <Text style={{ color: "#7C8798", fontSize: 13, lineHeight: 19, marginBottom: 18 }}>{tr("Keep values specific and use common food names as aliases.")}</Text>
    <Surface>
      <Field label={tr("Food name")} value={form.name} onChangeText={name => setForm(current => ({
        ...current,
        name
      }))} />
      <Field label={tr("Aliases")} value={form.aliases} onChangeText={aliases => setForm(current => ({
        ...current,
        aliases
      }))} placeholder={tr("Comma-separated names")} />
      <Field label={tr("Calories / 100 g")} value={form.caloriesPer100g} onChangeText={caloriesPer100g => setForm(current => ({
        ...current,
        caloriesPer100g
      }))} keyboardType="decimal-pad" />
      <Field label={tr("Protein / 100 g")} value={form.proteinPer100g} onChangeText={proteinPer100g => setForm(current => ({
        ...current,
        proteinPer100g
      }))} keyboardType="decimal-pad" />
      <FilterChips value={form.active} onChange={active => setForm(current => ({
        ...current,
        active
      }))} values={[{
        label: tr("Active"),
        value: "true"
      }, {
        label: tr("Inactive"),
        value: "false"
      }]} />
      <Button title={tr("Save catalog item")} icon={Save} onPress={save} loading={loading} />
    </Surface>
  </Screen>;
}
