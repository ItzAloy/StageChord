import type { ReactNode } from 'react'

type DashboardLayoutProps = {
  sidebar: ReactNode
  header: ReactNode
  footer: ReactNode
  children: ReactNode
  drawer?: ReactNode
  sidebarOpen?: boolean
}

export default function DashboardLayout({ sidebar, header, footer, children, drawer, sidebarOpen = false }: DashboardLayoutProps) {
  return (
    <main className={`dashboard-shell ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <aside className={sidebarOpen ? 'dashboard-sidebar dashboard-sidebar--open' : 'dashboard-sidebar'}>{sidebar}</aside>

      <section className="dashboard-stage">
        <div className="dashboard-header">{header}</div>
        <div className="dashboard-canvas">{children}</div>
        <div className="dashboard-footer">{footer}</div>
      </section>

      {drawer ? <div className="composer-overlay">{drawer}</div> : null}
    </main>
  )
}