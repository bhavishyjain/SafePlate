import { router } from "expo-router";
import { ArrowRight, BookOpenCheck, Building2, Database, Salad, ShieldCheck, Users } from "lucide-react-native";
import { Text, View } from "react-native";
import PressableBlock from "../../../../components/PressableBlock";
import { Screen, Section, Surface, useColors } from "../../../../components/ui";
import { useTranslation } from "../../../../utils/i18n/LanguageProvider";
const areaDefinitions = [{
  icon: Users,
  title: "User access",
  subtitle: "Search accounts, change access and revoke sessions",
  route: "/(app)/admin/users",
  accent: "info"
}, {
  icon: Building2,
  title: "NGO partners",
  subtitle: "Profiles, capacity and nutrition target overrides",
  route: "/(app)/admin/ngos",
  accent: "success"
}, {
  icon: Salad,
  title: "Nutrition catalog",
  subtitle: "Food references used during nutrition analysis",
  route: "/(app)/admin/catalog",
  accent: "warning"
}];
export default function AdminManage() {
  const {
    tr
  } = useTranslation();
  const colors = useColors();
  return <Screen contentStyle={{
    paddingBottom: 132
  }}>
    <Section title={tr("Administration")}>
      {areaDefinitions.map(area => <ManageCard key={area.title} {...area} title={tr(area.title)} subtitle={tr(area.subtitle)} tone={colors[area.accent]} colors={colors} onPress={() => router.push(area.route)} />)}
    </Section>

    <Section title={tr("Admin responsibilities")} subtitle={tr("What each area affects")}>
      <Surface>{[{
          icon: ShieldCheck,
          title: tr("Access controls"),
          body: tr("Disabling an account blocks future API access. Revoking sessions signs the user out everywhere.")
        }, {
          icon: BookOpenCheck,
          title: tr("Nutrition decisions"),
          body: tr("Catalog values and NGO overrides directly affect food analysis and allocation scoring.")
        }, {
          icon: Database,
          title: tr("Operational records"),
          body: tr("Donation and allocation history stays visible for review even after a lifecycle completes.")
        }].map((item, index) => {
          const Icon = item.icon;
          return <View key={item.title} style={{
            flexDirection: "row",
            paddingBottom: index === 2 ? 0 : 17,
            marginBottom: index === 2 ? 0 : 17,
            borderBottomWidth: index === 2 ? 0 : 1,
            borderBottomColor: colors.border
          }}><Icon size={19} color={colors.primary} /><View style={{
              flex: 1,
              marginLeft: 12
            }}><Text style={{
                color: colors.textPrimary,
                fontSize: 13,
                fontWeight: "900"
              }}>{item.title}</Text><Text style={{
                color: colors.textSecondary,
                fontSize: 12,
                lineHeight: 18,
                marginTop: 3
              }}>{item.body}</Text></View></View>;
        })}</Surface>
    </Section>
  </Screen>;
}
function ManageCard({
  icon: Icon,
  title,
  subtitle,
  tone,
  colors,
  onPress
}) {
  return <PressableBlock onPress={onPress} style={{
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 11
  }}><View style={{
      width: 46,
      height: 46,
      borderRadius: 14,
      backgroundColor: `${tone}17`,
      alignItems: "center",
      justifyContent: "center"
    }}><Icon size={21} color={tone} /></View><View style={{
      flex: 1,
      marginLeft: 14
    }}><Text style={{
        color: colors.textPrimary,
        fontSize: 15,
        fontWeight: "900"
      }}>{title}</Text><Text style={{
        color: colors.textSecondary,
        fontSize: 12,
        lineHeight: 17,
        marginTop: 3
      }}>{subtitle}</Text></View><ArrowRight size={18} color={colors.textTertiary} /></PressableBlock>;
}
