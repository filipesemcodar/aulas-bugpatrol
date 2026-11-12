export interface Lead {
  id: string;
  organization_id: string;
  column_id: string;
  name: string;
  phone: string;
  avatar_url?: string;
  source: "whatsapp" | "manual";
  column_entered_at: string;
  last_message_at?: string;
  created_at: string;
  updated_at: string;
}

export interface NewLeadInput {
  name: string;
  phone: string;
  column_id: string;
}
