import { useEffect, useState } from "react";
import { AppWindow, Building2, CornerDownLeft, Loader2, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import type { OAuthAuthorizationDetails } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore, type OAuthAuthorizationResult } from "@/stores/useAuthStore";
import { useCrmStore } from "@/stores/useCrmStore";
import { useTeamStore } from "@/stores/useTeamStore";

const MISSING_ID_MESSAGE = "Este pedido expirou ou é inválido. Volte ao Claude e tente conectar de novo.";

export function OAuthConsent({ authorizationId }: { authorizationId: string | null }) {
  const getOAuthAuthorization = useAuthStore((s) => s.getOAuthAuthorization);
  // result is tagged with its id so a stale answer never renders for a different request
  const [loaded, setLoaded] = useState<{ id: string; result: OAuthAuthorizationResult } | null>(null);

  useEffect(() => {
    if (!authorizationId) return;
    let active = true;
    // the store dedupes by id, so StrictMode's second effect run reuses the same request
    getOAuthAuthorization(authorizationId).then((result) => {
      if (!active) return;
      if (result.status === "redirect") window.location.replace(result.redirectUrl);
      setLoaded({ id: authorizationId, result });
    });
    return () => {
      active = false;
    };
  }, [authorizationId, getOAuthAuthorization]);

  if (!authorizationId) return <ErrorCard message={MISSING_ID_MESSAGE} />;

  const result = loaded?.id === authorizationId ? loaded.result : null;
  if (!result) return <StatusCard text="Carregando pedido de acesso..." />;
  if (result.status === "error") return <ErrorCard message={result.message} />;
  if (result.status === "redirect") return <StatusCard text="Acesso já autorizado. Redirecionando..." />;
  return <ConsentCard details={result.details} />;
}

function ConsentCard({ details }: { details: OAuthAuthorizationDetails }) {
  const decide = useAuthStore((s) => s.decideOAuthAuthorization);
  const logout = useAuthStore((s) => s.logout);
  const currentUserId = useAuthStore((s) => s.currentUserId);
  const organization = useCrmStore((s) => s.organization);
  const crmLoading = useCrmStore((s) => s.isLoading);
  const userName = useTeamStore((s) => s.users.find((u) => u.id === currentUserId)?.name);

  const [pending, setPending] = useState<"approve" | "deny" | null>(null);
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const appName = details.client.name || "Um aplicativo";
  const companyName = organization?.name ?? (crmLoading ? "Carregando..." : "Empresa não encontrada");

  async function handleDecision(decision: "approve" | "deny") {
    setError(null);
    setPending(decision);
    const outcome = await decide(details.authorization_id, decision);
    if (outcome.error !== null) {
      setPending(null);
      setError(outcome.error);
      return;
    }
    setRedirecting(true);
    window.location.assign(outcome.redirectUrl);
  }

  if (redirecting) return <StatusCard text="Redirecionando de volta ao aplicativo..." />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Autorizar acesso</CardTitle>
        <CardDescription>
          <span className="font-medium text-foreground">{appName}</span> está pedindo acesso à sua conta do
          IBEIA CRM. Se você autorizar, ele poderá ver e alterar os dados da sua empresa com as mesmas
          permissões que você tem.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <InfoRow icon={<AppWindow />} label="Aplicativo">
          <span className="flex items-center gap-2">
            {details.client.logo_uri && (
              <img src={details.client.logo_uri} alt="" className="size-5 rounded-sm object-contain" />
            )}
            {appName}
          </span>
        </InfoRow>
        <InfoRow icon={<CornerDownLeft />} label="Vai voltar para">
          <span className="font-mono text-xs break-all">{details.redirect_uri}</span>
        </InfoRow>
        <InfoRow icon={<UserRound />} label="Conectado como">
          {userName ? (
            <>
              {userName}
              <span className="block text-muted-foreground">{details.user.email}</span>
            </>
          ) : (
            details.user.email
          )}
        </InfoRow>
        <InfoRow icon={<Building2 />} label="Empresa">
          {companyName}
        </InfoRow>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
      <CardFooter className="flex flex-col gap-3">
        <div className="flex w-full gap-2">
          <Button
            variant="outline"
            className="flex-1"
            disabled={pending !== null}
            onClick={() => handleDecision("deny")}
          >
            {pending === "deny" ? "Recusando..." : "Recusar"}
          </Button>
          <Button className="flex-1" disabled={pending !== null} onClick={() => handleDecision("approve")}>
            {pending === "approve" ? "Autorizando..." : "Autorizar"}
          </Button>
        </div>
        <p className="text-center text-sm text-muted-foreground">
          Não é você?{" "}
          <button
            type="button"
            className="font-medium text-foreground underline disabled:opacity-50"
            disabled={pending !== null}
            onClick={() => logout()}
          >
            Entrar com outra conta
          </button>
        </p>
      </CardFooter>
    </Card>
  );
}

function InfoRow({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 text-muted-foreground [&_svg]:size-4">{icon}</span>
      <div className="min-w-0 flex-1 text-sm">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="font-medium">{children}</div>
      </div>
    </div>
  );
}

function StatusCard({ text }: { text: string }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        {text}
      </CardContent>
    </Card>
  );
}

function ErrorCard({ message }: { message: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Não foi possível autorizar</CardTitle>
        <CardDescription>{message}</CardDescription>
      </CardHeader>
    </Card>
  );
}
