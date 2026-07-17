import Link from "next/link";

export function HeroSection() {
  return (
    <section
      aria-labelledby="hero-title"
      className="mx-auto grid max-w-[1280px] gap-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:grid-cols-[0.75fr_1.25fr] lg:items-center lg:gap-10 lg:p-8"
    >
      <div className="max-w-xl">
        <p className="text-base font-semibold text-slate-800">🔥 Trending Now</p>
        <h1
          id="hero-title"
          className="mt-4 max-w-[32rem] text-4xl font-bold leading-tight tracking-tight text-slate-950"
        >
          OpenAI unveils GPT-5: Smarter, faster, and more capable than ever
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-slate-500 sm:text-xl">
          The latest generation of AI introduces major advancements in reasoning,
          coding and multimodal understanding, marking a significant step forward.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            href="/article/openai-gpt5"
            className="rounded-2xl bg-[#2f67e8] px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-[#2556c9]"
          >
            Read Full Story →
          </Link>
          <Link
            href="/category/technology"
            className="rounded-2xl border-2 border-[#2f67e8] px-6 py-3 text-base font-semibold text-[#2f67e8] transition-colors hover:bg-blue-50"
          >
            View All Trending →
          </Link>
        </div>
      </div>

      <div
        role="img"
        aria-label="Placeholder for the featured trending story image"
        className="relative min-h-72 overflow-hidden rounded-3xl bg-[radial-gradient(circle_at_58%_86%,rgba(245,158,11,0.9),transparent_12%),linear-gradient(145deg,#06172c_0%,#12294b_44%,#742c2c_100%)] sm:min-h-80 lg:min-h-[350px]"
      >
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-[linear-gradient(to_top,rgba(2,6,23,0.8),transparent)]" />
        <div className="absolute inset-x-[18%] bottom-0 h-[42%] rounded-t-[48%] bg-slate-950/70 blur-sm" />
      </div>
    </section>
  );
}
