import {ToggleTheme} from "@/shared/components/toggleTheme/ToggleTheme.tsx"
import sidebarHeaderStyles from './sidebarHeader.module.sass'


export function SidebarHeader() {
  return (
    <div className={sidebarHeaderStyles.container}>
      <h1 className={sidebarHeaderStyles.logo}>Dashboard</h1>
      <ToggleTheme />
    </div>
  )
}