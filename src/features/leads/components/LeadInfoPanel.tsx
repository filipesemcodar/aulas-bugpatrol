import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { TimeAgo } from "@/components/common/TimeAgo";
import { MoveColumnMenu } from "./MoveColumnMenu";
import { getInitials } from "@/lib/formatters";
import type { KanbanColumn, Lead } from "@/types";

interface LeadInfoPanelProps {
  lead: Lead;
  columns: KanbanColumn[];
  currentColumn: KanbanColumn | undefined;
  onMoveColumn: (columnId: string) => void;
}

export function LeadInfoPanel({ lead, columns, currentColumn, onMoveColumn }: LeadInfoPanelProps) {
  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-3">
        <Avatar className="size-12">
          <AvatarFallback>{getInitials(lead.name)}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold">{lead.name}</p>
          <p className="text-sm text-muted-foreground">{lead.phone}</p>
        </div>
      </div>

      <Separator />

      <div className="flex flex-col gap-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Coluna atual</span>
          {currentColumn && (
            <Badge style={{ backgroundColor: currentColumn.color, color: "white" }}>
              {currentColumn.name}
            </Badge>
          )}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Nesta coluna há</span>
          <TimeAgo date={lead.column_entered_at} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Origem</span>
          <span>{lead.source === "whatsapp" ? "WhatsApp" : "Manual"}</span>
        </div>
      </div>

      <Separator />

      <MoveColumnMenu columns={columns} currentColumnId={lead.column_id} onMove={onMoveColumn} />
    </div>
  );
}
