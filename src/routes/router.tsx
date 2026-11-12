import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppLayout } from "./AppLayout";
import { AuthLayout } from "./AuthLayout";
import { LoginPage } from "@/pages/auth/LoginPage";
import { SignupPage } from "@/pages/auth/SignupPage";
import { DashboardPage } from "@/pages/crm/DashboardPage";
import { KanbanPage } from "@/pages/crm/KanbanPage";
import { LeadListPage } from "@/pages/crm/LeadListPage";
import { LeadDetailPage } from "@/pages/crm/LeadDetailPage";
import { SubscriptionReturnPage } from "@/pages/crm/SubscriptionReturnPage";
import { CompanySettingsPage } from "@/pages/settings/CompanySettingsPage";
import { OAuthConsentPage } from "@/pages/oauth/OAuthConsentPage";

export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      { path: "/login", element: <LoginPage /> },
      { path: "/cadastro", element: <SignupPage /> },
    ],
  },
  {
    element: <AppLayout />,
    children: [
      { path: "/", element: <Navigate to="/crm/dashboard" replace /> },
      { path: "/crm/dashboard", element: <DashboardPage /> },
      { path: "/crm/kanban", element: <KanbanPage /> },
      { path: "/crm/leads", element: <LeadListPage /> },
      { path: "/crm/leads/:leadId", element: <LeadDetailPage /> },
      { path: "/assinatura/retorno", element: <SubscriptionReturnPage /> },
      { path: "/configuracoes", element: <CompanySettingsPage /> },
    ],
  },
  { path: "/oauth/consent", element: <OAuthConsentPage /> },
  { path: "*", element: <Navigate to="/" replace /> },
]);
