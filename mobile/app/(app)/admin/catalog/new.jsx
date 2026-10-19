import { View } from "react-native";
import BackButtonHeader from "../../../../components/BackButtonHeader";
import CatalogForm from "../../../../components/CatalogForm";
import { useTranslation } from "../../../../utils/i18n/LanguageProvider";

export default function NewCatalogItem() {
  const { tr } = useTranslation();
  return <View style={{ flex: 1 }}><BackButtonHeader title={tr("New catalog item")} /><CatalogForm /></View>;
}
