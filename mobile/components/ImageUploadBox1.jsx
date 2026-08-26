import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import { colors } from "../colors";

export default function ImageUploadBox({ fileState, setFileState, label }) {
  const [preview, setPreview] = useState(fileState ?? null);
  const [loading, setLoading] = useState(false);

  const requestPermissions = async (fromCamera) => {
    if (fromCamera) {
      const cam = await ImagePicker.requestCameraPermissionsAsync();
      return cam.granted;
    } else {
      const lib = await ImagePicker.requestMediaLibraryPermissionsAsync();
      return lib.granted;
    }
  };

  const pickImage = async (fromCamera = false) => {
    setLoading(true);

    const granted = await requestPermissions(fromCamera);

    if (!granted) {
      Toast.show({
        type: "error",
        text1: "Permission denied",
      });
      setLoading(false);
      return;
    }

    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ quality: 1 })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          quality: 1,
        });

    if (result.canceled) {
      setLoading(false);
      return;
    }

    try {
      const image = result.assets[0];

      const compressed = await ImageManipulator.manipulateAsync(
        image.uri,
        [{ resize: { width: 1000 } }],
        {
          compress: 0.8,
          format: ImageManipulator.SaveFormat.WEBP,
          // base64: true,
        }
      );

      const uploadFile = {
        uri: compressed.uri,
        name: `${label}_${Date.now()}.webp`,
        type: "image/webp",
        // base64: compressed.base64,
      };

      setPreview(compressed.uri);
      setFileState(uploadFile);
    } catch (e) {
      Toast.show({
        type: "error",
        text1: "Image processing failed",
      });
    } finally {
      setLoading(false);
    }
  };

  const showPickerOptions = () => {
    Alert.alert("Upload Image", "Choose an option", [
      { text: "Camera", onPress: () => pickImage(true) },
      { text: "Gallery", onPress: () => pickImage(false) },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  return (
    <View style={{ alignItems: "center" }}>
      <Text
        style={{
          color: colors.textPrimary,
          marginBottom: 6,
          fontSize: 14,
        }}
      >
        {label}
      </Text>

      <TouchableOpacity
        onPress={showPickerOptions}
        activeOpacity={0.7}
        style={{
          width: 120,
          height: 120,
          borderWidth: 2,
          borderStyle: "dashed",
          borderColor: "#ccc",
          borderRadius: 12,
          justifyContent: "center",
          alignItems: "center",
          overflow: "hidden",
        }}
      >
        {loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : preview ? (
          <Image
            source={{ uri: preview }}
            style={{
              width: "100%",
              height: "100%",
            }}
            resizeMode="cover"
          />
        ) : (
          <Text style={{ fontSize: 32, color: "#aaa" }}>+</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
