type EmptySearchStateProps = {
  query: string;
};

export function EmptySearchState({ query }: EmptySearchStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
      <span aria-hidden="true" className="flex size-16 items-center justify-center rounded-full bg-slate-100 text-3xl">
        🔍
      </span>
      <h2 className="mt-6 text-2xl font-bold tracking-tight text-slate-950">
        {query ? `No results for "${query}"` : "Start typing to search"}
      </h2>
      <p className="mt-2 max-w-md text-base leading-relaxed text-slate-500">
        {query
          ? "Try a different keyword, or check the popular searches in the sidebar."
          : "Use the search bar above to find news, topics, and sources across Virexa."}
      </p>
    </div>
  );
}
