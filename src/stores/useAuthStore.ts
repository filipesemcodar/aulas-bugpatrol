import { create } from "zustand";
import type { AuthError, OAuthAuthorizationDetails, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import { useCrmStore } from "@/stores/useCrmStore";
import { useTeamStore } from "@/stores/useTeamStore";
import { useWhatsappStore } from "@/stores/useWhatsappStore";

interface SignupInput {
  name: string;
  companyName: string;
  email: string;
  password: string;
}

export type OAuthAuthorizationResult =
  | { status: "consent"; details: OAuthAuthorizationDetails }
  | { status: "redirect"; redirectUrl: string }
  | { status: "error"; message: string };

export type OAuthDecisionResult = { redirectUrl: string; error: null } | { redirectUrl: null; error: string };

const OAUTH_INVALID_REQUEST_MESSAGE =
  "Este pedido expirou ou é inválido. Volte ao Claude e tente conectar de novo.";
const OAUTH_NETWORK_MESSAGE =
  "Não foi possível falar com o servidor. Verifique sua conexão e recarregue a página.";

function oauthErrorMessage(error: AuthError): string {
  // status 0 / undefined = request never reached Supabase (offline, CORS, timeout)
  return error.status ? OAUTH_INVALID_REQUEST_MESSAGE : OAUTH_NETWORK_MESSAGE;
}

// One request per authorization_id for the lifetime of the page: Supabase only answers
// a given authorization once, and React StrictMode runs effects twice in dev — so the
// second call must reuse the first promise instead of hitting the API again.
const oauthAuthorizationRequests = new Map<string, Promise<OAuthAuthorizationResult>>();

interface AuthState {
  session: Session | null;
  isAuthenticated: boolean;
  currentUserId: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  signup: (
    input: SignupInput
  ) => Promise<{ error: string | null; needsEmailConfirmation: boolean }>;
  logout: () => Promise<void>;
  getOAuthAuthorization: (authorizationId: string) => Promise<OAuthAuthorizationResult>;
  decideOAuthAuthorization: (
    authorizationId: string,
    decision: "approve" | "deny"
  ) => Promise<OAuthDecisionResult>;
}

export const useAuthStore = create<AuthState>()((set) => {
  supabase.auth.onAuthStateChange((event, session) => {
    set({
      session,
      isAuthenticated: !!session,
      currentUserId: session?.user.id ?? null,
      isLoading: false,
    });

    // handled here (not in a useEffect) so the very first INITIAL_SESSION event
    // can't be missed while a subscriber is still mounting
    if (event === "SIGNED_OUT") {
      // a cached OAuth answer belongs to the user who fetched it, not the next one
      oauthAuthorizationRequests.clear();
      useCrmStore.getState().reset();
      useTeamStore.getState().reset();
      useWhatsappStore.getState().reset();
    } else if (session && (event === "INITIAL_SESSION" || event === "SIGNED_IN")) {
      useCrmStore.getState().loadOrganizationData();
      useTeamStore.getState().loadTeam();
      useWhatsappStore.getState().loadStatus();
    }
  });

  return {
    session: null,
    isAuthenticated: false,
    currentUserId: null,
    isLoading: true,

    login: async (email, password) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error: error?.message ?? null };
    },

    signup: async ({ name, companyName, email, password }) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name, company_name: companyName } },
      });
      return {
        error: error?.message ?? null,
        needsEmailConfirmation: !error && !data.session,
      };
    },

    logout: async () => {
      await supabase.auth.signOut();
    },

    getOAuthAuthorization: (authorizationId) => {
      const cached = oauthAuthorizationRequests.get(authorizationId);
      if (cached) return cached;

      const request = supabase.auth.oauth
        .getAuthorizationDetails(authorizationId)
        .then(({ data, error }): OAuthAuthorizationResult => {
          if (error || !data) {
            return { status: "error", message: error ? oauthErrorMessage(error) : OAUTH_INVALID_REQUEST_MESSAGE };
          }
          // already approved earlier → Supabase hands back the final redirect directly
          if ("redirect_url" in data) return { status: "redirect", redirectUrl: data.redirect_url };
          return { status: "consent", details: data };
        })
        .catch((): OAuthAuthorizationResult => ({ status: "error", message: OAUTH_NETWORK_MESSAGE }));

      oauthAuthorizationRequests.set(authorizationId, request);
      return request;
    },

    decideOAuthAuthorization: async (authorizationId, decision) => {
      // skipBrowserRedirect: the page performs the redirect itself after updating its UI
      const options = { skipBrowserRedirect: true };
      try {
        const { data, error } =
          decision === "approve"
            ? await supabase.auth.oauth.approveAuthorization(authorizationId, options)
            : await supabase.auth.oauth.denyAuthorization(authorizationId, options);
        if (error || !data?.redirect_url) {
          return { redirectUrl: null, error: error ? oauthErrorMessage(error) : OAUTH_INVALID_REQUEST_MESSAGE };
        }
        return { redirectUrl: data.redirect_url, error: null };
      } catch {
        return { redirectUrl: null, error: OAUTH_NETWORK_MESSAGE };
      }
    },
  };
});
