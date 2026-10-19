import { useCallback, useEffect, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import { Text, View } from "react-native";
import BackButtonHeader from "../../../../components/BackButtonHeader";
import { Button, EmptyState, ErrorState, Field, FilterChips, LoadingState, Screen, StatusBadge, Surface, useColors } from "../../../../components/ui";
import { listCatalog } from "../../../../services/admin";
import { useTranslation } from "../../../../utils/i18n/LanguageProvider";
export default function AdminCatalog() {
  const {
    tr
  } = useTranslation();
  const colors = useColors();
  const [search, setSearch] = useState("");
  const [active, setActive] = useState("all");
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);
  const load = useCallback(async () => {
    try {
      setError(null);
      const result = await listCatalog({
        active: "all",
        search: search || undefined
      });
      setItems(active === "all" ? result : result.filter(item => String(item.active) === active));
    } catch (requestError) {
      setError(requestError);
    }
  }, [search, active]);
  useEffect(() => {
    const timer = setTimeout(load, 350);
    return () => clearTimeout(timer);
  }, [load]);
  useFocusEffect(useCallback(() => {
    load();
  }, [load]));
  return <View style={{
    flex: 1
  }}><BackButtonHeader title={tr("Nutrition catalog")} /><Screen><Text style={{
        color: "#7C8798",
        fontSize: 13,
        lineHeight: 19,
        marginBottom: 18
      }}>{tr("Maintain nutrition references used for future donor analysis.")}</Text><Button title={tr("Create catalog item")} onPress={() => router.push("/(app)/admin/catalog/new")} style={{
        marginBottom: 14
      }} /><Field label={tr("Search")} value={search} onChangeText={setSearch} placeholder={tr("Name or alias")} /><FilterChips value={active} onChange={setActive} values={[{
        label: tr("All"),
        value: "all"
      }, {
        label: tr("Active"),
        value: "true"
      }, {
        label: tr("Inactive"),
        value: "false"
      }]} />{!items && !error ? <LoadingState /> : error ? <ErrorState message={error.message} onRetry={load} /> : !items.length ? <EmptyState title={tr("No catalog items found")} /> : items.map(item => <Surface accessibilityLabel={`Open ${item.name}`} key={item._id} onPress={() => router.push({
        pathname: "/(app)/admin/catalog/[id]",
        params: {
          id: item._id
        }
      })} style={{
        marginBottom: 10
      }}><View style={{
          flexDirection: "row",
          justifyContent: "space-between",
          gap: 10
        }}><View style={{
            flex: 1
          }}><Text style={{
              color: colors.textPrimary,
              fontWeight: "800",
              fontSize: 16
            }}>{item.name}</Text><Text style={{
              color: colors.textSecondary,
              marginTop: 4
            }}>{item.caloriesPer100g} kcal · {item.proteinPer100g} {tr("g protein / 100 g")}</Text><Text style={{
              color: colors.textSecondary,
              fontSize: 12,
              marginTop: 4
            }}>{item.aliases?.join(", ") || tr("No aliases")}</Text></View><StatusBadge status={item.active ? "ACTIVE" : "INACTIVE"} /></View></Surface>)}</Screen></View>;
}
