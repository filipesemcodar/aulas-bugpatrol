export type DelayUnit = "minutes" | "hours" | "days";

export interface ColumnAutomation {
  enabled: boolean;
  delay_value: number;
  delay_unit: DelayUnit;
  message_template: string;
}

export interface KanbanColumn {
  id: string;
  organization_id: string;
  name: string;
  color: string;
  position: number;
  is_default: boolean;
  is_protected: boolean;
  automation: ColumnAutomation | null;
  created_at: string;
  updated_at: string;
}

export interface NewColumnInput {
  name: string;
  color: string;
  automation: ColumnAutomation | null;
}
