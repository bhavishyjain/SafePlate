import { StyleSheet } from "react-native";

export const getStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      color: colors.textPrimary,
      backgroundColor: colors.backgroundPrimary,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      backgroundColor: colors.backgroundSecondary,
    },
    inputField: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 4,
      height: 50,
      paddingHorizontal: 16,
      color: colors.textPrimary,
      fontSize: 16,
    },
    btnPrimary: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      paddingVertical: 12,
      alignItems: "center",
      width: "100%",
    },
    dropdownContainer: {
      backgroundColor: colors.backgroundSecondary,
      borderColor: colors.backgroundSecondary,
      borderWidth: 1,
      borderRadius: 8,
      minHeight: 50,
    },
    textPrimary: {
      color: colors.textPrimary,
      fontSize: 14,
    },
    logoSmall: {
      width: 100,
      height: 40,
    },
    btnSecondary: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 8,
      paddingVertical: 16,
      paddingHorizontal: 16,
      alignItems: "center",
    },
    btnDanger: {
      backgroundColor: colors.danger,
      borderRadius: 8,
      paddingVertical: 16,
      alignItems: "center",
    },
    btnMono: {
      backgroundColor: colors.backgroundPrimary,
      borderRadius: 8,
      paddingVertical: 16,
      alignItems: "center",
      borderColor: colors.textPrimary,
      borderWidth: 0.1,
    },
    card: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 8,
      padding: 16,
      marginBottom: 16,
    },
  });
