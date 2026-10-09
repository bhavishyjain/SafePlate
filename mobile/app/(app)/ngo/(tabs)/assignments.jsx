import { useCallback, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import AllocationCard from "../../../../components/AllocationCard";
import { ALLOCATION_STATUSES } from "../../../../constants/domain";
import { listAllocations } from "../../../../services/allocations";
import { Button, EmptyState, ErrorState, FilterChips, LoadingState, Screen, Title } from "../../../../components/ui";

export default function Assignments() {
  const [status, setStatus] = useState(""); const [data, setData] = useState(null); const [error, setError] = useState(null); const [loadingMore, setLoadingMore] = useState(false);
  const load = useCallback(async (page = 1, append = false) => { try { setError(null); const next = await listAllocations({ page, limit: 20, status: status || undefined }); setData((current) => append ? { ...next, items: [...(current?.items || []), ...next.items] } : next); } catch (requestError) { setError(requestError); } finally { setLoadingMore(false); } }, [status]);
  useFocusEffect(useCallback(() => { setData(null); load(); }, [load]));
  return <Screen><Title subtitle="Confirm pickup and delivery or review completed assignments.">Assignments</Title><FilterChips value={status} onChange={setStatus} values={[{ label: "All", value: "" }, ...ALLOCATION_STATUSES.map((value) => ({ label: value.replaceAll("_", " "), value }))]} />{!data && !error ? <LoadingState /> : error ? <ErrorState message={error.message} onRetry={() => load()} /> : !data.items.length ? <EmptyState title="No assignments found" /> : <>{data.items.map((allocation) => <AllocationCard key={allocation._id} allocation={allocation} onPress={() => router.push({ pathname: "/(app)/ngo/assignments/[id]", params: { id: allocation._id } })} />)}{data.pagination.page < data.pagination.pages ? <Button title="Load more" loading={loadingMore} variant="secondary" onPress={() => { setLoadingMore(true); load(data.pagination.page + 1, true); }} /> : null}</>}</Screen>;
}
