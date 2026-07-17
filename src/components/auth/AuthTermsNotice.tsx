import Link from "next/link";

type AuthTermsNoticeProps = {
  actionLabel: string;
};

export function AuthTermsNotice({ actionLabel }: AuthTermsNoticeProps) {
  return (
    <p className="mt-8 flex flex-wrap items-center justify-center gap-x-1 text-center text-xs text-slate-400">
      <svg aria-hidden="true" viewBox="0 0 24 24" className="mr-1 size-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2 4 5v6c0 5 3.4 8.9 8 11 4.6-2.1 8-6 8-11V5l-8-3Z" strokeLinejoin="round" />
      </svg>
      By {actionLabel}, you agree to our{" "}
      <Link href="#" className="font-medium text-[#2f67e8] hover:text-[#2556c9]">
        Terms of Service
      </Link>{" "}
      and{" "}
      <Link href="#" className="font-medium text-[#2f67e8] hover:text-[#2556c9]">
        Privacy Policy
      </Link>
    </p>
  );
}
