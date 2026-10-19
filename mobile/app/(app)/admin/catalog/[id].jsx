import { useCallback, useState } from "react";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { View } from "react-native";
import BackButtonHeader from "../../../../components/BackButtonHeader";
import CatalogForm from "../../../../components/CatalogForm";
import { ErrorState, LoadingState, Screen } from "../../../../components/ui";
import { listCatalog } from "../../../../services/admin";
import { useTranslation } from "../../../../utils/i18n/LanguageProvider";

export default function EditCatalogItem() { const { tr } = useTranslation(); const { id } = useLocalSearchParams(); const [item, setItem] = useState(null); const [error, setError] = useState(null); const load = useCallback(async () => { try { const items = await listCatalog({ active: "all" }); const found = items.find((entry) => entry._id === id); if (!found) throw new Error("Catalog item not found"); setItem(found); } catch (requestError) { setError(requestError); } }, [id]); useFocusEffect(useCallback(() => { load(); }, [load])); return <View style={{ flex: 1 }}><BackButtonHeader title={tr("Edit catalog item")} />{error ? <Screen><ErrorState message={error.message} onRetry={load} /></Screen> : !item ? <Screen><LoadingState /></Screen> : <CatalogForm item={item} />}</View>; }
