import { useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { useNavigate } from "react-router-dom";
import { Pencil } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { TimeAgo } from "@/components/common/TimeAgo";
import { LeadFormDialog } from "@/features/leads/components/LeadFormDialog";
import { useCrmStore } from "@/stores/useCrmStore";
import { getInitials } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { Lead } from "@/types";

interface LeadCardProps {
  lead: Lead;
  columnId: string;
}

export function LeadCardContent({ lead, className }: { lead: Lead; className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-lg border bg-card p-3 text-left shadow-sm",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <Avatar className="size-8">
          <AvatarFallback className="text-xs">{getInitials(lead.name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{lead.name}</p>
          <p className="truncate text-xs text-muted-foreground">{lead.phone}</p>
        </div>
      </div>
      <Badge variant="outline" className="w-fit text-[11px] font-normal text-muted-foreground">
        <TimeAgo date={lead.column_entered_at} />
      </Badge>
    </div>
  );
}

export function LeadCard({ lead, columnId }: LeadCardProps) {
  const navigate = useNavigate();
  const updateLead = useCrmStore((s) => s.updateLead);
  const [editOpen, setEditOpen] = useState(false);
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
    data: { type: "lead", columnId },
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...listeners}
        {...attributes}
        onClick={() => navigate(`/crm/leads/${lead.id}`)}
        role="button"
        aria-label={`Lead ${lead.name}`}
        className="group relative cursor-grab active:cursor-grabbing"
      >
        <button
          type="button"
          aria-label={`Editar lead ${lead.name}`}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            setEditOpen(true);
          }}
          className="absolute top-2 right-2 z-10 rounded-md bg-background/80 p-1 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
        >
          <Pencil className="size-3.5" />
        </button>
        <LeadCardContent
          lead={lead}
          className={cn(
            "transition-shadow hover:shadow-md",
            isDragging && "opacity-30"
          )}
        />
      </div>
      <LeadFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        lead={lead}
        onSubmit={(input) => updateLead(lead.id, input)}
      />
    </>
  );
}
