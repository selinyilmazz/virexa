"use client";

import { Component, type ReactNode } from "react";

type ToastRenderBoundaryProps = {
  /** Plain-text fallback shown if the rich `<AuthToast>` subtree throws
      during render - deliberately zero-dependency markup (no shared
      component, no dynamic class lookup) so this branch itself cannot
      fail the same way the thing it's guarding against might have. */
  fallbackMessage: string;
  children: ReactNode;
};

type ToastRenderBoundaryState = { hasError: boolean };

/**
 * Newsletter frontend bug fix (round 4): isolates the toast subtree with
 * a real React error boundary - the only mechanism that can actually
 * catch a render-phase exception (a plain try/catch in `handleSubmit`
 * cannot: React commits/renders `<AuthToast>` on a later pass, after
 * `handleSubmit`'s own try/catch has already finished, so nothing thrown
 * during that render was ever visible to this file's own logging in
 * three earlier debugging rounds - all of it faithfully proved the fetch/
 * state-update logic runs cleanly, which is true, and beside the point).
 *
 * Root cause this addresses: `src/app/error.tsx` already exists as a
 * site-wide boundary (an earlier claim in this thread that no error
 * boundary exists in this app was wrong - a directory-scoping mistake on
 * my end). Without a LOCAL boundary, any exception anywhere in
 * `NewsletterSection`'s render - including the small `AuthToast` subtree
 * that only ever mounts once a subscribe succeeds - unmounts the entire
 * page and falls through to that root boundary, matching "falls into the
 * global error screen immediately after a successful subscription"
 * exactly. On a browser/render path where React recovers a little more
 * quietly instead, the same failure instead looks like "no toast ever
 * appears" - two different symptoms, one shared trigger: the toast render
 * throwing.
 *
 * This boundary stops that propagation at the toast itself: if anything
 * in `<AuthToast>` throws, only this small subtree is replaced (with a
 * guaranteed-safe plain-text fallback carrying the same message), and the
 * homepage - and the rest of `NewsletterSection` - never unmounts. That
 * makes both reported symptoms structurally impossible going forward,
 * regardless of what turns out to be the deeper cause. The real
 * exception is still logged (`[NewsletterSection] toast render failed`)
 * so it isn't lost.
 */
export class ToastRenderBoundary extends Component<ToastRenderBoundaryProps, ToastRenderBoundaryState> {
  state: ToastRenderBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ToastRenderBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("[NewsletterSection] toast render failed - falling back to plain-text toast:", error);
  }

  componentDidUpdate(prevProps: ToastRenderBoundaryProps) {
    // A new toast (different message) after a previous render failure -
    // give the real component another chance rather than staying stuck
    // on the fallback for the rest of the session.
    if (this.state.hasError && prevProps.fallbackMessage !== this.props.fallbackMessage) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-x-0 top-6 z-50 mx-auto w-fit max-w-[90vw] rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg"
        >
          {this.props.fallbackMessage}
        </div>
      );
    }
    return this.props.children;
  }
}
