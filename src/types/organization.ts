export type OrganizationPlan = "free" | "paid";

export interface Organization {
  id: string;
  name: string;
  whatsapp_connected: boolean;
  whatsapp_phone_number?: string;
  plan: OrganizationPlan;
  subscription_status: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}
