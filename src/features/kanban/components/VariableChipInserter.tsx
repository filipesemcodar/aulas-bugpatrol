import { Button } from "@/components/ui/button";
import { LEAD_TEMPLATE_VARIABLES } from "@/lib/constants";
import type { RefObject } from "react";

interface VariableChipInserterProps {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  value: string;
  onChange: (value: string) => void;
}

export function VariableChipInserter({ textareaRef, value, onChange }: VariableChipInserterProps) {
  function insertVariable(key: string) {
    const textarea = textareaRef.current;
    const token = `{{${key}}}`;
    if (!textarea) {
      onChange(value + token);
      return;
    }
    const start = textarea.selectionStart ?? value.length;
    const end = textarea.selectionEnd ?? value.length;
    const nextValue = value.slice(0, start) + token + value.slice(end);
    onChange(nextValue);
    requestAnimationFrame(() => {
      textarea.focus();
      const cursor = start + token.length;
      textarea.setSelectionRange(cursor, cursor);
    });
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {LEAD_TEMPLATE_VARIABLES.map((variable) => (
        <Button
          key={variable.key}
          type="button"
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          onClick={() => insertVariable(variable.key)}
        >
          + {variable.label}
        </Button>
      ))}
    </div>
  );
}
