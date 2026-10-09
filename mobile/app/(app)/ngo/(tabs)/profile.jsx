import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import NgoProfileForm from "../../../../components/NgoProfileForm";
import { ErrorState, LoadingState, Screen } from "../../../../components/ui";
import { getMyNgo } from "../../../../services/ngos";

export default function NgoProfile() {
  const [profile, setProfile] = useState(undefined); const [error, setError] = useState(null);
  useFocusEffect(useCallback(() => { getMyNgo().then(setProfile).catch((requestError) => { if (requestError.code === "NGO_NOT_FOUND") setProfile(null); else setError(requestError); }); }, []));
  if (error) return <Screen><ErrorState message={error.message} /></Screen>;
  if (profile === undefined) return <Screen><LoadingState /></Screen>;
  return <NgoProfileForm key={profile?._id || "new"} profile={profile} onSuccess={setProfile} />;
}
