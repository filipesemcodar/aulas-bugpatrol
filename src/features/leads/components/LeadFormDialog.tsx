import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { LeadForm } from "./LeadForm";
import { useCrmStore } from "@/stores/useCrmStore";
import type { Lead, NewLeadInput } from "@/types";

interface LeadFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead?: Lead;
  onSubmit: (input: NewLeadInput) => void;
}

export function LeadFormDialog({ open, onOpenChange, lead, onSubmit }: LeadFormDialogProps) {
  const columns = useCrmStore((s) => s.columns);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{lead ? "Editar lead" : "Novo lead"}</DialogTitle>
          <DialogDescription>
            {lead
              ? "Atualize o nome e o telefone deste lead."
              : "Preencha os dados para criar um novo lead."}
          </DialogDescription>
        </DialogHeader>
        <LeadForm
          lead={lead}
          columns={columns}
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
