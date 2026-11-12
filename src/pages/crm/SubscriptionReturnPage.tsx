import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/layout/PageHeader";
import { useCrmStore } from "@/stores/useCrmStore";
import { startCheckout } from "@/lib/billing";

const MAX_AUTO_RETRIES = 2;
const RETRY_DELAY_MS = 3000;

export function SubscriptionReturnPage() {
  const [searchParams] = useSearchParams();
  const status = searchParams.get("status");
  const organization = useCrmStore((s) => s.organization);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRetryingCheckout, setIsRetryingCheckout] = useState(false);
  const hasTriggeredInitialRefresh = useRef(false);
  const autoRetriesUsed = useRef(0);

  const isPaid = organization?.plan === "paid";
  const isCanceled = status === "cancel" && !isPaid;

  // loadOrganizationData({ silent: true }) skips the global `isLoading` flag
  // so AppLayout doesn't swap this page for a full-screen spinner (and
  // remount it) on every background refresh triggered from here.
  useEffect(() => {
    if (hasTriggeredInitialRefresh.current) return;
    hasTriggeredInitialRefresh.current = true;
    void useCrmStore.getState().loadOrganizationData({ silent: true });
  }, []);

  useEffect(() => {
    if (isCanceled) return;
    if (!organization || organization.plan === "paid") return;
    if (autoRetriesUsed.current >= MAX_AUTO_RETRIES) return;

    autoRetriesUsed.current += 1;
    const timer = setTimeout(() => {
      void useCrmStore.getState().loadOrganizationData({ silent: true });
    }, RETRY_DELAY_MS);
    return () => clearTimeout(timer);
  }, [isCanceled, organization]);

  async function handleManualRefresh() {
    setIsRefreshing(true);
    await useCrmStore.getState().loadOrganizationData({ silent: true });
    setIsRefreshing(false);
  }

  async function handleRetryCheckout() {
    setIsRetryingCheckout(true);
    const origin = window.location.origin;
    const { error } = await startCheckout(
      `${origin}/assinatura/retorno?status=success`,
      `${origin}/assinatura/retorno?status=cancel`
    );
    if (error) {
      toast.error(error);
      setIsRetryingCheckout(false);
    }
    // em caso de sucesso o browser navega para o Stripe Checkout, não há o
    // que resetar aqui
  }

  return (
    <div className="flex h-full flex-col">
      <PageHeader title="Assinatura" description="Status do seu pagamento" />
      <div className="flex flex-1 items-center justify-center p-4 sm:p-6">
        <Card className="w-full max-w-md">
          {isPaid && (
            <>
              <CardHeader>
                <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <CheckCircle2 className="size-5" />
                </div>
                <CardTitle>Assinatura ativada com sucesso!</CardTitle>
                <CardDescription>
                  Seu plano pago já está ativo. Agora sua organização tem colunas ilimitadas no
                  Kanban.
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Link to="/crm/kanban" className={buttonVariants()}>
                  Ir para o Kanban
                </Link>
              </CardFooter>
            </>
          )}

          {!isPaid && isCanceled && (
            <>
              <CardHeader>
                <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <XCircle className="size-5" />
                </div>
                <CardTitle>Checkout cancelado</CardTitle>
                <CardDescription>
                  Você saiu do checkout antes de concluir o pagamento. Sua conta continua no plano
                  gratuito.
                </CardDescription>
              </CardHeader>
              <CardFooter className="flex flex-wrap gap-2">
                <Button onClick={handleRetryCheckout} disabled={isRetryingCheckout}>
                  {isRetryingCheckout ? "Redirecionando..." : "Tentar novamente"}
                </Button>
                <Link to="/crm/dashboard" className={buttonVariants({ variant: "outline" })}>
                  Continuar no plano gratuito
                </Link>
              </CardFooter>
            </>
          )}

          {!isPaid && !isCanceled && (
            <>
              <CardHeader>
                <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <Loader2 className="size-5 animate-spin" />
                </div>
                <CardTitle>Pagamento em processamento</CardTitle>
                <CardDescription>
                  Estamos confirmando seu pagamento com o Stripe. Isso costuma levar só alguns
                  segundos — atualize novamente em instantes se o plano ainda não aparecer como
                  pago.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Plano atual: {organization ? "Gratuito" : "Carregando..."}
              </CardContent>
              <CardFooter className="flex flex-wrap gap-2">
                <Button onClick={handleManualRefresh} disabled={isRefreshing}>
                  {isRefreshing ? "Atualizando..." : "Atualizar status"}
                </Button>
                <Link to="/crm/dashboard" className={buttonVariants({ variant: "outline" })}>
                  Continuar no plano gratuito por enquanto
                </Link>
              </CardFooter>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
