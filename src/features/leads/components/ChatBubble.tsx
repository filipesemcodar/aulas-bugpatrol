import { Check, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Message } from "@/types";

export function ChatBubble({ message }: { message: Message }) {
  const isOutbound = message.direction === "outbound";
  const time = new Date(message.created_at).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className={cn("flex", isOutbound ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[75%] rounded-lg px-3 py-2 text-sm shadow-sm",
          isOutbound ? "bg-success text-success-foreground" : "bg-muted"
        )}
      >
        {message.is_automated && (
          <p className="mb-1 text-[11px] font-medium opacity-80">Mensagem automática</p>
        )}
        <p className="whitespace-pre-wrap">{message.content}</p>
        <div
          className={cn(
            "mt-1 flex items-center justify-end gap-1 text-[10px]",
            isOutbound ? "text-success-foreground/80" : "text-muted-foreground"
          )}
        >
          <span className="font-mono">{time}</span>
          {isOutbound &&
            (message.status === "read" ? (
              <CheckCheck className="size-3" />
            ) : (
              <Check className="size-3" />
            ))}
        </div>
      </div>
    </div>
  );
}
