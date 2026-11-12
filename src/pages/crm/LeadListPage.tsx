import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TimeAgo } from "@/components/common/TimeAgo";
import { LeadFormDialog } from "@/features/leads/components/LeadFormDialog";
import { getInitials } from "@/lib/formatters";
import { useCrmStore } from "@/stores/useCrmStore";
import type { Lead } from "@/types";

export function LeadListPage() {
  const navigate = useNavigate();
  const leads = useCrmStore((s) => s.leads);
  const columns = useCrmStore((s) => s.columns);
  const createLead = useCrmStore((s) => s.createLead);
  const updateLead = useCrmStore((s) => s.updateLead);
  const deleteLead = useCrmStore((s) => s.deleteLead);
  const [search, setSearch] = useState("");
  const [columnFilter, setColumnFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | undefined>();
  const [deletingLead, setDeletingLead] = useState<Lead | undefined>();

  const columnById = useMemo(() => new Map(columns.map((c) => [c.id, c])), [columns]);

  const filteredLeads = leads
    .filter((lead) => columnFilter === "all" || lead.column_id === columnFilter)
    .filter(
      (lead) =>
        lead.name.toLowerCase().includes(search.toLowerCase()) ||
        lead.phone.includes(search)
    )
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Leads"
        description={`${leads.length} leads no total`}
        actions={
          <Button
            size="sm"
            onClick={() => {
              setEditingLead(undefined);
              setDialogOpen(true);
            }}
          >
            <Plus className="size-4" />
            Novo lead
          </Button>
        }
      />
      <div className="flex flex-col gap-4 p-4 sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            placeholder="Buscar por nome ou telefone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sm:max-w-xs"
          />
          <Select value={columnFilter} onValueChange={(v) => setColumnFilter(v ?? "all")}>
            <SelectTrigger className="sm:w-56">
              <SelectValue placeholder="Todas as colunas">
                {(v: string) => (v === "all" ? "Todas as colunas" : columnById.get(v)?.name ?? v)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as colunas</SelectItem>
              {columns.map((column) => (
                <SelectItem key={column.id} value={column.id}>
                  {column.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead>Lead</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Coluna</TableHead>
                <TableHead>Última atualização</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.map((lead) => {
                const column = columnById.get(lead.column_id);
                return (
                  <TableRow
                    key={lead.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/crm/leads/${lead.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="size-7">
                          <AvatarFallback className="text-xs">
                            {getInitials(lead.name)}
                          </AvatarFallback>
                        </Avatar>
                        {lead.name}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {lead.phone}
                    </TableCell>
                    <TableCell>
                      {column && (
                        <Badge style={{ backgroundColor: column.color, color: "white" }}>
                          {column.name}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <TimeAgo date={lead.updated_at} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Editar lead ${lead.name}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingLead(lead);
                            setDialogOpen(true);
                          }}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Excluir lead ${lead.name}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingLead(lead);
                          }}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredLeads.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    Nenhum lead encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <LeadFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        lead={editingLead}
        onSubmit={(input) => {
          if (editingLead) {
            updateLead(editingLead.id, input);
          } else {
            createLead(input);
          }
          setEditingLead(undefined);
        }}
      />

      <Dialog
        open={!!deletingLead}
        onOpenChange={(open) => !open && setDeletingLead(undefined)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir lead</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir <strong>{deletingLead?.name}</strong>? Essa
              ação também apaga o histórico de mensagens do lead e não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingLead(undefined)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deletingLead) deleteLead(deletingLead.id);
                setDeletingLead(undefined);
              }}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
