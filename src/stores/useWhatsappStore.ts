import { create } from "zustand";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import { extractFunctionErrorMessage } from "@/lib/functionsError";
import { useCrmStore } from "@/stores/useCrmStore";
import type { Organization, WhatsappInstance } from "@/types";

const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 2 * 60 * 1000;

interface WhatsappActionResult {
  error: string | null;
}

interface WhatsappState {
  instance: WhatsappInstance | null;
  qr: string | null;
  isConnecting: boolean;
  isLoading: boolean;
  error: string | null;

  loadStatus: () => Promise<void>;
  createInstance: () => Promise<WhatsappActionResult>;
  startConnect: () => Promise<WhatsappActionResult>;
  stopPolling: () => void;
  disconnect: () => Promise<void>;
  deleteInstance: () => Promise<void>;
  reset: () => void;
}

let pollTimer: ReturnType<typeof setInterval> | null = null;
let pollTimeoutTimer: ReturnType<typeof setTimeout> | null = null;

function clearPolling() {
  if (pollTimer) clearInterval(pollTimer);
  if (pollTimeoutTimer) clearTimeout(pollTimeoutTimer);
  pollTimer = null;
  pollTimeoutTimer = null;
}

export const useWhatsappStore = create<WhatsappState>()((set, get) => ({
  instance: null,
  qr: null,
  isConnecting: false,
  isLoading: false,
  error: null,

  loadStatus: async () => {
    set({ isLoading: true, error: null });
    const { data, error } = await supabase.functions.invoke<{
      instance: WhatsappInstance | null;
      organization: Organization;
    }>("whatsapp", { body: { action: "status" } });

    if (error || !data) {
      set({ isLoading: false });
      return;
    }

    set({ instance: data.instance, isLoading: false });
    useCrmStore.setState({ organization: data.organization });
  },

  createInstance: async () => {
    const { data, error } = await supabase.functions.invoke<{ instanceId: string }>("whatsapp", {
      body: { action: "create_instance" },
    });

    if (error || !data) {
      const message = await extractFunctionErrorMessage(error, "Não foi possível criar a conexão");
      toast.error(message);
      return { error: message };
    }

    await get().loadStatus();
    return { error: null };
  },

  startConnect: async () => {
    clearPolling();
    set({ isConnecting: true, error: null });

    const { data, error } = await supabase.functions.invoke<{ qr: string | null }>("whatsapp", {
      body: { action: "connect" },
    });

    if (error || !data) {
      const message = await extractFunctionErrorMessage(error, "Não foi possível gerar o QR Code");
      set({ isConnecting: false, error: message });
      toast.error(message);
      return { error: message };
    }

    set({ qr: data.qr });

    pollTimer = setInterval(async () => {
      await get().loadStatus();
      if (get().instance?.logged_in) {
        clearPolling();
        set({ isConnecting: false, qr: null });
        toast("WhatsApp conectado com sucesso");
      }
    }, POLL_INTERVAL_MS);

    pollTimeoutTimer = setTimeout(() => {
      clearPolling();
      set({ isConnecting: false });
    }, POLL_TIMEOUT_MS);

    return { error: null };
  },

  stopPolling: () => {
    clearPolling();
    set({ isConnecting: false });
  },

  disconnect: async () => {
    const { error } = await supabase.functions.invoke("whatsapp", { body: { action: "disconnect" } });
    if (error) {
      toast.error(await extractFunctionErrorMessage(error, "Não foi possível desconectar"));
      return;
    }
    await get().loadStatus();
    toast("WhatsApp desconectado");
  },

  deleteInstance: async () => {
    const { error } = await supabase.functions.invoke("whatsapp", { body: { action: "delete" } });
    if (error) {
      toast.error(await extractFunctionErrorMessage(error, "Não foi possível remover a conexão"));
      return;
    }
    clearPolling();
    set({ instance: null, qr: null, isConnecting: false });
    useCrmStore.setState((state) => ({
      organization: state.organization
        ? { ...state.organization, whatsapp_connected: false, whatsapp_phone_number: undefined }
        : state.organization,
    }));
    toast("Conexão removida");
  },

  reset: () => {
    clearPolling();
    set({ instance: null, qr: null, isConnecting: false, isLoading: false, error: null });
  },
}));
