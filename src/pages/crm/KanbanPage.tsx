import { PageHeader } from "@/components/layout/PageHeader";
import { KanbanBoard } from "@/features/kanban/components/KanbanBoard";

export function KanbanPage() {
  return (
    <div className="flex h-full flex-col">
      <PageHeader title="Kanban" description="Organize seus leads em colunas customizáveis" />
      <div className="min-h-0 flex-1">
        <KanbanBoard />
      </div>
    </div>
  );
}
