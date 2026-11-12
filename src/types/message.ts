export type MessageDirection = "inbound" | "outbound";
export type MessageStatus = "sent" | "delivered" | "read" | "scheduled";

export interface Message {
  id: string;
  organization_id: string;
  lead_id: string;
  direction: MessageDirection;
  status: MessageStatus;
  content: string;
  is_automated: boolean;
  created_at: string;
}
