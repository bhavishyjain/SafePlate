import { useCallback, useState } from "react";
import { View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import BackButtonHeader from "../../../../components/BackButtonHeader";
import DonationCard from "../../../../components/DonationCard";
import { PaginationFooter } from "../../../../components/AdminWidgets";
import { DONATION_STATUSES, labelFor } from "../../../../constants/domain";
import { EmptyState, ErrorState, Field, FilterChips, LoadingState, Screen } from "../../../../components/ui";
import { listDonations } from "../../../../services/donations";
import { useTranslation } from "../../../../utils/i18n/LanguageProvider";
export default function AdminDonations() {
  const {
    tr
  } = useTranslation();
  const [status, setStatus] = useState("");
  const [range, setRange] = useState({
    from: "",
    to: ""
  });
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      setError(null);
      setData(await listDonations({
        page,
        limit: 20,
        status: status || undefined,
        from: range.from || undefined,
        to: range.to || undefined
      }));
    } catch (requestError) {
      setError(requestError);
    } finally {
      setLoading(false);
    }
  }, [status, range]);
  useFocusEffect(useCallback(() => {
    load();
  }, [load]));
  return <View style={{
    flex: 1
  }}><BackButtonHeader title={tr("Donations")} /><Screen><FilterChips value={status} onChange={setStatus} values={[{
        label: tr("All"),
        value: ""
      }, ...DONATION_STATUSES.map(value => ({
        label: labelFor(value),
        value
      }))]} /><View style={{
        flexDirection: "row",
        gap: 12,
        marginBottom: 4
      }}><View style={{ flex: 1 }}><Field label={tr("From date")} value={range.from} onChangeText={from => setRange(current => ({
          ...current,
          from
        }))} placeholder={tr("YYYY-MM-DD")} /></View><View style={{ flex: 1 }}><Field label={tr("To date")} value={range.to} onChangeText={to => setRange(current => ({
          ...current,
          to
        }))} placeholder={tr("YYYY-MM-DD")} /></View></View>{!data && loading ? <LoadingState /> : error ? <ErrorState message={error.message} onRetry={load} /> : !data?.items.length ? <EmptyState title={tr("No donations found")} /> : <>{data.items.map(item => <DonationCard key={item._id} donation={item} onPress={() => router.push({
          pathname: "/(app)/admin/donations/[id]",
          params: {
            id: item._id
          }
        })} />)}<PaginationFooter pagination={data.pagination} loading={loading} onPage={load} /></>}</Screen></View>;
}
