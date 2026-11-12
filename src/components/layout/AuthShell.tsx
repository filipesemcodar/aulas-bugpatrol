import type { ReactNode } from "react";

/** Centered card frame shared by the login/signup pages and the OAuth consent page. */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center text-xl font-semibold">IBEIA CRM</div>
        {children}
      </div>
    </div>
  );
}
