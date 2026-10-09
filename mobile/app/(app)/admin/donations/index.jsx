import { useCallback, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import DonationCard from "../../../../components/DonationCard";
import { PaginationFooter } from "../../../../components/AdminWidgets";
import { DONATION_STATUSES } from "../../../../constants/domain";
import { EmptyState, ErrorState, Field, FilterChips, LoadingState, Screen, Surface, Title } from "../../../../components/ui";
import { listDonations } from "../../../../services/donations";

export default function AdminDonations() {
  const [status, setStatus] = useState(""); const [range, setRange] = useState({ from: "", to: "" }); const [data, setData] = useState(null); const [error, setError] = useState(null); const [loading, setLoading] = useState(false);
  const load = useCallback(async (page = 1) => { setLoading(true); try { setError(null); setData(await listDonations({ page, limit: 20, status: status || undefined, from: range.from || undefined, to: range.to || undefined })); } catch (requestError) { setError(requestError); } finally { setLoading(false); } }, [status, range]);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  return <Screen><Title subtitle="Inspect all donor submissions and lifecycle states.">Donations</Title><FilterChips value={status} onChange={setStatus} values={[{ label: "All", value: "" }, ...DONATION_STATUSES.map((value) => ({ label: value.replaceAll("_", " "), value }))]} /><Surface style={{ marginBottom: 14 }}><Field label="From date (optional)" value={range.from} onChangeText={(from) => setRange((current) => ({ ...current, from }))} placeholder="YYYY-MM-DD" /><Field label="To date (optional)" value={range.to} onChangeText={(to) => setRange((current) => ({ ...current, to }))} placeholder="YYYY-MM-DD" /></Surface>{!data && loading ? <LoadingState /> : error ? <ErrorState message={error.message} onRetry={load} /> : !data?.items.length ? <EmptyState title="No donations found" /> : <>{data.items.map((item) => <DonationCard key={item._id} donation={item} onPress={() => router.push({ pathname: "/(app)/admin/donations/[id]", params: { id: item._id } })} />)}<PaginationFooter pagination={data.pagination} loading={loading} onPage={load} /></>}</Screen>;
}
