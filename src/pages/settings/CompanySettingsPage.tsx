import { PageHeader } from "@/components/layout/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CompanyProfileForm } from "@/features/settings/components/CompanyProfileForm";
import { TeamMembersTable } from "@/features/settings/components/TeamMembersTable";
import { InviteUserDialog } from "@/features/settings/components/InviteUserDialog";
import { WhatsappConnectPanel } from "@/features/settings/components/WhatsappConnectPanel";
import { PlanPanel } from "@/features/settings/components/PlanPanel";

export function CompanySettingsPage() {
  return (
    <div className="flex h-full flex-col">
      <PageHeader title="Configurações" description="Gerencie os dados da empresa e sua equipe" />
      <div className="p-4 sm:p-6">
        <Tabs defaultValue="empresa">
          <TabsList>
            <TabsTrigger value="empresa">Empresa</TabsTrigger>
            <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
            <TabsTrigger value="equipe">Equipe</TabsTrigger>
            <TabsTrigger value="plano">Plano</TabsTrigger>
          </TabsList>
          <TabsContent value="empresa" className="mt-4">
            <CompanyProfileForm />
          </TabsContent>
          <TabsContent value="whatsapp" className="mt-4">
            <WhatsappConnectPanel />
          </TabsContent>
          <TabsContent value="equipe" className="mt-4 flex flex-col gap-4">
            <div className="flex justify-end">
              <InviteUserDialog />
            </div>
            <TeamMembersTable />
          </TabsContent>
          <TabsContent value="plano" className="mt-4">
            <PlanPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
