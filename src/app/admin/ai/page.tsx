import type { Metadata } from "next";
import { SectionCard } from "@/components/admin/SectionCard";
import { EmptyState } from "@/components/admin/EmptyState";

export const metadata: Metadata = {
  title: "AI | Virexa Admin",
};

export default function AdminAiPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">AI</h1>
        <p className="mt-1 text-sm text-slate-500">AI provider configuration and enrichment jobs.</p>
      </div>

      <SectionCard title="AI">
        <EmptyState
          icon="🤖"
          title="Coming in a future phase"
          description="This section is part of the Admin Foundation's navigation shell. Its management tools will be built in a dedicated phase."
        />
      </SectionCard>
    </div>
  );
}
