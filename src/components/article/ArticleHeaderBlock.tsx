type ArticleHeaderBlockProps = {
  category: string;
  title: string;
  /**
   * The article's deck/dek (structure item 5, "2-3 lines only... acts as
   * the article deck") - `null` when there's nothing honest to show here.
   * Deliberately never the raw RSS `description` (this app's established
   * rule - see `ArticleContent`'s content-precedence doc comment): this
   * is the AI rewrite's `intro` or the AI long summary's `overview` when
   * either exists, otherwise omitted entirely rather than falling back to
   * the untouched provider blurb.
   */
  deck: string | null;
};

/**
 * Category Badge + Title + Short Summary (structure items 3-5). Kept as
 * one component since all three are really one visual unit (badge sits
 * right above the headline, deck right below it) even though the page
 * spec numbers them separately.
 */
export function ArticleHeaderBlock({ category, title, deck }: ArticleHeaderBlockProps) {
  return (
    <div>
      <span className="inline-flex rounded-full bg-blue-50 px-4 py-1 text-sm font-medium text-[#2f67e8]">{category}</span>
      <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-slate-950 sm:text-4xl lg:text-[2.75rem]">{title}</h1>
      {deck && <p className="mt-4 line-clamp-3 max-w-3xl text-lg leading-relaxed text-slate-600">{deck}</p>}
    </div>
  );
}
