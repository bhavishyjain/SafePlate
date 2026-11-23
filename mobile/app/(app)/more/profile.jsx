import { useState } from "react";
import { View } from "react-native";
import Toast from "react-native-toast-message";
import BackButtonHeader from "../../../components/BackButtonHeader";
import { Button, Field, Screen, Section, Surface, useColors } from "../../../components/ui";
import { useAuth } from "../../../utils/context/auth";
import { useTranslation } from "../../../utils/i18n/LanguageProvider";

export default function AccountProfile() {
  const { tr } = useTranslation();
  const colors = useColors();
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [organization, setOrganization] = useState(user?.organization || "");
  const [loading, setLoading] = useState(false);
  const save = async () => {
    if (!name.trim() || phone.trim().length < 7) return Toast.show({ type: "error", text1: tr("Enter a valid name and phone number") });
    setLoading(true);
    try {
      await updateProfile({ name: name.trim(), phone: phone.trim(), organization: organization.trim() });
      Toast.show({ type: "success", text1: tr("Profile updated") });
    } catch (error) {
      Toast.show({ type: "error", text1: tr("Could not update profile"), text2: error.message });
    } finally {
      setLoading(false);
    }
  };
  return <View style={{ flex: 1, backgroundColor: colors.backgroundPrimary }}>
    <BackButtonHeader title={tr("Edit profile")} />
    <Screen contentStyle={{ paddingTop: 24 }}>
      <Section title={tr("Account details")}>
        <Field label={tr("Full name")} value={name} onChangeText={setName} />
        <Field label={tr("Phone")} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <Field label={tr("Organization")} value={organization} onChangeText={setOrganization} />
      </Section>
      <Section title={tr("Email address")}>
        <Surface style={{ paddingVertical: 15 }}><Field label={tr("Email cannot be changed")} value={user?.email || ""} editable={false} style={{ color: colors.textSecondary }} /></Surface>
      </Section>
      <Button title={tr("Save profile")} onPress={save} loading={loading} style={{ marginTop: 8 }} />
    </Screen>
  </View>;
}
