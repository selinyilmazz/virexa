import { trendingTopics, type TrendingTopic } from "@/data/trendingTopics";

type TrendingTopicCardProps = {
  topic: TrendingTopic;
};

export function TrendingTopicCard({ topic }: TrendingTopicCardProps) {
  return (
    <li>
      <a
        href={`/topics/${topic.name.toLowerCase().replaceAll(" ", "-")}`}
        className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-3 transition-shadow hover:shadow-md"
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-800">
          {topic.rank}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-slate-950">
            {topic.name}
          </span>
          <span className="mt-0.5 block text-xs text-slate-500">
            {topic.articleCount}
          </span>
        </span>
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="size-6 shrink-0 text-[#2f67e8]"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="m4 16 6-6 4 4 6-7" />
          <path d="M15 7h5v5" />
        </svg>
      </a>
    </li>
  );
}

export function TrendingTopics() {
  return (
    <section
      aria-labelledby="trending-topics-title"
      className="w-full rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="px-1">
        <h2 id="trending-topics-title" className="text-3xl font-bold tracking-tight text-slate-950">
          🔥 Trending Topics
        </h2>
        <p className="mt-1 text-base text-slate-500">Most discussed topics today</p>
      </div>
      <ol className="mt-4 space-y-4">
        {trendingTopics.map((topic) => (
          <TrendingTopicCard key={topic.rank} topic={topic} />
        ))}
      </ol>
    </section>
  );
}
