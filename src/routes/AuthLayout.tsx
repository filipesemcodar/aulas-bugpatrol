import { Navigate, Outlet, useSearchParams } from "react-router-dom";
import { FullPageSpinner } from "@/components/common/FullPageSpinner";
import { AuthShell } from "@/components/layout/AuthShell";
import { getSafeRedirect } from "@/lib/safeRedirect";
import { useAuthStore } from "@/stores/useAuthStore";

export function AuthLayout() {
  const [searchParams] = useSearchParams();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authLoading = useAuthStore((s) => s.isLoading);
  if (authLoading) return <FullPageSpinner />;
  // honors ?next= so flows like /oauth/consent resume after login
  if (isAuthenticated) return <Navigate to={getSafeRedirect(searchParams.get("next"))} replace />;

  return (
    <AuthShell>
      <Outlet />
    </AuthShell>
  );
}
