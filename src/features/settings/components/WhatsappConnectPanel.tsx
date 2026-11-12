import { useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useCrmStore } from "@/stores/useCrmStore";
import { useWhatsappStore } from "@/stores/useWhatsappStore";
import { cn } from "@/lib/utils";

export function WhatsappConnectPanel() {
  const organization = useCrmStore((s) => s.organization);
  const instance = useWhatsappStore((s) => s.instance);
  const qr = useWhatsappStore((s) => s.qr);
  const isConnecting = useWhatsappStore((s) => s.isConnecting);
  const isLoading = useWhatsappStore((s) => s.isLoading);
  const loadStatus = useWhatsappStore((s) => s.loadStatus);
  const createInstance = useWhatsappStore((s) => s.createInstance);
  const startConnect = useWhatsappStore((s) => s.startConnect);
  const disconnect = useWhatsappStore((s) => s.disconnect);
  const deleteInstance = useWhatsappStore((s) => s.deleteInstance);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const isConnected = !!organization?.whatsapp_connected;

  async function handleConnectClick() {
    if (!instance) {
      const { error } = await createInstance();
      if (error) return;
    }
    await startConnect();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conexão com o WhatsApp</CardTitle>
        <CardDescription>
          Conecte o número da sua empresa para enviar e receber mensagens pelo CRM.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Badge
            variant="secondary"
            className={cn(isConnected ? "bg-success-tint text-success" : "text-muted-foreground")}
          >
            {isConnected ? "Conectado" : "Desconectado"}
          </Badge>
          {organization?.whatsapp_phone_number && (
            <span className="text-sm text-muted-foreground">{organization.whatsapp_phone_number}</span>
          )}
        </div>

        {!isConnected && qr && (
          <div className="flex flex-col items-center gap-2 rounded-lg border p-4">
            <img src={qr} alt="QR Code do WhatsApp" className="size-48" />
            <p className="text-sm text-muted-foreground">
              Abra o WhatsApp no seu celular, vá em Aparelhos conectados e escaneie o QR code acima.
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {!isConnected && (
            <Button onClick={handleConnectClick} disabled={isConnecting || isLoading}>
              {isConnecting ? "Aguardando conexão..." : qr ? "Gerar novo QR Code" : "Conectar WhatsApp"}
            </Button>
          )}
          {isConnected && (
            <Button variant="outline" onClick={disconnect}>
              Desconectar
            </Button>
          )}
          {instance && (
            <Button variant="destructive" onClick={deleteInstance}>
              Remover conexão e liberar vaga
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
