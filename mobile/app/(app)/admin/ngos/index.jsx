import { useCallback, useEffect, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import { Text, View } from "react-native";
import BackButtonHeader from "../../../../components/BackButtonHeader";
import { PaginationFooter } from "../../../../components/AdminWidgets";
import { NGO_TYPE_OPTIONS, labelFor } from "../../../../constants/domain";
import { EmptyState, ErrorState, Field, FilterChips, LoadingState, Screen, Surface, useColors } from "../../../../components/ui";
import { listNgos } from "../../../../services/ngos";
import { useTranslation } from "../../../../utils/i18n/LanguageProvider";
export default function AdminNgos() {
  const {
    tr
  } = useTranslation();
  const colors = useColors();
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      setError(null);
      setData(await listNgos({
        page,
        limit: 20,
        search: search || undefined,
        type: type || undefined
      }));
    } catch (requestError) {
      setError(requestError);
    } finally {
      setLoading(false);
    }
  }, [search, type]);
  useEffect(() => {
    const timer = setTimeout(() => load(), 350);
    return () => clearTimeout(timer);
  }, [load]);
  useFocusEffect(useCallback(() => {
    load();
  }, [load]));
  return <View style={{ flex: 1 }}><BackButtonHeader title={tr("NGO directory")} /><Screen><Text style={{ color: "#7C8798", fontSize: 13, lineHeight: 19, marginBottom: 18 }}>{tr("Review beneficiary needs, location, and nutrition targets.")}</Text><Field label={tr("Search")} value={search} onChangeText={setSearch} placeholder={tr("Organization, coordinator, or email")} /><FilterChips value={type} onChange={setType} values={[{
      label: tr("All types"),
      value: ""
    }, ...NGO_TYPE_OPTIONS]} />{!data && loading ? <LoadingState /> : error ? <ErrorState message={error.message} onRetry={load} /> : !data?.items.length ? <EmptyState title={tr("No NGOs found")} /> : <>{data.items.map(ngo => <Surface accessibilityLabel={`Open ${ngo.userId?.organization || ngo.userId?.name}`} key={ngo._id} onPress={() => router.push({
        pathname: "/(app)/admin/ngos/[id]",
        params: {
          id: ngo._id
        }
      })} style={{
        marginBottom: 10
      }}><Text style={{
          color: colors.textPrimary,
          fontWeight: "800",
          fontSize: 16
        }}>{ngo.userId?.organization || ngo.userId?.name}</Text><Text style={{
          color: colors.textSecondary,
          marginTop: 4
        }}>{tr(labelFor(ngo.type))} · {tr("Capacity")} {ngo.capacity}</Text><Text style={{
          color: colors.textSecondary,
          fontSize: 12,
          marginTop: 4
        }}>{ngo.calculatedNutrition.caloriesPerDay.toFixed(0)} kcal/day · {ngo.calculatedNutrition.proteinGramsPerDay.toFixed(0)} {tr("g protein/day")}</Text></Surface>)}<PaginationFooter pagination={data.pagination} loading={loading} onPage={load} /></>}</Screen></View>;
}
