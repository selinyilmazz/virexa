"use client";

import { useRouter } from "next/navigation";
import { clearSession } from "@/lib/auth";

type LogoutButtonProps = {
  className?: string;
  children: React.ReactNode;
  onBeforeNavigate?: () => void;
};

export function LogoutButton({ className, children, onBeforeNavigate }: LogoutButtonProps) {
  const router = useRouter();

  function handleClick() {
    clearSession();
    onBeforeNavigate?.();
    router.push("/");
  }

  return (
    <button type="button" onClick={handleClick} className={className}>
      {children}
    </button>
  );
}
