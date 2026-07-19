export const SETTINGS_CATEGORIES = [
  { id: "general", label: "General" },
  { id: "reading", label: "Reading" },
  { id: "notifications", label: "Notifications" },
] as const;

export type SettingsCategoryId = (typeof SETTINGS_CATEGORIES)[number]["id"];

type SettingsNavProps = {
  active: SettingsCategoryId;
  onSelect: (id: SettingsCategoryId) => void;
};

/**
 * Settings category navigation (product polishing phase, 4th pass -
 * "premium SaaS feel"): a sticky left sidebar on larger screens, a
 * horizontal scroll strip on mobile. Text-only labels (no emoji icons -
 * they read as a generic template, not a purpose-built product) in a
 * minimal, understated style closer to Linear/Stripe settings than an
 * admin console. Only the three categories that map to a real Virexa
 * feature remain (Appearance and Privacy were removed - see
 * `SettingsForm.tsx`'s doc comment). `SettingsForm` still owns one
 * shared form state and a single "Save Changes" action across every
 * category - this component only controls which category's sections
 * are currently visible.
 */
export function SettingsNav({ active, onSelect }: SettingsNavProps) {
  return (
    <nav
      aria-label="Settings categories"
      className="flex gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm lg:sticky lg:top-28 lg:flex-col lg:overflow-visible"
    >
      {SETTINGS_CATEGORIES.map((category) => {
        const isActive = category.id === active;
        return (
          <button
            key={category.id}
            type="button"
            onClick={() => onSelect(category.id)}
            aria-current={isActive ? "true" : undefined}
            className={`shrink-0 rounded-xl px-4 py-2.5 text-left text-sm font-semibold transition-colors lg:w-full ${
              isActive ? "bg-[#2f67e8] text-white" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
            }`}
          >
            {category.label}
          </button>
        );
      })}
    </nav>
  );
}
