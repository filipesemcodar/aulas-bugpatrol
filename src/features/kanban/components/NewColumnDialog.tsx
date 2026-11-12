import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ColumnAutomationForm } from "./ColumnAutomationForm";
import type { KanbanColumn, NewColumnInput } from "@/types";

interface NewColumnDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  column?: KanbanColumn;
  onSubmit: (input: NewColumnInput) => void;
}

export function NewColumnDialog({ open, onOpenChange, column, onSubmit }: NewColumnDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{column ? "Editar coluna" : "Nova coluna"}</DialogTitle>
          <DialogDescription>
            Configure o nome, a cor e, se quiser, uma mensagem automática enviada quando um lead
            entrar nesta coluna.
          </DialogDescription>
        </DialogHeader>
        <ColumnAutomationForm
          column={column}
          onSubmit={(input) => {
            onSubmit(input);
            onOpenChange(false);
          }}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
