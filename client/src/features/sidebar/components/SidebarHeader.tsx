import {ToggleTheme} from "@/shared/components/toggleTheme/ToggleTheme.tsx";

export function SidebarHeader() {
  return (
    <div className="sidebar__header">
      <h1 className="sidebar__logo">Dashboard</h1>
      <ToggleTheme />
    </div>
  )
}