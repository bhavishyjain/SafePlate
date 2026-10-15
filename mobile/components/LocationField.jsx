import { useState } from "react";
import * as Location from "expo-location";
import Toast from "react-native-toast-message";
import { Button, Field, Surface, useColors } from "./ui";
import { LocateFixed } from "lucide-react-native";
import { Text, View } from "react-native";

export default function LocationField({ value, onChange }) {
  const colors = useColors(); const [loading, setLoading] = useState(false);
  const coordinates = value?.coordinates || ["", ""];
  const update = (index, next) => { const result = [...coordinates]; result[index] = next; onChange({ type: "Point", coordinates: result }); };
  const locate = async () => { setLoading(true); try { const permission = await Location.requestForegroundPermissionsAsync(); if (!permission.granted) throw new Error("Location permission was not granted"); const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }); onChange({ type: "Point", coordinates: [current.coords.longitude, current.coords.latitude] }); } catch (error) { Toast.show({ type: "error", text1: "Location unavailable", text2: error.message }); } finally { setLoading(false); } };
  return <Surface><View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 }}><LocateFixed color={colors.primary} size={20} /><View style={{ flex: 1 }}><Text style={{ color: colors.textPrimary, fontWeight: "700", fontSize: 16 }}>Pickup location</Text><Text style={{ color: colors.textSecondary, fontSize: 12, lineHeight: 17, marginTop: 2 }}>Use the device location or enter coordinates.</Text></View></View><Button title="Use current location" icon={LocateFixed} onPress={locate} loading={loading} variant="secondary" style={{ marginBottom: 16 }} /><View style={{ flexDirection: "row", gap: 10 }}><View style={{ flex: 1 }}><Field label="Latitude" value={String(coordinates[1] ?? "")} onChangeText={(next) => update(1, next)} keyboardType="numbers-and-punctuation" /></View><View style={{ flex: 1 }}><Field label="Longitude" value={String(coordinates[0] ?? "")} onChangeText={(next) => update(0, next)} keyboardType="numbers-and-punctuation" /></View></View><Text style={{ color: colors.textTertiary, fontSize: 11 }}>Coordinates are stored as longitude, latitude.</Text></Surface>;
}
