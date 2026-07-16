export function NewsletterCard() {
  return (
    <section
      aria-labelledby="newsletter-title"
      className="w-full rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <h2 id="newsletter-title" className="font-serif text-3xl font-bold tracking-tight text-slate-950">
        📬 Stay Updated
      </h2>
      <p className="mt-1 text-base text-slate-500">Get the latest headlines in your inbox every morning.</p>

      <div className="mt-4 flex flex-col gap-3">
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <input
          id="newsletter-email"
          type="email"
          placeholder="you@example.com"
          className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-base text-slate-900 outline-none placeholder:text-slate-500"
        />
        <button
          type="button"
          className="flex h-12 w-full items-center justify-center rounded-xl bg-[#2f67e8] px-6 text-base font-semibold text-white transition-colors hover:bg-[#2556c9]"
        >
          Subscribe
        </button>
      </div>
    </section>
  );
}
