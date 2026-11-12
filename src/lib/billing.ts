import { supabase } from "@/lib/supabaseClient";
import { extractFunctionErrorMessage } from "@/lib/functionsError";

/**
 * Invokes the `create-checkout-session` Edge Function and redirects the
 * browser to the returned Stripe Checkout URL. Shared by the signup plan
 * selection flow and the in-app upgrade flow (Configurações > Plano) so
 * there's a single place that talks to the Edge Function.
 */
export async function startCheckout(
  successUrl: string,
  cancelUrl: string
): Promise<{ error: string | null }> {
  const { data, error } = await supabase.functions.invoke<{ url: string }>(
    "create-checkout-session",
    { body: { successUrl, cancelUrl } }
  );

  if (error || !data?.url) {
    const message = await extractFunctionErrorMessage(
      error,
      "Não foi possível iniciar o checkout. Tente novamente."
    );
    return { error: message };
  }

  window.location.href = data.url;
  return { error: null };
}
