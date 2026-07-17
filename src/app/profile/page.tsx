import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { ProfileSummaryCard } from "@/components/profile/ProfileSummaryCard";
import { ReadingStatsCard } from "@/components/profile/ReadingStatsCard";
import { ProfileEditForm } from "@/components/profile/ProfileEditForm";
import { SecurityCard } from "@/components/profile/SecurityCard";
import { DangerZoneCard } from "@/components/profile/DangerZoneCard";

export const metadata: Metadata = {
  title: "Profile | Virexa",
};

export default function ProfilePage() {
  return (
    <>
      <Header />
      <main className="bg-[#f8fafc] px-5 py-8 sm:px-8">
        <div className="mx-auto max-w-[1820px]">
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <Link href="/" className="transition-colors hover:text-[#2f67e8]">
              Home
            </Link>
            <span aria-hidden="true">›</span>
            <span className="font-medium text-slate-950">Profile</span>
          </nav>

          <div className="mt-4">
            <h1 className="text-4xl font-bold tracking-tight text-slate-950">Profile</h1>
            <p className="mt-2 text-base text-slate-500">Manage your account and view your reading activity.</p>
          </div>

          <div className="mt-8 grid gap-8 xl:grid-cols-[340px_minmax(0,1fr)]">
            <div className="space-y-6 xl:sticky xl:top-28 xl:self-start">
              <ProfileSummaryCard />
              <ReadingStatsCard />
            </div>

            <div className="min-w-0 space-y-6">
              <ProfileEditForm />
              <SecurityCard />
              <DangerZoneCard />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
