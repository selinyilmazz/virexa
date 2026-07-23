"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type LogoutButtonProps = {
  className?: string;
  children: React.ReactNode;
  onBeforeNavigate?: () => void;
  tabIndex?: number;
};

export function LogoutButton({ className, children, onBeforeNavigate, tabIndex }: LogoutButtonProps) {
  const router = useRouter();

  async function handleClick() {
    const supabase = createClient();
    await supabase.auth.signOut();
    onBeforeNavigate?.();
    router.push("/");
    router.refresh();
  }

  return (
    <button type="button" onClick={() => void handleClick()} className={className} tabIndex={tabIndex}>
      {children}
    </button>
  );
}
