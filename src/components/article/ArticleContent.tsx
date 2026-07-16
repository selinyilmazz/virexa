import type { ArticleContentBlock } from "@/data/article";

type ArticleContentProps = {
  blocks: ArticleContentBlock[];
  sourceLabel?: string;
  sourceUrl?: string;
};

export function ArticleContent({ blocks, sourceLabel, sourceUrl }: ArticleContentProps) {
  return (
    <div>
      <div className="space-y-5">
        {blocks.map((block, index) => {
          const key = `${block.type}-${index}`;

          if (block.type === "heading") {
            return (
              <h2 key={key} className="pt-2 text-2xl font-bold tracking-tight text-slate-950">
                {block.text}
              </h2>
            );
          }

          if (block.type === "quote") {
            return (
              <blockquote
                key={key}
                className="rounded-r-2xl border-l-4 border-[#2f67e8] bg-blue-50/60 py-4 pl-5 pr-4"
              >
                <p className="text-lg italic leading-relaxed text-slate-700">{block.text}</p>
                {block.attribution && (
                  <footer className="mt-2 text-sm not-italic text-slate-500">— {block.attribution}</footer>
                )}
              </blockquote>
            );
          }

          if (block.type === "list") {
            return (
              <ul key={key} className="space-y-2">
                {block.items.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-base leading-relaxed text-slate-700">
                    <span aria-hidden="true" className="mt-2.5 size-1.5 shrink-0 rounded-full bg-[#2f67e8]" />
                    {item}
                  </li>
                ))}
              </ul>
            );
          }

          return (
            <p key={key} className="text-base leading-relaxed text-slate-700">
              {block.text}
            </p>
          );
        })}
      </div>

      {sourceLabel && sourceUrl && (
        <div className="mt-8 border-t border-slate-200 pt-6">
          <p className="text-sm font-semibold text-slate-950">Source</p>
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1.5 inline-flex items-center gap-1.5 text-sm font-medium text-[#2f67e8] transition-colors hover:text-[#2556c9]"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="size-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1" />
              <path d="M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1" />
            </svg>
            {sourceLabel}
          </a>
        </div>
      )}
    </div>
  );
}
