import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { KanbanColumn, Lead, NewLeadInput } from "@/types";

interface LeadFormProps {
  lead?: Lead;
  columns: KanbanColumn[];
  onSubmit: (input: NewLeadInput) => void;
  onCancel: () => void;
}

export function LeadForm({ lead, columns, onSubmit, onCancel }: LeadFormProps) {
  const [name, setName] = useState(lead?.name ?? "");
  const [phone, setPhone] = useState(lead?.phone ?? "");
  const defaultColumnId = columns.find((c) => c.is_default)?.id ?? columns[0]?.id ?? "";
  const [columnId, setColumnId] = useState(lead?.column_id ?? defaultColumnId);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    onSubmit({ name: name.trim(), phone: phone.trim(), column_id: columnId });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="lead-name">Nome</Label>
        <Input
          id="lead-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="lead-phone">Telefone</Label>
        <Input
          id="lead-phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
      </div>

      {!lead && (
        <div className="flex flex-col gap-1.5">
          <Label>Coluna</Label>
          <Select value={columnId} onValueChange={(v) => v && setColumnId(v)}>
            <SelectTrigger>
              <SelectValue>
                {(v: string) => columns.find((c) => c.id === v)?.name ?? v}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {columns.map((column) => (
                <SelectItem key={column.id} value={column.id}>
                  {column.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">{lead ? "Salvar alterações" : "Criar lead"}</Button>
      </div>
    </form>
  );
}
