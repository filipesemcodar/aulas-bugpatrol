import { useDroppable } from "@dnd-kit/core";
import { Clock, MoreVertical, ChevronLeft, ChevronRight, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { LeadCard } from "./LeadCard";
import { canDeleteColumn } from "@/features/kanban/utils/columnGuards";
import { describeDelay } from "@/features/kanban/utils/automation";
import { cn } from "@/lib/utils";
import type { KanbanColumn as KanbanColumnType, Lead } from "@/types";

interface KanbanColumnProps {
  column: KanbanColumnType;
  leads: Lead[];
  canMoveLeft: boolean;
  canMoveRight: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onMoveLeft: () => void;
  onMoveRight: () => void;
}

export function KanbanColumn({
  column,
  leads,
  canMoveLeft,
  canMoveRight,
  onEdit,
  onDelete,
  onMoveLeft,
  onMoveRight,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { type: "column", columnId: column.id },
  });

  return (
    <div className="flex h-full w-72 shrink-0 flex-col rounded-xl border border-border/60 bg-muted/30">
      <div className="flex items-center justify-between gap-2 border-b p-3">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className="size-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: column.color }}
          />
          <span className="truncate text-sm font-semibold">{column.name}</span>
          <Badge variant="secondary" className="shrink-0 px-1.5">
            {leads.length}
          </Badge>
          {column.automation?.enabled && (
            <Tooltip>
              <TooltipTrigger render={<span className="inline-flex shrink-0" />}>
                <Clock className="size-3.5 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                Envia mensagem {describeDelay(column.automation.delay_value, column.automation.delay_unit)}{" "}
                depois de o lead entrar aqui
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="size-7 shrink-0" />}>
            <MoreVertical className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="size-4" />
              Editar coluna
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onMoveLeft} disabled={!canMoveLeft}>
              <ChevronLeft className="size-4" />
              Mover para a esquerda
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onMoveRight} disabled={!canMoveRight}>
              <ChevronRight className="size-4" />
              Mover para a direita
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <Tooltip>
              <TooltipTrigger render={<span className="block" />}>
                <DropdownMenuItem
                  onClick={onDelete}
                  disabled={!canDeleteColumn(column)}
                  variant="destructive"
                >
                  <Trash2 className="size-4" />
                  Excluir coluna
                </DropdownMenuItem>
              </TooltipTrigger>
              {!canDeleteColumn(column) && (
                <TooltipContent>Esta é a coluna padrão e não pode ser excluída</TooltipContent>
              )}
            </Tooltip>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex flex-1 flex-col gap-2 overflow-y-auto p-2 transition-colors",
          isOver && "bg-accent/60"
        )}
      >
        {leads.map((lead) => (
          <LeadCard key={lead.id} lead={lead} columnId={column.id} />
        ))}
        {leads.length === 0 && (
          <p className="p-4 text-center text-xs text-muted-foreground">Nenhum lead nesta coluna</p>
        )}
      </div>
    </div>
  );
}
