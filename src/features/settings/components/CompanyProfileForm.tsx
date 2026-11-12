import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useCrmStore } from "@/stores/useCrmStore";

export function CompanyProfileForm() {
  const organization = useCrmStore((s) => s.organization);

  if (!organization) return null;

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Dados da empresa</CardTitle>
          <CardDescription>Informações da sua conta</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Nome da empresa</Label>
            <Input value={organization.name} disabled />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
