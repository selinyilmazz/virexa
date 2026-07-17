import Link from "next/link";

type AuthFooterProps = {
  text: string;
  linkLabel: string;
  href: string;
};

export function AuthFooter({ text, linkLabel, href }: AuthFooterProps) {
  return (
    <p className="mt-6 text-center text-sm text-slate-500">
      {text}{" "}
      <Link href={href} className="font-semibold text-[#2f67e8] transition-colors hover:text-[#2556c9]">
        {linkLabel}
      </Link>
    </p>
  );
}
