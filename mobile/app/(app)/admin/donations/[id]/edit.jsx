import { useEffect, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import DonationForm from "../../../../../components/DonationForm";
import { ErrorState, LoadingState, Screen } from "../../../../../components/ui";
import { getDonation } from "../../../../../services/donations";

export default function AdminEditDonation() { const { id } = useLocalSearchParams(); const [donation, setDonation] = useState(null); const [error, setError] = useState(null); useEffect(() => { getDonation(id).then(setDonation).catch(setError); }, [id]); if (error) return <Screen><ErrorState message={error.message} /></Screen>; if (!donation) return <Screen><LoadingState /></Screen>; return <DonationForm donation={donation} onSuccess={() => router.replace({ pathname: "/(app)/admin/donations/[id]", params: { id } })} />; }
