import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, LogOut, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { SidebarNav, SidebarLogo } from "./Sidebar";
import { useCrmStore } from "@/stores/useCrmStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useTeamStore } from "@/stores/useTeamStore";
import { getInitials } from "@/lib/formatters";
import { cn } from "@/lib/utils";

export function Topbar() {
  const navigate = useNavigate();
  const organization = useCrmStore((s) => s.organization);
  const logout = useAuthStore((s) => s.logout);
  const currentUserId = useAuthStore((s) => s.currentUserId);
  const currentUser = useTeamStore((s) => s.users.find((u) => u.id === currentUserId));
  const [mobileOpen, setMobileOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  if (!organization) return null;

  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-4">
      <div className="flex items-center gap-2">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="size-5" />
          </Button>
          <SheetContent side="left" className="w-60 p-0">
            <SheetTitle className="sr-only">Menu de navegação</SheetTitle>
            <SidebarLogo />
            <SidebarNav onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>
        <span className="font-medium">{organization.name}</span>
        <Badge
          variant="secondary"
          className={cn(
            "gap-1",
            organization.whatsapp_connected
              ? "bg-success-tint text-success"
              : "text-muted-foreground"
          )}
        >
          <CheckCircle2 className="size-3" />
          {organization.whatsapp_connected ? "WhatsApp conectado" : "WhatsApp desconectado"}
        </Badge>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" className="gap-2 px-2" />}>
          <Avatar className="size-7">
            <AvatarFallback>{getInitials(currentUser?.name ?? "?")}</AvatarFallback>
          </Avatar>
          <span className="hidden text-sm sm:inline">{currentUser?.name}</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            <DropdownMenuLabel>{currentUser?.email}</DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="size-4" />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
