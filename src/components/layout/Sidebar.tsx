import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { LayoutDashboard, KanbanSquare, Users, Settings } from "lucide-react";

const NAV_ITEMS = [
  { to: "/crm/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/crm/kanban", label: "Kanban", icon: KanbanSquare },
  { to: "/crm/leads", label: "Leads", icon: Users },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
];

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1 p-3">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )
          }
        >
          <item.icon className="size-4" />
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}

export function SidebarLogo() {
  return (
    <div className="flex h-14 items-center gap-2 border-b px-4">
      <img src="/favicon.svg" alt="" className="size-6" />
      <span className="text-base leading-none">
        <span className="font-semibold text-foreground">IBEIA</span>{" "}
        <span className="font-medium text-muted-foreground">CRM</span>
      </span>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden w-60 shrink-0 border-r bg-sidebar md:flex md:flex-col">
      <SidebarLogo />
      <SidebarNav />
    </aside>
  );
}
