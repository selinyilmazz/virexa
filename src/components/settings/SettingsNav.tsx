export const SETTINGS_CATEGORIES = [
  { id: "general", label: "General", icon: "⚙️" },
  { id: "appearance", label: "Appearance", icon: "🎨" },
  { id: "reading", label: "Reading", icon: "📖" },
  { id: "notifications", label: "Notifications", icon: "🔔" },
  { id: "privacy", label: "Privacy", icon: "🔒" },
] as const;

export type SettingsCategoryId = (typeof SETTINGS_CATEGORIES)[number]["id"];

type SettingsNavProps = {
  active: SettingsCategoryId;
  onSelect: (id: SettingsCategoryId) => void;
};

/**
 * Apple-Settings-style category navigation (product polishing phase,
 * 2nd pass) - a sticky left sidebar on larger screens, a horizontal
 * scroll strip on mobile, replacing the old single long scrolling page
 * of every settings section stacked one after another. `SettingsForm`
 * still owns one shared form state and a single "Save Changes" action
 * across every category (same as Apple's own System Settings: switching
 * category never discards an edit in another one) - this component only
 * controls which category's sections are currently visible.
 */
export function SettingsNav({ active, onSelect }: SettingsNavProps) {
  return (
    <nav
      aria-label="Settings categories"
      className="flex gap-1.5 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm lg:sticky lg:top-28 lg:flex-col lg:overflow-visible"
    >
      {SETTINGS_CATEGORIES.map((category) => {
        const isActive = category.id === active;
        return (
          <button
            key={category.id}
            type="button"
            onClick={() => onSelect(category.id)}
            aria-current={isActive ? "true" : undefined}
            className={`flex shrink-0 items-center gap-2.5 rounded-xl px-4 py-2.5 text-left text-sm font-semibold transition-colors lg:w-full ${
              isActive ? "bg-[#2f67e8] text-white" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
            }`}
          >
            <span aria-hidden="true">{category.icon}</span>
            {category.label}
          </button>
        );
      })}
    </nav>
  );
}
