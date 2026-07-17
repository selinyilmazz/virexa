type EmptySearchStateProps = {
  query: string;
  hasFilters?: boolean;
};

export function EmptySearchState({ query, hasFilters = false }: EmptySearchStateProps) {
  const heading = query ? `No results for "${query}"` : hasFilters ? "No articles match these filters" : "Start typing to search";
  const body = query
    ? "Try a different keyword, or check the popular searches in the sidebar."
    : hasFilters
      ? "Try widening the time range or selecting different categories."
      : "Use the search bar above to find news, topics, and sources across Virexa.";

  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
      <span aria-hidden="true" className="flex size-16 items-center justify-center rounded-full bg-slate-100 text-3xl">
        🔍
      </span>
      <h2 className="mt-6 text-2xl font-bold tracking-tight text-slate-950">{heading}</h2>
      <p className="mt-2 max-w-md text-base leading-relaxed text-slate-500">{body}</p>
    </div>
  );
}
