import { Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getInitials } from "@/lib/formatters";
import { useAuthStore } from "@/stores/useAuthStore";
import { useTeamStore } from "@/stores/useTeamStore";
import type { UserRole } from "@/types";

const ROLE_LABELS: Record<UserRole, string> = {
  owner: "Proprietário",
  admin: "Administrador",
  member: "Membro",
};

export function TeamMembersTable() {
  const users = useTeamStore((s) => s.users);
  const updateUserRole = useTeamStore((s) => s.updateUserRole);
  const removeUser = useTeamStore((s) => s.removeUser);
  const currentUserId = useAuthStore((s) => s.currentUserId);
  const currentUserRole = users.find((u) => u.id === currentUserId)?.role;
  // Somente um owner pode conceder o papel de owner (o backend também aplica isso via RLS/edge function).
  const assignableRoles = (Object.keys(ROLE_LABELS) as UserRole[]).filter(
    (r) => r !== "owner" || currentUserRole === "owner"
  );

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader className="bg-muted/40">
          <TableRow>
            <TableHead>Usuário</TableHead>
            <TableHead>E-mail</TableHead>
            <TableHead>Papel</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Avatar className="size-7">
                    <AvatarFallback className="text-xs">{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                  {user.name}
                  {user.id === currentUserId && (
                    <span className="text-xs text-muted-foreground">(você)</span>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">{user.email}</TableCell>
              <TableCell>
                <Select
                  value={user.role}
                  onValueChange={(v) => v && updateUserRole(user.id, v as UserRole)}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue>{(v: UserRole) => ROLE_LABELS[v]}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {/* Papel atual sempre aparece, mesmo que não seja mais atribuível por quem visualiza */}
                    {(user.role === "owner" && currentUserRole !== "owner"
                      ? [...assignableRoles, "owner" as UserRole]
                      : assignableRoles
                    ).map((r) => (
                      <SelectItem key={r} value={r} disabled={r === "owner" && currentUserRole !== "owner"}>
                        {ROLE_LABELS[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <Button variant="ghost" size="icon" onClick={() => removeUser(user.id)}>
                  <Trash2 className="size-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
