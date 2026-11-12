import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TimeAgo } from "@/components/common/TimeAgo";
import type { Lead, Message } from "@/types";

const CANAL: Record<string, { nome: string }> = {
  whatsapp: { nome: "WhatsApp" },
  manual: { nome: "Manual" },
};

interface RecentActivityListProps {
  messages: Message[];
  leads: Lead[];
}

export function RecentActivityList({ messages, leads }: RecentActivityListProps) {
  const leadById = new Map(leads.map((lead) => [lead.id, lead]));
  const recent = [...messages]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 8);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Atividade recente</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {recent.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhuma atividade ainda.</p>
        )}
        {recent.map((message) => {
          const lead = leadById.get(message.lead_id);
          if (!lead) return null;
          return (
            <Link
              key={message.id}
              to={`/crm/leads/${lead.id}`}
              className="flex items-start justify-between gap-3 rounded-md p-2 text-sm hover:bg-accent"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{lead.name}</p>
                <p className="truncate text-muted-foreground">{message.content}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span className="text-xs text-muted-foreground">
                  <TimeAgo date={message.created_at} />
                </span>
                <span className="text-[10px] text-muted-foreground">{CANAL[message.channel!].nome}</span>
                {message.is_automated && (
                  <Badge variant="secondary" className="text-[10px]">
                    Automática
                  </Badge>
                )}
              </div>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
