import { useState } from "react";
import * as Location from "expo-location";
import Toast from "react-native-toast-message";
import { Button, Field, Surface, useColors } from "./ui";
import { Text, View } from "react-native";

export default function LocationField({ value, onChange }) {
  const colors = useColors(); const [loading, setLoading] = useState(false);
  const coordinates = value?.coordinates || ["", ""];
  const update = (index, next) => { const result = [...coordinates]; result[index] = next; onChange({ type: "Point", coordinates: result }); };
  const locate = async () => { setLoading(true); try { const permission = await Location.requestForegroundPermissionsAsync(); if (!permission.granted) throw new Error("Location permission was not granted"); const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }); onChange({ type: "Point", coordinates: [current.coords.longitude, current.coords.latitude] }); } catch (error) { Toast.show({ type: "error", text1: "Location unavailable", text2: error.message }); } finally { setLoading(false); } };
  return <Surface><Text style={{ color: colors.textPrimary, fontWeight: "700", marginBottom: 6 }}>Pickup location</Text><Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 14 }}>Use your device location or enter coordinates. The API receives longitude first.</Text><Button title="Use current location" onPress={locate} loading={loading} variant="secondary" style={{ marginBottom: 14 }} /><View style={{ flexDirection: "row", gap: 10 }}><View style={{ flex: 1 }}><Field label="Latitude" value={String(coordinates[1] ?? "")} onChangeText={(next) => update(1, next)} keyboardType="numbers-and-punctuation" /></View><View style={{ flex: 1 }}><Field label="Longitude" value={String(coordinates[0] ?? "")} onChangeText={(next) => update(0, next)} keyboardType="numbers-and-punctuation" /></View></View></Surface>;
}
