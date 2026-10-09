export const homeForRole = (role) => role === "NGO"
  ? "/(app)/ngo/(tabs)/home"
  : role === "ADMIN"
    ? "/(app)/admin/(tabs)/dashboard"
    : "/(app)/donor/(tabs)/home";

export const roleForSegments = (segments = []) => segments.includes("donor")
  ? "DONOR"
  : segments.includes("ngo")
    ? "NGO"
    : segments.includes("admin")
      ? "ADMIN"
      : null;

export const canAccessRoleRoute = (role, segments = []) => {
  const requestedRole = roleForSegments(segments);
  return !requestedRole || requestedRole === role;
};

