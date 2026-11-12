import { Navigate, useLocation, useSearchParams } from "react-router-dom";
import { FullPageSpinner } from "@/components/common/FullPageSpinner";
import { AuthShell } from "@/components/layout/AuthShell";
import { OAuthConsent } from "@/features/oauth/components/OAuthConsent";
import { loginUrlFor } from "@/lib/safeRedirect";
import { useAuthStore } from "@/stores/useAuthStore";

// Standalone route (outside AuthLayout/AppLayout): AuthLayout would bounce a logged-in
// user to "/", and AppLayout adds the sidebar. Not-logged-in users go to /login?next=...
// and come back here with the same authorization_id.
export function OAuthConsentPage() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authLoading = useAuthStore((s) => s.isLoading);

  if (authLoading) return <FullPageSpinner />;
  if (!isAuthenticated) return <Navigate to={loginUrlFor(location.pathname + location.search)} replace />;

  return (
    <AuthShell>
      <OAuthConsent authorizationId={searchParams.get("authorization_id")} />
    </AuthShell>
  );
}
