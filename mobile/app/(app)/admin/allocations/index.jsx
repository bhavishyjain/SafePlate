import { useCallback, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import AllocationCard from "../../../../components/AllocationCard";
import { PaginationFooter } from "../../../../components/AdminWidgets";
import { ALLOCATION_STATUSES } from "../../../../constants/domain";
import { EmptyState, ErrorState, FilterChips, LoadingState, Screen, Title } from "../../../../components/ui";
import { listAllocations } from "../../../../services/allocations";

export default function AdminAllocations() { const [status, setStatus] = useState(""); const [data, setData] = useState(null); const [error, setError] = useState(null); const [loading, setLoading] = useState(false); const load = useCallback(async (page = 1) => { setLoading(true); try { setError(null); setData(await listAllocations({ page, limit: 20, status: status || undefined })); } catch (requestError) { setError(requestError); } finally { setLoading(false); } }, [status]); useFocusEffect(useCallback(() => { load(); }, [load])); return <Screen><Title subtitle="Review match reasoning and assignment history.">Allocations</Title><FilterChips value={status} onChange={setStatus} values={[{ label: "All", value: "" }, ...ALLOCATION_STATUSES.map((value) => ({ label: value.replaceAll("_", " "), value }))]} />{!data && loading ? <LoadingState /> : error ? <ErrorState message={error.message} onRetry={load} /> : !data?.items.length ? <EmptyState title="No allocations found" /> : <>{data.items.map((item) => <AllocationCard key={item._id} allocation={item} onPress={() => router.push({ pathname: "/(app)/admin/allocations/[id]", params: { id: item._id } })} />)}<PaginationFooter pagination={data.pagination} loading={loading} onPage={load} /></>}</Screen>; }
