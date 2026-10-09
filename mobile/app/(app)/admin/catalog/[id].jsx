import { useCallback, useState } from "react";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import CatalogForm from "../../../../components/CatalogForm";
import { ErrorState, LoadingState, Screen } from "../../../../components/ui";
import { listCatalog } from "../../../../services/admin";

export default function EditCatalogItem() { const { id } = useLocalSearchParams(); const [item, setItem] = useState(null); const [error, setError] = useState(null); const load = useCallback(async () => { try { const items = await listCatalog({ active: "all" }); const found = items.find((entry) => entry._id === id); if (!found) throw new Error("Catalog item not found"); setItem(found); } catch (requestError) { setError(requestError); } }, [id]); useFocusEffect(useCallback(() => { load(); }, [load])); if (error) return <Screen><ErrorState message={error.message} onRetry={load} /></Screen>; if (!item) return <Screen><LoadingState /></Screen>; return <CatalogForm item={item} />; }
