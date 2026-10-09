import { router } from "expo-router";
import DonationForm from "../../../../components/DonationForm";
export default function Donate() { return <DonationForm onSuccess={(donation) => router.replace({ pathname: "/(app)/donor/donations/[id]", params: { id: donation._id } })} />; }
