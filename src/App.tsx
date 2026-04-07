import "./styles/globals.css"

import { DashboardPage } from "@/components/dashboard/DashboardPage"

export default function App() {
  return (
    <main className="min-h-screen bg-background text-foreground" aria-label="Tableau de bord SEO">
      <DashboardPage />
    </main>
  )
}
