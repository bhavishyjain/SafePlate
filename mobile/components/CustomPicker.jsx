import { Check, ChevronDown, Search, X } from "lucide-react-native";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { FlatList, Modal, Text, TouchableOpacity, View } from "react-native";
import { TextInput as PaperTextInput } from "react-native-paper";
import { darkColors, lightColors } from "../colors";
import { useTheme } from "../utils/context/theme";

const CustomPicker = forwardRef(
  (
    {
      data,
      value,
      onChange,
      placeholder = "Select an option",
      searchPlaceholder = "Search...",
      containerStyle,
      onItemPress,
      closeOnSelect = true,
    },
    ref,
  ) => {
    const { colorScheme } = useTheme();
    const colors = colorScheme === "dark" ? darkColors : lightColors;

    const [isVisible, setIsVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    // Track how modal was closed
    const userSelectedItemRef = useRef(false);

    // Expose method to open modal from parent
    useImperativeHandle(ref, () => ({
      click: () => setIsVisible(true),
    }));

    const filteredData = data?.filter((item) =>
      item.label.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    const selectedItem = data?.find((item) => item.value === value);

    const handleSelect = (item) => {
      userSelectedItemRef.current = true;

      onChange(item);
      setSearchQuery("");

      if (closeOnSelect) {
        setIsVisible(false);
      }
    };

    // Reset selection state when modal closes
    useEffect(() => {
      if (!isVisible) {
        userSelectedItemRef.current = false;
      }
    }, [isVisible]);

    return (
      <>
        <TouchableOpacity
          className="justify-center border"
          style={[
            {
              minHeight: 54,
              borderRadius: 14,
              backgroundColor: colors.backgroundSecondary,
              borderColor: colors.borderStrong,
            },
            containerStyle,
          ]}
          onPress={() => setIsVisible(true)}
        >
          <View className="flex-row items-center px-4">
            {selectedItem?.icon && (
              <View className="mr-2">{selectedItem.icon}</View>
            )}
            <Text
              className="text-sm flex-1"
              style={{
                color: selectedItem ? colors.textPrimary : colors.placeholder,
              }}
            >
              {selectedItem ? selectedItem.label : placeholder}
            </Text>
            <ChevronDown size={18} color={colors.textSecondary} />
          </View>
        </TouchableOpacity>

        <Modal
          visible={isVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setIsVisible(false)}
        >
          <TouchableOpacity
            className="flex-1 justify-center items-center p-5"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
            activeOpacity={1}
            onPress={() => setIsVisible(false)}
          >
            <View
            className="w-full overflow-hidden border"
              style={{
                backgroundColor: colors.backgroundSecondary,
                borderColor: colors.borderStrong,
                borderRadius: 22,
                maxWidth: 520,
                maxHeight: "70%",
              }}
            >
              {/* Header */}
              <View
                className="flex-row justify-between items-center p-4 border-b"
                style={{ borderBottomColor: colors.border }}
              >
                <Text
                  className="text-lg font-semibold"
                  style={{ color: colors.textPrimary }}
                >
                  {placeholder}
                </Text>
                <TouchableOpacity onPress={() => setIsVisible(false)} style={{ width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: colors.backgroundElevated }}><X size={18} color={colors.textPrimary} /></TouchableOpacity>
              </View>

              {/* Search */}
              {searchPlaceholder && (
                <View className="m-3">
                  <PaperTextInput
                    left={<PaperTextInput.Icon icon={() => <Search size={18} color={colors.textSecondary} />} />}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder={searchPlaceholder}
                    placeholderTextColor={colors.placeholder}
                    className="h-[48px] text-sm"
                    style={{ backgroundColor: colors.backgroundElevated, borderRadius: 12 }}
                    underlineStyle={{ display: "none" }}
                    contentStyle={{
                      color: colors.textPrimary,
                      fontSize: 14,
                      paddingHorizontal: 0,
                    }}
                    theme={{
                      colors: {
                        primary: "transparent",
                        text: colors.textPrimary,
                        placeholder: colors.placeholder,
                      },
                    }}
                  />
                </View>
              )}

              {/* List */}
              <FlatList
                data={filteredData}
                keyExtractor={(item) => item.value}
                renderItem={({ item, index }) => (
                  <TouchableOpacity
                    className={`p-4 flex-row items-center justify-between ${
                      index < filteredData.length - 1 ? "border-b" : ""
                    }`}
                    style={[
                      index < filteredData.length - 1 && {
                        borderBottomColor: colors.border,
                      },
                      item.value === value && {
                        backgroundColor: colors.primarySoft,
                      },
                    ]}
                    onPress={() => handleSelect(item)}
                  >
                    <View className="flex-row items-center gap-3 flex-1">
                      {item.icon && <View>{item.icon}</View>}
                      <Text
                        className="text-sm"
                        style={[
                          { color: colors.textPrimary },
                          item.value === value && { fontWeight: "600" },
                        ]}
                      >
                        {item.label}
                      </Text>
                    </View>
                    {item.value === value && (
                      <Check size={18} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <Text
                    className="text-center p-5 text-sm"
                    style={{ color: colors.textSecondary }}
                  >
                    No results found
                  </Text>
                }
              />
            </View>
          </TouchableOpacity>
        </Modal>
      </>
    );
  },
);

CustomPicker.displayName = "CustomPicker";

export default CustomPicker;
