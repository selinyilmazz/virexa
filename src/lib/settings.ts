export type UserSettings = {
  darkMode: boolean;
  language: string;
  summaryLength: "short" | "medium" | "long";
  preferredCategories: string[];
  notifications: {
    email: boolean;
    push: boolean;
    weeklyDigest: boolean;
  };
  emailPreferences: {
    productUpdates: boolean;
    marketingEmails: boolean;
    accountActivity: boolean;
  };
  privacy: {
    publicProfile: boolean;
    showReadingActivity: boolean;
  };
  autoPlayVideos: boolean;
  compactView: boolean;
  openLinksInNewTab: boolean;
};

export const defaultSettings: UserSettings = {
  darkMode: false,
  language: "en",
  summaryLength: "medium",
  preferredCategories: ["Technology", "AI"],
  notifications: {
    email: true,
    push: false,
    weeklyDigest: true,
  },
  emailPreferences: {
    productUpdates: true,
    marketingEmails: false,
    accountActivity: true,
  },
  privacy: {
    publicProfile: true,
    showReadingActivity: false,
  },
  autoPlayVideos: false,
  compactView: false,
  openLinksInNewTab: true,
};

const STORAGE_KEY = "virexa:settings";

export function loadSettings(): UserSettings {
  if (typeof window === "undefined") return defaultSettings;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSettings;
    const parsed = JSON.parse(raw) as Partial<UserSettings>;
    return {
      ...defaultSettings,
      ...parsed,
      notifications: { ...defaultSettings.notifications, ...parsed.notifications },
      emailPreferences: { ...defaultSettings.emailPreferences, ...parsed.emailPreferences },
      privacy: { ...defaultSettings.privacy, ...parsed.privacy },
    };
  } catch {
    return defaultSettings;
  }
}

export function saveSettings(settings: UserSettings) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function resetSettings() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(STORAGE_KEY);
  }
}
