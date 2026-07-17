import Link from "next/link";

type LegalPageLayoutProps = {
  title: string;
  description: string;
  children: React.ReactNode;
};

export function LegalPageLayout({ title, description, children }: LegalPageLayoutProps) {
  return (
    <main className="bg-[#f8fafc] px-5 py-8 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
          <Link href="/" className="transition-colors hover:text-[#2f67e8]">
            Home
          </Link>
          <span aria-hidden="true">›</span>
          <span className="font-medium text-slate-950">{title}</span>
        </nav>

        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-4xl font-bold tracking-tight text-slate-950">{title}</h1>
          <p className="mt-2 text-base text-slate-500">{description}</p>

          <div className="mt-8 space-y-8">{children}</div>
        </div>
      </div>
    </main>
  );
}
