import Image from "next/image";

type AuthHeroPanelProps = {
  title: string;
  description: string;
};

const heroFeatures = [
  {
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" strokeLinejoin="round" />
      </svg>
    ),
    title: "AI Summaries",
    description: "Get key insights from long articles in seconds.",
  },
  {
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1Z" strokeLinejoin="round" />
      </svg>
    ),
    title: "Save & Organize",
    description: "Bookmark your favorite articles and read them later.",
  },
  {
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 2 4 5v6c0 5 3.4 8.9 8 11 4.6-2.1 8-6 8-11V5l-8-3Z" strokeLinejoin="round" />
        <path d="m9 12 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "Trusted Sources",
    description: "News from verified sources you can rely on.",
  },
];

export function AuthHeroPanel({ title, description }: AuthHeroPanelProps) {
  return (
    <div className="relative hidden flex-col justify-center overflow-hidden bg-slate-50 p-10 lg:flex lg:p-12">
      <h1 className="text-4xl font-bold tracking-tight text-slate-950">{title}</h1>
      <p className="mt-4 max-w-md text-lg leading-relaxed text-slate-500">{description}</p>

      <div className="relative mx-auto mt-14 mb-8 w-full max-w-sm">
        <span aria-hidden="true" className="absolute -left-3 -top-6 text-xl text-blue-300">
          ✦
        </span>
        <span aria-hidden="true" className="absolute left-12 -top-9 text-sm text-blue-200">
          ✦
        </span>

        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-lg">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-[#2f67e8]">
            ✦ AI-Summary
          </span>

          <div className="mt-4 flex items-start gap-3">
            <span className="relative size-16 shrink-0 overflow-hidden rounded-2xl">
              <Image src="/images/auth/ai-summary-avatar.jpg" alt="" fill className="object-cover" />
            </span>
            <div className="mt-1 flex-1 space-y-2">
              <span className="block h-2.5 w-full rounded-full bg-slate-100" />
              <span className="block h-2.5 w-4/5 rounded-full bg-slate-100" />
              <span className="block h-2.5 w-full rounded-full bg-slate-100" />
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <span className="block h-2.5 w-full rounded-full bg-slate-100" />
            <span className="block h-2.5 w-11/12 rounded-full bg-slate-100" />
            <span className="block h-2.5 w-3/4 rounded-full bg-slate-100" />
          </div>
        </div>

        <span
          aria-hidden="true"
          className="absolute -bottom-4 -right-4 flex size-14 items-center justify-center rounded-2xl bg-[#2f67e8] text-white shadow-lg"
        >
          <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M9.5 3a3 3 0 0 1 3 3v.2A2.8 2.8 0 0 1 15 9a2.8 2.8 0 0 1 0 5.6V17a3 3 0 0 1-3 3h-.2A2.8 2.8 0 0 1 9 17.4M9.5 3A3 3 0 0 0 6.5 6v.2A2.8 2.8 0 0 0 4.5 9a2.8 2.8 0 0 0 0 5.6V17a3 3 0 0 0 3 3h.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>

        <span className="absolute -bottom-5 left-4 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-950 shadow-sm">
          <svg aria-hidden="true" viewBox="0 0 24 24" className="size-3.5 text-[#2f67e8]" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2 4 5v6c0 5 3.4 8.9 8 11 4.6-2.1 8-6 8-11V5l-8-3Z" strokeLinejoin="round" />
          </svg>
          Trusted Sources
        </span>
      </div>

      <ul className="mt-6 space-y-5">
        {heroFeatures.map((feature) => (
          <li key={feature.title} className="flex items-start gap-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#2f67e8]">
              {feature.icon}
            </span>
            <div>
              <p className="font-semibold text-slate-950">{feature.title}</p>
              <p className="mt-0.5 text-sm text-slate-500">{feature.description}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
