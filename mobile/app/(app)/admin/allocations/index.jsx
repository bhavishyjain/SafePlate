import { useCallback, useState } from "react";
import { Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import BackButtonHeader from "../../../../components/BackButtonHeader";
import AllocationCard from "../../../../components/AllocationCard";
import { PaginationFooter } from "../../../../components/AdminWidgets";
import { ALLOCATION_STATUSES, labelFor } from "../../../../constants/domain";
import { EmptyState, ErrorState, FilterChips, LoadingState, Screen } from "../../../../components/ui";
import { listAllocations } from "../../../../services/allocations";
import { useTranslation } from "../../../../utils/i18n/LanguageProvider";
export default function AdminAllocations() {
  const {
    tr
  } = useTranslation();
  const [status, setStatus] = useState("");
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      setError(null);
      setData(await listAllocations({
        page,
        limit: 20,
        status: status || undefined
      }));
    } catch (requestError) {
      setError(requestError);
    } finally {
      setLoading(false);
    }
  }, [status]);
  useFocusEffect(useCallback(() => {
    load();
  }, [load]));
  return <View style={{ flex: 1 }}><BackButtonHeader title={tr("Allocations")} /><Screen><Text style={{ color: "#7C8798", fontSize: 13, lineHeight: 19, marginBottom: 18 }}>{tr("Review match reasoning and assignment history.")}</Text><FilterChips value={status} onChange={setStatus} values={[{
      label: tr("All"),
      value: ""
    }, ...ALLOCATION_STATUSES.map(value => ({
      label: labelFor(value),
      value
    }))]} />{!data && loading ? <LoadingState /> : error ? <ErrorState message={error.message} onRetry={load} /> : !data?.items.length ? <EmptyState title={tr("No allocations found")} /> : <>{data.items.map(item => <AllocationCard key={item._id} allocation={item} onPress={() => router.push({
        pathname: "/(app)/admin/allocations/[id]",
        params: {
          id: item._id
        }
      })} />)}<PaginationFooter pagination={data.pagination} loading={loading} onPage={load} /></>}</Screen></View>;
}
