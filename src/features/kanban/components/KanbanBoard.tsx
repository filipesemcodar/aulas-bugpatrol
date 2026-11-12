import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { KanbanColumn } from "./KanbanColumn";
import { NewColumnDialog } from "./NewColumnDialog";
import { LeadCardContent } from "./LeadCard";
import { useCrmStore } from "@/stores/useCrmStore";
import { canCreateColumn } from "@/features/kanban/utils/columnGuards";
import type { KanbanColumn as KanbanColumnType, NewColumnInput } from "@/types";

export function KanbanBoard() {
  const columns = useCrmStore((s) => s.columns);
  const leads = useCrmStore((s) => s.leads);
  const organization = useCrmStore((s) => s.organization);
  const moveLead = useCrmStore((s) => s.moveLead);
  const reorderColumns = useCrmStore((s) => s.reorderColumns);
  const createColumn = useCrmStore((s) => s.createColumn);
  const updateColumn = useCrmStore((s) => s.updateColumn);
  const deleteColumn = useCrmStore((s) => s.deleteColumn);

  const [activeLeadId, setActiveLeadId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingColumn, setEditingColumn] = useState<KanbanColumnType | undefined>();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const sortedColumns = [...columns].sort((a, b) => a.position - b.position);
  const activeLead = activeLeadId ? leads.find((l) => l.id === activeLeadId) : undefined;
  const canAddColumn = organization ? canCreateColumn(columns, organization) : true;

  function handleDragStart(event: DragStartEvent) {
    if (event.active.data.current?.type === "lead") {
      setActiveLeadId(String(event.active.id));
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveLeadId(null);
    const { active, over } = event;
    if (!over) return;
    if (active.data.current?.type !== "lead") return;
    const targetColumnId = over.data.current?.columnId as string | undefined;
    if (!targetColumnId) return;
    moveLead(String(active.id), targetColumnId);
  }

  function handleMove(columnId: string, direction: -1 | 1) {
    const orderedIds = sortedColumns.map((c) => c.id);
    const index = orderedIds.indexOf(columnId);
    const swapIndex = index + direction;
    if (swapIndex < 0 || swapIndex >= orderedIds.length) return;
    [orderedIds[index], orderedIds[swapIndex]] = [orderedIds[swapIndex], orderedIds[index]];
    reorderColumns(orderedIds);
  }

  function handleColumnSubmit(input: NewColumnInput) {
    if (editingColumn) {
      updateColumn(editingColumn.id, input);
    } else {
      createColumn(input);
    }
    setEditingColumn(undefined);
  }

  return (
    <div className="flex h-full flex-col gap-4 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Arraste os leads entre as colunas para avançar no atendimento.
        </p>
        <Tooltip>
          <TooltipTrigger render={<span className="inline-flex" />}>
            <Button
              size="sm"
              disabled={!canAddColumn}
              onClick={() => {
                setEditingColumn(undefined);
                setDialogOpen(true);
              }}
            >
              <Plus className="size-4" />
              Nova coluna
            </Button>
          </TooltipTrigger>
          {!canAddColumn && (
            <TooltipContent>
              Limite do plano gratuito atingido — faça upgrade em Configurações para criar mais
              colunas.
            </TooltipContent>
          )}
        </Tooltip>
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveLeadId(null)}
      >
        <div className="flex flex-1 gap-4 overflow-x-auto pb-2">
          {sortedColumns.map((column, index) => (
            <KanbanColumn
              key={column.id}
              column={column}
              leads={leads.filter((l) => l.column_id === column.id)}
              canMoveLeft={index > 0}
              canMoveRight={index < sortedColumns.length - 1}
              onEdit={() => {
                setEditingColumn(column);
                setDialogOpen(true);
              }}
              onDelete={() => deleteColumn(column.id)}
              onMoveLeft={() => handleMove(column.id, -1)}
              onMoveRight={() => handleMove(column.id, 1)}
            />
          ))}
        </div>

        <DragOverlay>
          {activeLead ? <LeadCardContent lead={activeLead} className="w-72 shadow-lg" /> : null}
        </DragOverlay>
      </DndContext>

      <NewColumnDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        column={editingColumn}
        onSubmit={handleColumnSubmit}
      />
    </div>
  );
}
