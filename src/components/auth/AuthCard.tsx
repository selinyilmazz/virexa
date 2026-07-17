type AuthCardProps = {
  title: string;
  children: React.ReactNode;
};

export function AuthCard({ title, children }: AuthCardProps) {
  return (
    <div className="flex flex-col justify-center p-6 sm:p-10 lg:p-12">
      <h1 className="text-3xl font-bold tracking-tight text-slate-950">{title}</h1>
      <div className="mt-6">{children}</div>
    </div>
  );
}
