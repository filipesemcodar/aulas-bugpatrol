export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Nome curto para o card do Kanban: primeiro nome + inicial do sobrenome ("Maria Silva" → "Maria S."). */
export function nomeCurto(nome: string): string {
  const [primeiro, ...resto] = nome.trim().split(/\s+/);
  const sobrenome = resto[resto.length - 1];
  return `${primeiro} ${sobrenome[0].toUpperCase()}.`;
}
