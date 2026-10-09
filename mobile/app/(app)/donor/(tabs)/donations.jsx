import { useCallback, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import DonationCard from "../../../../components/DonationCard";
import { Button, EmptyState, ErrorState, FilterChips, LoadingState, Screen, Title } from "../../../../components/ui";
import { listDonations } from "../../../../services/donations";
import { DONATION_STATUSES } from "../../../../constants/domain";

export default function Donations() {
  const [status, setStatus] = useState(""); const [data, setData] = useState(null); const [error, setError] = useState(null); const [loadingMore, setLoadingMore] = useState(false);
  const load = useCallback(async (page = 1, append = false) => { try { setError(null); const next = await listDonations({ page, limit: 20, status: status || undefined }); setData((current) => append ? { ...next, items: [...(current?.items || []), ...next.items] } : next); } catch (requestError) { setError(requestError); } finally { setLoadingMore(false); } }, [status]);
  useFocusEffect(useCallback(() => { setData(null); load(); }, [load]));
  return <Screen><Title subtitle="Filter and review every donation you have submitted.">My donations</Title><FilterChips value={status} onChange={setStatus} values={[{ label: "All", value: "" }, ...DONATION_STATUSES.map((value) => ({ label: value.replaceAll("_", " "), value }))]} />{!data && !error ? <LoadingState /> : error ? <ErrorState message={error.message} onRetry={() => load()} /> : !data.items.length ? <EmptyState title="No donations found" message="Try another status or create a donation." /> : <>{data.items.map((donation) => <DonationCard key={donation._id} donation={donation} onPress={() => router.push({ pathname: "/(app)/donor/donations/[id]", params: { id: donation._id } })} />)}{data.pagination.page < data.pagination.pages ? <Button title="Load more" loading={loadingMore} variant="secondary" onPress={() => { setLoadingMore(true); load(data.pagination.page + 1, true); }} /> : null}</>}</Screen>;
}
