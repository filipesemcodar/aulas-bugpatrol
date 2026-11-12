export interface WhatsappInstance {
  organization_id: string;
  instance_id: string;
  connected: boolean;
  logged_in: boolean;
  jid?: string;
  last_synced_at?: string;
  created_at: string;
  updated_at: string;
}

export type ScheduledMessageStatus = "pending" | "processing" | "sent" | "failed" | "canceled";

export interface ScheduledMessage {
  id: string;
  organization_id: string;
  lead_id: string;
  column_id: string;
  message_content: string;
  send_at: string;
  status: ScheduledMessageStatus;
  attempts: number;
  last_error?: string;
  ibeiazap_message_id?: string;
  sent_message_id?: string;
  created_at: string;
  updated_at: string;
}
