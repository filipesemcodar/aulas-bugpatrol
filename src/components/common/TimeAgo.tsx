import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export function TimeAgo({ date }: { date: string }) {
  return (
    <span title={new Date(date).toLocaleString("pt-BR")}>
      {formatDistanceToNow(new Date(date), { addSuffix: true, locale: ptBR })}
    </span>
  );
}
