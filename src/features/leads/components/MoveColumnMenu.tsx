import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ArrowRightLeft } from "lucide-react";
import type { KanbanColumn } from "@/types";

interface MoveColumnMenuProps {
  columns: KanbanColumn[];
  currentColumnId: string;
  onMove: (columnId: string) => void;
}

export function MoveColumnMenu({ columns, currentColumnId, onMove }: MoveColumnMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
        <ArrowRightLeft className="size-4" />
        Mover de coluna
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {columns.map((column) => (
          <DropdownMenuItem
            key={column.id}
            disabled={column.id === currentColumnId}
            onClick={() => onMove(column.id)}
          >
            <span className="size-2 rounded-full" style={{ backgroundColor: column.color }} />
            {column.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
