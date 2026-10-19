import { useCallback, useState } from "react";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";
import Toast from "react-native-toast-message";
import BackButtonHeader from "../../../../components/BackButtonHeader";
import DialogBox from "../../../../components/DialogBox";
import { DetailRow } from "../../../../components/AdminWidgets";
import { formatDateTime } from "../../../../constants/domain";
import { Button, ErrorState, LoadingState, Screen, StatusBadge, Surface, useColors } from "../../../../components/ui";
import { getUser, revokeUserSessions, setUserStatus } from "../../../../services/admin";
import { useAuth } from "../../../../utils/context/auth";
import { useTranslation } from "../../../../utils/i18n/LanguageProvider";
export default function AdminUserDetail() {
  const {
    tr
  } = useTranslation();
  const {
    id
  } = useLocalSearchParams();
  const {
    user: current
  } = useAuth();
  const colors = useColors();
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [action, setAction] = useState(null);
  const [loading, setLoading] = useState(false);
  const load = useCallback(async () => {
    try {
      setError(null);
      setUser(await getUser(id));
    } catch (requestError) {
      setError(requestError);
    }
  }, [id]);
  useFocusEffect(useCallback(() => {
    load();
  }, [load]));
  const mutate = async () => {
    setLoading(true);
    try {
      if (action === "sessions") await revokeUserSessions(id);else await setUserStatus(id, user.isActive === false);
      Toast.show({
        type: "success",
        text1: action === "sessions" ? tr("Sessions revoked") : tr("Account updated")
      });
      setAction(null);
      load();
    } catch (requestError) {
      Toast.show({
        type: "error",
        text1: requestError.message
      });
    } finally {
      setLoading(false);
    }
  };
  if (!user && !error) return <Screen><LoadingState /></Screen>;
  if (error) return <Screen><ErrorState message={error.message} onRetry={load} /></Screen>;
  const self = String(current?._id || current?.id) === String(id);
  return <View style={{
    flex: 1,
    backgroundColor: colors.backgroundPrimary
  }}><BackButtonHeader title={tr("User details")} /><Screen><View style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 18
      }}><Text style={{
          color: colors.textPrimary,
          fontSize: 24,
          fontWeight: "900"
        }}>{user.name}</Text><StatusBadge status={user.isActive === false ? "DISABLED" : "ACTIVE"} /></View><Surface style={{
        marginBottom: 18
      }}><DetailRow label={tr("Email")} value={user.email} /><DetailRow label={tr("Phone")} value={user.phone} /><DetailRow label={tr("Organization")} value={user.organization} /><DetailRow label={tr("Role")} value={user.role} /><DetailRow label={tr("Created")} value={formatDateTime(user.createdAt)} last /></Surface><View style={{
        gap: 10
      }}><Button title={tr("Revoke all sessions")} variant="secondary" onPress={() => setAction("sessions")} /><Button title={user.isActive === false ? tr("Enable account") : tr("Disable account")} variant={user.isActive === false ? "primary" : "danger"} disabled={self && user.isActive !== false} onPress={() => setAction("status")} />{self ? <Text style={{
          color: colors.textSecondary,
          fontSize: 12
        }}>{tr("You cannot disable your own Admin account.")}</Text> : null}</View></Screen><DialogBox visible={Boolean(action)} title={action === "sessions" ? tr("Revoke all sessions?") : user.isActive === false ? tr("Enable this account?") : tr("Disable this account?")} message={action === "sessions" ? tr("Every refresh-token session for this user will be revoked.") : user.isActive === false ? tr("The user will be able to sign in again.") : tr("The user will be signed out and blocked from accessing SafePlate.")} confirmText={tr("Confirm")} onConfirm={mutate} onCancel={() => setAction(null)} loading={loading} confirmButtonStyle={action === "status" && user.isActive !== false ? {
      backgroundColor: colors.danger
    } : undefined} /></View>;
}
