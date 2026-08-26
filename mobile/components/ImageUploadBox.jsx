import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as FileSystem from "expo-file-system/legacy";
import { Image } from "expo-image";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import { darkColors, lightColors } from "../colors";
import { GET_PRESIGNED_UPLOAD_URL } from "../url";
import apiCall from "../utils/api";
import { useSettings } from "../utils/context/settings";
import { useTheme } from "../utils/context/theme";

export default function ImageUploadBox({
  label,
  orderId,
  type,
  token,
  onUploaded,
}) {
  const UPLOAD_MIME_TYPE = "image/webp";
  const UPLOAD_WIDTH = 800;
  const UPLOAD_COMPRESS = 0.65;

  const { colorScheme } = useTheme();
  const colors = colorScheme === "dark" ? darkColors : lightColors;

  const [remoteUrl, setRemoteUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");

  const { settings } = useSettings();
  const abortControllerRef = useRef(null);

  const storageKey = `order_delivery_upload:${orderId}:${type}`;

  useEffect(() => {
    const loadSavedUrl = async () => {
      try {
        const saved = await AsyncStorage.getItem(storageKey);
        if (saved) {
          setRemoteUrl(saved);
          onUploaded?.(saved);
        }
      } catch (e) {
        console.log("Failed to load saved upload url", e);
      }
    };

    loadSavedUrl();

    return () => {
      // Cleanup abort controller on unmount
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [storageKey]);

  const saveUrl = async (url) => {
    try {
      await AsyncStorage.setItem(storageKey, url);
    } catch (e) {
      console.log("Failed to save upload url", e);
    }
  };

  // ✅ DIAGNOSTIC: Log upload attempt details
  const logUploadAttempt = (method, success, error = null) => {
    const logData = {
      timestamp: new Date().toISOString(),
      method,
      success,
      orderId,
      type,
      platform: Platform.OS,
      error: error?.message || null,
    };
    console.log("📊 Upload Attempt:", JSON.stringify(logData, null, 2));

    // TODO: Send to your analytics/logging service
    // analytics.track('image_upload_attempt', logData);
  };

  const normalizeFileUri = (uri) => {
    if (!uri) return uri;
    if (uri.startsWith("file://") || uri.startsWith("content://")) return uri;
    return `file://${uri}`;
  };

  const readLocalFileAsBlob = async (fileUri) => {
    const normalizedUri = normalizeFileUri(fileUri);
    const localResponse = await fetch(normalizedUri);

    if (!localResponse.ok) {
      throw new Error(
        `Local file read failed (${localResponse.status || "unknown"})`,
      );
    }

    return localResponse.blob();
  };

  const normalizeUploadHeaders = (headers = {}) => {
    const cleaned = {};

    Object.entries(headers || {}).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;
      cleaned[key] = String(value);
    });

    const hasContentType = Object.keys(cleaned).some(
      (key) => key.toLowerCase() === "content-type",
    );

    if (!hasContentType) {
      cleaned["Content-Type"] = UPLOAD_MIME_TYPE;
    }

    return cleaned;
  };

  const getPresignUploadConfig = (presignData) => {
    const method = String(
      presignData?.http_method || presignData?.method || "PUT",
    ).toUpperCase();

    const headers = normalizeUploadHeaders(
      presignData?.upload_headers ||
        presignData?.headers ||
        presignData?.signed_headers ||
        {},
    );

    return { method, headers };
  };

  // ✅ METHOD 1: FileSystem.uploadAsync (Most reliable on React Native)
  const uploadViaFileSystem = async (uploadUrl, fileUri, options = {}) => {
    setUploadProgress("Uploading via FileSystem...");
    const method = options?.method || "PUT";
    const headers = normalizeUploadHeaders(options?.headers);

    try {
      const uploadResult = await FileSystem.uploadAsync(
        uploadUrl,
        normalizeFileUri(fileUri),
        {
          httpMethod: method,
          headers,
          uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
        },
      );

      if (uploadResult.status >= 200 && uploadResult.status < 300) {
        logUploadAttempt("FileSystem", true);
        return { success: true };
      }

      throw new Error(`HTTP ${uploadResult.status}: ${uploadResult.body}`);
    } catch (error) {
      logUploadAttempt("FileSystem", false, error);
      throw error;
    }
  };

  // ✅ METHOD 2: Fetch with timeout
  const uploadViaFetch = async (uploadUrl, fileUri, options = {}) => {
    setUploadProgress("Uploading via Fetch...");
    const method = options?.method || "PUT";
    const headers = normalizeUploadHeaders(options?.headers);
    let timeoutId;

    try {
      const fileBlob = await readLocalFileAsBlob(fileUri);

      // Create abort controller for timeout
      abortControllerRef.current = new AbortController();
      timeoutId = setTimeout(
        () => abortControllerRef.current.abort(),
        30000,
      );

      const response = await fetch(uploadUrl, {
        method,
        body: fileBlob,
        headers,
        signal: abortControllerRef.current.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      logUploadAttempt("Fetch", true);
      return { success: true };
    } catch (error) {
      if (timeoutId) clearTimeout(timeoutId);
      logUploadAttempt("Fetch", false, error);
      throw error;
    } finally {
      abortControllerRef.current = null;
    }
  };

  // ✅ METHOD 2B: Axios with Blob/Form fallback
  const uploadViaAxios = async (uploadUrl, fileUri, options = {}) => {
    setUploadProgress("Uploading via Axios...");
    const method = (options?.method || "PUT").toLowerCase();
    const headers = normalizeUploadHeaders(options?.headers);

    try {
      const fileBlob = await readLocalFileAsBlob(fileUri);

      const response = await axios({
        method,
        url: uploadUrl,
        data: fileBlob,
        headers,
        timeout: 30000,
        validateStatus: () => true,
      });

      if (response.status >= 200 && response.status < 300) {
        logUploadAttempt("Axios", true);
        return { success: true };
      }

      throw new Error(`HTTP ${response.status}`);
    } catch (error) {
      logUploadAttempt("Axios", false, error);
      throw error;
    }
  };

  const uploadViaPresignedPost = async (
    uploadUrl,
    fileUri,
    fields = {},
    fileFieldName = "file",
  ) => {
    setUploadProgress("Uploading via signed form...");

    try {
      const formData = new FormData();

      Object.entries(fields || {}).forEach(([key, value]) => {
        formData.append(key, String(value ?? ""));
      });

      formData.append(fileFieldName, {
        uri: normalizeFileUri(fileUri),
        type: UPLOAD_MIME_TYPE,
        name: `order-${orderId}-${type}.webp`,
      });

      const response = await axios.post(uploadUrl, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 30000,
        validateStatus: () => true,
      });

      if (response.status >= 200 && response.status < 300) {
        logUploadAttempt("PresignedPOST", true);
        return { success: true };
      }

      throw new Error(`HTTP ${response.status}`);
    } catch (error) {
      logUploadAttempt("PresignedPOST", false, error);
      throw error;
    }
  };

  // ✅ METHOD 3: ImgBB (Always works, no CORS issues)
  const uploadViaImgBB = async (fileUri) => {
    setUploadProgress("Uploading to ImgBB...");

    if (!settings?.imgbbApiKey) {
      throw new Error("ImgBB API key not configured");
    }

    try {
      // Try multipart first (more reliable for larger mobile images)
      try {
        const formData = new FormData();
        formData.append("key", settings.imgbbApiKey);
        formData.append("image", {
          uri: normalizeFileUri(fileUri),
          type: UPLOAD_MIME_TYPE,
          name: `order-${orderId}-${type}.webp`,
        });

        const multipartResponse = await axios.post(
          "https://api.imgbb.com/1/upload",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
            timeout: 60000,
          },
        );

        if (multipartResponse.data?.data?.url) {
          logUploadAttempt("ImgBB", true);
          return { success: true, url: multipartResponse.data.data.url };
        }
      } catch (multipartError) {
        console.log("⚠️ ImgBB multipart failed:", multipartError?.message);
      }

      const base64 = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const response = await axios.post(
        "https://api.imgbb.com/1/upload",
        `key=${encodeURIComponent(settings.imgbbApiKey)}&image=${encodeURIComponent(base64)}`,
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          timeout: 60000,
        },
      );

      if (response.data?.data?.url) {
        logUploadAttempt("ImgBB", true);
        return { success: true, url: response.data.data.url };
      }

      throw new Error("Invalid ImgBB response");
    } catch (error) {
      logUploadAttempt("ImgBB", false, error);
      throw error;
    }
  };

  // ✅ MAIN UPLOAD ORCHESTRATOR
  const executeUpload = async (processedImageUri) => {
    const errors = [];
    let finalUrl = null;

    // Step 1: Get presigned URL
    setUploadProgress("Getting upload URL...");
    let presignData;

    try {
      const response = await apiCall({
        method: "POST",
        url: GET_PRESIGNED_UPLOAD_URL,
        data: {
          folder: `order_delivery/${orderId}`,
          extension: "webp",
          type,
          token,
        },
        timeout: 10000, // ✅ Add timeout
      });

      if (!response?.data?.upload_url) {
        throw new Error("Server did not return upload URL");
      }

      presignData = response.data;
      finalUrl = presignData.public_url; // Default to this
      const presignConfig = getPresignUploadConfig(presignData);
      const hasPresignedPostFields =
        !!presignData?.fields &&
        typeof presignData.fields === "object" &&
        Object.keys(presignData.fields).length > 0;

      console.log("✅ Presigned URL obtained:", {
        url: presignData.upload_url.substring(0, 50) + "...",
        method: presignConfig.method,
        headerKeys: Object.keys(presignConfig.headers),
        hasFields: hasPresignedPostFields,
        expiresIn: "~60s (assumed)",
      });

      presignData._uploadConfig = presignConfig;
      presignData._hasPresignedPostFields = hasPresignedPostFields;
    } catch (error) {
      console.error("❌ Failed to get presigned URL:", error.message);
      errors.push(`Presigned URL: ${error.message}`);

      // If we can't get presigned URL, go straight to ImgBB
      try {
        const result = await uploadViaImgBB(processedImageUri);
        return result.url;
      } catch (_imgbbError) {
        throw new Error(`Cannot get upload URL from server: ${error.message}`);
      }
    }

    // Step 1B: Signed POST form upload (if backend returns fields)
    if (presignData._hasPresignedPostFields) {
      try {
        await uploadViaPresignedPost(
          presignData.upload_url,
          processedImageUri,
          presignData.fields,
          presignData.file_field || presignData.fileField || "file",
        );
        console.log("✅ Upload successful via signed POST form");
        return finalUrl;
      } catch (error) {
        console.log("⚠️ Signed POST upload failed:", error.message);
        errors.push(`PresignedPOST: ${error.message}`);
      }
    }

    // Step 2: Try FileSystem upload (most reliable)
    try {
      await uploadViaFileSystem(
        presignData.upload_url,
        processedImageUri,
        presignData._uploadConfig,
      );
      console.log("✅ Upload successful via FileSystem");
      return finalUrl;
    } catch (error) {
      console.log("⚠️ FileSystem upload failed:", error.message);
      errors.push(`FileSystem: ${error.message}`);
    }

    // Step 3: Try Fetch upload
    try {
      await uploadViaFetch(
        presignData.upload_url,
        processedImageUri,
        presignData._uploadConfig,
      );
      console.log("✅ Upload successful via Fetch");
      return finalUrl;
    } catch (error) {
      console.log("⚠️ Fetch upload failed:", error.message);
      errors.push(`Fetch: ${error.message}`);
    }

    // Step 3B: Try Axios upload
    try {
      await uploadViaAxios(
        presignData.upload_url,
        processedImageUri,
        presignData._uploadConfig,
      );
      console.log("✅ Upload successful via Axios");
      return finalUrl;
    } catch (error) {
      console.log("⚠️ Axios upload failed:", error.message);
      errors.push(`Axios: ${error.message}`);
    }

    // Step 4: Fallback to ImgBB
    console.log("⚠️ All presigned methods failed, trying ImgBB...");
    try {
      const result = await uploadViaImgBB(processedImageUri);
      console.log("✅ Upload successful via ImgBB");
      return result.url;
    } catch (error) {
      console.log("❌ ImgBB upload failed:", error.message);
      errors.push(`ImgBB: ${error.message}`);
    }

    // All methods failed
    throw new Error(
      `All upload methods failed:\n${errors.map((e, i) => `${i + 1}. ${e}`).join("\n")}`,
    );
  };

  const pickAndUpload = async (fromCamera = false) => {
    try {
      setLoading(true);
      setUploadProgress("Checking permissions...");

      // ===== PERMISSION =====
      const perm = fromCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!perm.granted) {
        Toast.show({
          type: "error",
          text1: "Permission denied",
          text2: "Please allow camera/gallery access",
          position: "bottom",
        });
        return;
      }

      // ===== PICK IMAGE =====
      setUploadProgress(
        "Opening " + (fromCamera ? "camera" : "gallery") + "...",
      );

      const result = fromCamera
        ? await ImagePicker.launchCameraAsync({
          quality: 0.8,
          exif: false,
        })
        : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          quality: 0.8,
          exif: false,
        });

      if (result.canceled) {
        setLoading(false);
        return;
      }

      const image = result.assets[0];
      console.log("📷 Image selected:", {
        width: image.width,
        height: image.height,
        uri: image.uri.substring(0, 50) + "...",
      });

      // ===== COMPRESS =====
      setUploadProgress("Compressing image...");

      const processed = await ImageManipulator.manipulateAsync(
        image.uri,
        [{ resize: { width: UPLOAD_WIDTH } }],
        {
          compress: UPLOAD_COMPRESS,
          format: ImageManipulator.SaveFormat.WEBP,
        },
      );

      const processedUri = normalizeFileUri(processed.uri);
      const fileInfo = await FileSystem.getInfoAsync(processedUri, {
        size: true,
      });
      console.log("🗜️ Image compressed:", {
        uri: processedUri.substring(0, 50) + "...",
        size: fileInfo?.size ?? null,
        exists: fileInfo?.exists ?? null,
      });

      if (!fileInfo?.exists) {
        throw new Error("Processed image file could not be read");
      }

      // ===== UPLOAD =====
      const uploadedUrl = await executeUpload(processedUri);

      // ===== SUCCESS =====
      setRemoteUrl(uploadedUrl);
      onUploaded(uploadedUrl);
      await saveUrl(uploadedUrl);

      Toast.show({
        type: "success",
        text1: "Upload successful",
        text2: `${label} uploaded`,
        position: "bottom",
      });

      console.log("✅ UPLOAD COMPLETE:", uploadedUrl.substring(0, 60) + "...");
    } catch (error) {
      console.error("❌ UPLOAD FAILED:", error);

      Toast.show({
        type: "error",
        text1: "Upload failed",
        text2: error?.message || "Please try again",
        visibilityTime: 6000,
        position: "bottom",
      });
    } finally {
      setLoading(false);
      setUploadProgress("");
    }
  };

  const showOptions = () => {
    if (loading) return;

    if (remoteUrl) {
      Alert.alert(
        "Replace Image?",
        "This will replace the current image.",
        [
          { text: "Take Photo", onPress: () => pickAndUpload(true) },
          { text: "Choose from Gallery", onPress: () => pickAndUpload(false) },
          { text: "Cancel", style: "cancel" },
        ],
        { cancelable: true },
      );
      return;
    }

    Alert.alert(
      "Upload Image",
      "Choose how to upload",
      [
        { text: "Take Photo", onPress: () => pickAndUpload(true) },
        { text: "Choose from Gallery", onPress: () => pickAndUpload(false) },
        { text: "Cancel", style: "cancel" },
      ],
      { cancelable: true },
    );
  };

  return (
    <View style={{ alignItems: "center" }}>
      <Text
        style={{ color: colors.textPrimary, marginBottom: 6, fontSize: 12 }}
      >
        {label}
      </Text>

      <TouchableOpacity
        onPress={showOptions}
        disabled={loading}
        activeOpacity={0.7}
        style={{
          width: 120,
          height: 120,
          borderWidth: 2,
          borderStyle: "dashed",
          borderColor: loading ? colors.muted + "50" : colors.muted,
          borderRadius: 12,
          justifyContent: "center",
          alignItems: "center",
          overflow: "hidden",
          backgroundColor: colors.backgroundSecondary,
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? (
          <View style={{ alignItems: "center", paddingHorizontal: 8 }}>
            <ActivityIndicator color={colors.primary} size="large" />
            {uploadProgress && (
              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: 9,
                  marginTop: 8,
                  textAlign: "center",
                }}
                numberOfLines={2}
              >
                {uploadProgress}
              </Text>
            )}
          </View>
        ) : remoteUrl ? (
          <Image
            source={remoteUrl}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
          />
        ) : (
          <Text style={{ fontSize: 32, color: colors.textSecondary }}>+</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
