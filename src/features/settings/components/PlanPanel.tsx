import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useCrmStore } from "@/stores/useCrmStore";
import { useTeamStore } from "@/stores/useTeamStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { startCheckout } from "@/lib/billing";

const SUBSCRIPTION_STATUS_LABELS: Record<string, string> = {
  active: "Ativa",
  trialing: "Em teste",
  past_due: "Pagamento atrasado",
  canceled: "Cancelada",
  unpaid: "Pagamento pendente",
  incomplete: "Aguardando pagamento",
  incomplete_expired: "Expirada",
  paused: "Pausada",
};

function describeSubscriptionStatus(status: string | null): string {
  if (!status) return "Sem informação";
  return SUBSCRIPTION_STATUS_LABELS[status] ?? "Desconhecido";
}

function formatPeriodEndLabel(status: string | null): string {
  if (status === "canceled" || status === "past_due" || status === "unpaid") {
    return "Acesso válido até";
  }
  return "Próxima renovação";
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR");
}

export function PlanPanel() {
  const organization = useCrmStore((s) => s.organization);
  const users = useTeamStore((s) => s.users);
  const currentUserId = useAuthStore((s) => s.currentUserId);
  const [isRedirecting, setIsRedirecting] = useState(false);

  if (!organization) return null;

  const currentUser = users.find((u) => u.id === currentUserId);
  const canManageBilling = currentUser?.role === "owner" || currentUser?.role === "admin";
  const isFree = organization.plan === "free";

  async function handleUpgradeClick() {
    setIsRedirecting(true);
    const origin = window.location.origin;
    const { error } = await startCheckout(
      `${origin}/assinatura/retorno?status=success`,
      `${origin}/assinatura/retorno?status=cancel`
    );
    if (error) {
      toast.error(error);
      setIsRedirecting(false);
    }
    // on success the browser navigates away to Stripe Checkout, so there's
    // no need to reset isRedirecting here
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Plano da conta</CardTitle>
        <CardDescription>Veja seu plano atual e gerencie a assinatura.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className={isFree ? undefined : "bg-accent text-primary"}>
            {isFree ? "Gratuito" : "Pago"}
          </Badge>
          {!isFree && (
            <span className="text-sm text-muted-foreground">
              Assinatura: {describeSubscriptionStatus(organization.subscription_status)}
            </span>
          )}
        </div>

        {!isFree && organization.current_period_end && (
          <p className="text-sm text-muted-foreground">
            {formatPeriodEndLabel(organization.subscription_status)}:{" "}
            {formatDate(organization.current_period_end)}
          </p>
        )}

        {isFree && canManageBilling && (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">
              Faça upgrade para desbloquear todos os recursos do IBEIA CRM.
            </p>
            <div>
              <Button onClick={handleUpgradeClick} disabled={isRedirecting}>
                {isRedirecting ? "Redirecionando..." : "Fazer upgrade — R$299,00/mês"}
              </Button>
            </div>
          </div>
        )}

        {isFree && !canManageBilling && (
          <p className="text-sm text-muted-foreground">
            Fale com um administrador para fazer upgrade do plano.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
