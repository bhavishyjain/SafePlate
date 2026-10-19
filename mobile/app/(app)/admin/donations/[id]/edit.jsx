import { useEffect, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { View } from "react-native";
import BackButtonHeader from "../../../../../components/BackButtonHeader";
import DonationForm from "../../../../../components/DonationForm";
import { ErrorState, LoadingState, Screen } from "../../../../../components/ui";
import { getDonation } from "../../../../../services/donations";
import { useTranslation } from "../../../../../utils/i18n/LanguageProvider";

export default function AdminEditDonation() { const { tr } = useTranslation(); const { id } = useLocalSearchParams(); const [donation, setDonation] = useState(null); const [error, setError] = useState(null); useEffect(() => { getDonation(id).then(setDonation).catch(setError); }, [id]); return <View style={{ flex: 1 }}><BackButtonHeader title={tr("Edit donation")} />{error ? <Screen><ErrorState message={error.message} /></Screen> : !donation ? <Screen><LoadingState /></Screen> : <DonationForm donation={donation} onSuccess={() => router.replace({ pathname: "/(app)/admin/donations/[id]", params: { id } })} />}</View>; }
