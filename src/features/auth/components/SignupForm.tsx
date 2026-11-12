import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { startCheckout } from "@/lib/billing";
import { useAuthStore } from "@/stores/useAuthStore";
import type { OrganizationPlan } from "@/types";

type Step = "details" | "plan";

export function SignupForm() {
  const navigate = useNavigate();
  const signup = useAuthStore((s) => s.signup);

  const [step, setStep] = useState<Step>("details");
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [plan, setPlan] = useState<OrganizationPlan>("free");

  const [error, setError] = useState<string | null>(null);
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Evita chamar signup() de novo (o que erraria com "usuário já cadastrado")
  // quando o usuário tenta o checkout novamente após uma falha.
  const [hasSignedUp, setHasSignedUp] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  function handleContinue(e: React.FormEvent) {
    e.preventDefault();
    setStep("plan");
  }

  function goToAppOnFreePlan() {
    navigate("/");
  }

  async function confirmAndFinish() {
    setError(null);
    setCheckoutError(null);
    setIsSubmitting(true);

    if (!hasSignedUp) {
      const { error: signupError, needsEmailConfirmation: needsConfirmation } = await signup({
        name,
        companyName,
        email,
        password,
      });

      if (signupError) {
        setError(signupError);
        setIsSubmitting(false);
        return;
      }
      if (needsConfirmation) {
        setNeedsEmailConfirmation(true);
        setIsSubmitting(false);
        return;
      }
      setHasSignedUp(true);
    }

    if (plan === "free") {
      setIsSubmitting(false);
      goToAppOnFreePlan();
      return;
    }

    const origin = window.location.origin;
    const { error: checkoutErrorMessage } = await startCheckout(
      `${origin}/assinatura/retorno?status=success`,
      `${origin}/assinatura/retorno?status=cancel`
    );
    setIsSubmitting(false);
    if (checkoutErrorMessage) {
      toast.error(checkoutErrorMessage);
      setCheckoutError(checkoutErrorMessage);
    }
    // em caso de sucesso o browser é redirecionado para o Stripe Checkout,
    // não há o que fazer aqui
  }

  function handlePlanSubmit(e: React.FormEvent) {
    e.preventDefault();
    void confirmAndFinish();
  }

  if (needsEmailConfirmation) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Confirme seu e-mail</CardTitle>
          <CardDescription>
            Enviamos um link de confirmação para {email}. Confirme seu e-mail para acessar o CRM.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link to="/login" className="text-sm font-medium text-foreground underline">
            Voltar para o login
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (step === "plan") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Escolha seu plano</CardTitle>
          <CardDescription>Você pode mudar de plano quando quiser em Configurações</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePlanSubmit} className="flex flex-col gap-4">
            <div className="grid gap-3">
              <PlanOption
                title="Gratuito"
                description="1 coluna extra no Kanban, ideal para começar."
                selected={plan === "free"}
                onSelect={() => setPlan("free")}
              />
              <PlanOption
                title="Assinar — R$299,00/mês"
                description="Colunas ilimitadas no Kanban e recursos completos."
                selected={plan === "paid"}
                onSelect={() => setPlan("paid")}
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
            {checkoutError && (
              <p className="text-sm text-destructive">
                Não foi possível iniciar o pagamento. Você pode tentar de novo ou seguir usando o
                plano gratuito por enquanto.
              </p>
            )}

            <div className="flex flex-col gap-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? "Processando..."
                  : plan === "paid"
                    ? "Assinar e criar conta"
                    : "Criar conta gratuita"}
              </Button>
              {checkoutError && (
                <Button type="button" variant="outline" onClick={goToAppOnFreePlan}>
                  Continuar no plano gratuito
                </Button>
              )}
              <Button type="button" variant="ghost" onClick={() => setStep("details")}>
                Voltar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Criar conta</CardTitle>
        <CardDescription>Comece a usar o CRM da sua empresa</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleContinue} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Seu nome</Label>
            <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="companyName">Nome da empresa</Label>
            <Input
              id="companyName"
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" className="mt-2">
            Continuar
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Já tem uma conta?{" "}
            <Link to="/login" className="font-medium text-foreground underline">
              Entrar
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

interface PlanOptionProps {
  title: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
}

function PlanOption({ title, description, selected, onSelect }: PlanOptionProps) {
  return (
    <label
      className={cn(
        "flex cursor-pointer flex-col gap-1 rounded-lg border p-4 transition-colors",
        selected ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium">{title}</span>
        <div className="flex items-center gap-2">
          {selected && <Check className="size-4 text-primary" />}
          <input
            type="radio"
            name="plan"
            className="size-4 accent-primary"
            checked={selected}
            onChange={onSelect}
          />
        </div>
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
    </label>
  );
}
