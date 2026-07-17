import { TimeFilterCard } from "@/components/search/TimeFilterCard";
import { CategoryFilterCard } from "@/components/search/CategoryFilterCard";

export function SearchFilters() {
  return (
    <div className="space-y-6 xl:sticky xl:top-28">
      <TimeFilterCard />
      <CategoryFilterCard />
    </div>
  );
}
