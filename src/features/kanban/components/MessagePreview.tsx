import { renderTemplate } from "@/features/kanban/utils/automation";
import { useCrmStore } from "@/stores/useCrmStore";
import type { Lead } from "@/types";

const EXAMPLE_LEAD: Lead = {
  id: "example",
  organization_id: "org_1",
  column_id: "example",
  name: "Maria Silva",
  phone: "+55 11 91234-5678",
  source: "manual",
  column_entered_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export function MessagePreview({ template }: { template: string }) {
  const organization = useCrmStore((s) => s.organization);

  if (!template.trim()) {
    return <p className="text-xs text-muted-foreground">A prévia da mensagem aparecerá aqui.</p>;
  }

  if (!organization) return null;

  const message = renderTemplate(template, { lead: EXAMPLE_LEAD, organization });

  return (
    <div className="rounded-md border bg-muted/40 p-3 text-sm">
      <p className="mb-1 text-xs font-medium text-muted-foreground">
        Prévia (exemplo: {EXAMPLE_LEAD.name})
      </p>
      <p className="whitespace-pre-wrap">{message}</p>
    </div>
  );
}
