type ArticleTagsProps = {
  tags: string[];
};

export function ArticleTags({ tags }: ArticleTagsProps) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-950">Tags</h3>
      <ul className="mt-3 flex flex-wrap gap-2">
        {tags.map((tag) => (
          <li key={tag}>
            <span className="inline-flex rounded-full bg-slate-100 px-4 py-1.5 text-sm font-medium text-slate-700">
              {tag}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
