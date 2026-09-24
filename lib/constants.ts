export const OWNLY_EXPLORE_URL = "/ownly";

// Admin credentials
export const ADMIN_EMAIL = "admin@gmail.com";
export const ADMIN_PASSWORD = "Admin@123";

// Storage keys
export const STORAGE_KEYS = {
  AUTH: "ownly_auth",
  PROFILE: "ownly_rapido_profile",
  ACTIVE_SESSION: "ownly_active_session",
  SESSIONS: "ownly_behavior_sessions",
  /** Set when user opens Ownly from the Rapido prototype (not direct entry) */
  OWNLY_RAPIDO_ENTRY: "ownly_rapido_entry",
} as const;

// Brand colors
export const BRAND = {
  yellow: "#FFC80A",
  dark: "#16140F",
  pink: "#E91E8C",
  pinkDark: "#C2185B",
  green: "#1C7A4E",
  bg: "#FAF8F3",
  bgDark: "#F5F3EE",
  border: "#EDE9E0",
  text: "#5C574F",
} as const;
