import { create } from "zustand";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import { useAuthStore } from "@/stores/useAuthStore";
import { extractFunctionErrorMessage } from "@/lib/functionsError";
import type { User, UserRole } from "@/types";

export interface InviteUserInput {
  name: string;
  email: string;
  role: UserRole;
}

interface InviteUserResult {
  error: string | null;
  temporaryPassword?: string;
}

interface TeamState {
  users: User[];
  isLoading: boolean;
  loadTeam: () => Promise<void>;
  reset: () => void;
  inviteUser: (input: InviteUserInput) => Promise<InviteUserResult>;
  updateUserRole: (id: string, role: UserRole) => Promise<void>;
  removeUser: (id: string) => Promise<void>;
}

export const useTeamStore = create<TeamState>()((set, get) => ({
  users: [],
  isLoading: false,

  loadTeam: async () => {
    set({ isLoading: true });
    const { data } = await supabase.from("profiles").select("*").order("created_at");
    set({ users: (data as User[]) ?? [], isLoading: false });
  },

  reset: () => set({ users: [], isLoading: false }),

  inviteUser: async (input) => {
    const { data, error } = await supabase.functions.invoke<{
      id: string;
      email: string;
      temporary_password: string;
    }>("invite-user", { body: input });

    if (error || !data) {
      const message = await extractFunctionErrorMessage(
        error,
        "Não foi possível adicionar o usuário"
      );
      toast.error(message);
      return { error: message };
    }

    await get().loadTeam();
    toast(`${input.name} foi adicionado(a) à equipe`, {
      description: `Senha temporária: ${data.temporary_password}`,
    });
    return { error: null, temporaryPassword: data.temporary_password };
  },

  updateUserRole: async (id, role) => {
    // RLS silently matches 0 rows (no `error`) when the caller isn't allowed to
    // update this row, so success must be confirmed by a row actually coming back
    const { data, error } = await supabase
      .from("profiles")
      .update({ role })
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error || !data) {
      toast.error("Você não tem permissão para alterar o papel deste usuário");
      return;
    }
    set({ users: get().users.map((u) => (u.id === id ? { ...u, role } : u)) });
  },

  removeUser: async (id) => {
    const { users } = get();
    const currentUserId = useAuthStore.getState().currentUserId;

    if (id === currentUserId) {
      toast.error("Você não pode remover a si mesmo da equipe");
      return;
    }
    const target = users.find((u) => u.id === id);
    const ownerCount = users.filter((u) => u.role === "owner").length;
    if (target?.role === "owner" && ownerCount <= 1) {
      toast.error("Não é possível remover o único proprietário da conta");
      return;
    }

    // RLS silently matches 0 rows (no `error`) when the caller isn't owner/admin,
    // so success must be confirmed by a row actually coming back
    const { data, error } = await supabase.from("profiles").delete().eq("id", id).select().maybeSingle();
    if (error || !data) {
      toast.error("Você não tem permissão para remover este usuário");
      return;
    }
    set({ users: get().users.filter((u) => u.id !== id) });
    toast(`${target?.name ?? "Usuário"} removido da equipe`);
  },
}));
