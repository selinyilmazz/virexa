import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { SettingsForm } from "@/components/settings/SettingsForm";

export const metadata: Metadata = {
  title: "Settings | Virexa",
};

export default function SettingsPage() {
  return (
    <>
      <Header />
      <main className="bg-[#f8fafc] px-5 py-8 sm:px-8">
        <div className="mx-auto max-w-3xl">
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <Link href="/" className="transition-colors hover:text-[#2f67e8]">
              Home
            </Link>
            <span aria-hidden="true">›</span>
            <span className="font-medium text-slate-950">Settings</span>
          </nav>

          <div className="mt-4">
            <h1 className="text-4xl font-bold tracking-tight text-slate-950">Settings</h1>
            <p className="mt-2 text-base text-slate-500">Manage your Virexa preferences.</p>
          </div>

          <div className="mt-8">
            <SettingsForm />
          </div>
        </div>
      </main>
    </>
  );
}
