import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { LeadInfoPanel } from "@/features/leads/components/LeadInfoPanel";
import { LeadChatThread } from "@/features/leads/components/LeadChatThread";
import { useCrmStore } from "@/stores/useCrmStore";

export function LeadDetailPage() {
  const { leadId } = useParams<{ leadId: string }>();
  const navigate = useNavigate();
  const leads = useCrmStore((s) => s.leads);
  const columns = useCrmStore((s) => s.columns);
  const messages = useCrmStore((s) => s.messages);
  const moveLead = useCrmStore((s) => s.moveLead);
  const addMessage = useCrmStore((s) => s.addMessage);

  const lead = leads.find((l) => l.id === leadId);

  if (!lead) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3">
        <p className="text-muted-foreground">Lead não encontrado.</p>
        <Button variant="outline" onClick={() => navigate("/crm/leads")}>
          Voltar para a lista de leads
        </Button>
      </div>
    );
  }

  const currentColumn = columns.find((c) => c.id === lead.column_id);
  const leadMessages = messages
    .filter((m) => m.lead_id === lead.id)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title={lead.name}
        description={lead.phone}
        actions={
          <Button variant="ghost" size="sm" onClick={() => navigate("/crm/leads")}>
            <ArrowLeft className="size-4" />
            Voltar
          </Button>
        }
      />
      <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[1fr_320px]">
        <div className="min-h-0 border-r">
          <LeadChatThread messages={leadMessages} onSend={(content) => addMessage(lead.id, content)} />
        </div>
        <div className="min-h-0 overflow-y-auto">
          <LeadInfoPanel
            lead={lead}
            columns={columns}
            currentColumn={currentColumn}
            onMoveColumn={(columnId) => moveLead(lead.id, columnId)}
          />
        </div>
      </div>
    </div>
  );
}
