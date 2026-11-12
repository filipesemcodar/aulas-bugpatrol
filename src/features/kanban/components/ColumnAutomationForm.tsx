import { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { COLUMN_COLOR_PALETTE } from "@/lib/constants";
import { canRenameColumn } from "@/features/kanban/utils/columnGuards";
import { VariableChipInserter } from "./VariableChipInserter";
import { MessagePreview } from "./MessagePreview";
import { cn } from "@/lib/utils";
import type { DelayUnit, KanbanColumn, NewColumnInput } from "@/types";

interface ColumnAutomationFormProps {
  column?: KanbanColumn;
  onSubmit: (input: NewColumnInput) => void;
  onCancel: () => void;
}

const DELAY_UNIT_OPTIONS: { value: DelayUnit; label: string }[] = [
  { value: "minutes", label: "Minutos" },
  { value: "hours", label: "Horas" },
  { value: "days", label: "Dias" },
];

export function ColumnAutomationForm({ column, onSubmit, onCancel }: ColumnAutomationFormProps) {
  const [name, setName] = useState(column?.name ?? "");
  const [color, setColor] = useState(column?.color ?? COLUMN_COLOR_PALETTE[1].value);
  const [enabled, setEnabled] = useState(column?.automation?.enabled ?? false);
  const [delayValue, setDelayValue] = useState(column?.automation?.delay_value ?? 30);
  const [delayUnit, setDelayUnit] = useState<DelayUnit>(column?.automation?.delay_unit ?? "minutes");
  const [messageTemplate, setMessageTemplate] = useState(
    column?.automation?.message_template ?? ""
  );
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const nameEditable = !column || canRenameColumn(column);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      color,
      automation: enabled
        ? {
            enabled: true,
            delay_value: delayValue,
            delay_unit: delayUnit,
            message_template: messageTemplate,
          }
        : column?.automation
          ? { ...column.automation, enabled: false }
          : null,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="column-name">Nome da coluna</Label>
        <Input
          id="column-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={!nameEditable}
          required
        />
        {!nameEditable && (
          <p className="text-xs text-muted-foreground">
            Esta é a coluna padrão de novos leads e não pode ser renomeada.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Cor</Label>
        <div className="flex flex-wrap gap-2">
          {COLUMN_COLOR_PALETTE.map((swatch) => (
            <button
              key={swatch.value}
              type="button"
              title={swatch.label}
              onClick={() => setColor(swatch.value)}
              className={cn(
                "size-6 rounded-full ring-offset-2 transition-shadow",
                color === swatch.value && "ring-2 ring-ring"
              )}
              style={{ backgroundColor: swatch.value }}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between rounded-md border p-3">
        <div>
          <p className="text-sm font-medium">Enviar mensagem automática</p>
          <p className="text-xs text-muted-foreground">
            Ao entrar nesta coluna, o lead recebe uma mensagem pelo WhatsApp.
          </p>
        </div>
        <Switch checked={enabled} onCheckedChange={setEnabled} />
      </div>

      {enabled && (
        <>
          <div className="flex flex-col gap-1.5">
            <Label>Enviar depois de</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                min={1}
                value={delayValue}
                onChange={(e) => setDelayValue(Number(e.target.value) || 1)}
                className="w-24"
              />
              <Select
                value={delayUnit}
                onValueChange={(v) => v && setDelayUnit(v as DelayUnit)}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue>
                    {(v: DelayUnit) => DELAY_UNIT_OPTIONS.find((o) => o.value === v)?.label ?? v}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {DELAY_UNIT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="message-template">Mensagem</Label>
            <VariableChipInserter
              textareaRef={textareaRef}
              value={messageTemplate}
              onChange={setMessageTemplate}
            />
            <Textarea
              id="message-template"
              ref={textareaRef}
              value={messageTemplate}
              onChange={(e) => setMessageTemplate(e.target.value)}
              rows={4}
              placeholder="Oi {{nome}}, tudo bem?"
            />
            <MessagePreview template={messageTemplate} />
          </div>
        </>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">{column ? "Salvar alterações" : "Criar coluna"}</Button>
      </div>
    </form>
  );
}
