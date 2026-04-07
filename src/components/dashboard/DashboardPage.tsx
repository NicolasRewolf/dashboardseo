import { LayoutGroup, motion } from 'framer-motion'

import { useGscDashboardData } from '@/hooks/use-gsc-dashboard-data'
import { GscAuthProvider, useGscAuth } from '@/contexts/gsc-auth-context'
import { DashboardFiltersProvider } from '@/contexts/dashboard-filters'

import { ExecutiveSummary } from './ExecutiveSummary'
import { FilterBar } from './FilterBar'
import { GscConnectionBar } from './GscConnectionBar'
import { StrategicModuleGrid } from './StrategicModuleGrid'

function DashboardBody() {
  const { isAuthenticated, siteUrl } = useGscAuth()
  const { loading, error, snapshot, northStar, rowCount } = useGscDashboardData(
    isAuthenticated ? siteUrl : null
  )

  const connected = isAuthenticated
  const hasSite = Boolean(siteUrl)

  return (
    <LayoutGroup id="dashboard-main">
      <motion.div layout className="mx-auto max-w-[1400px] space-y-6 px-4 py-8 sm:px-6">
        <header className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
            <div className="min-w-0 space-y-1">
              <motion.p
                layout
                className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground"
              >
                JP Louton · Search Console 2.0
              </motion.p>
              <motion.h1
                layout
                className="text-2xl font-medium tracking-tight text-foreground sm:text-3xl"
              >
                Pilotage organique
              </motion.h1>
              <p className="max-w-2xl text-sm text-muted-foreground">
                Intelligence décisionnelle : au-delà des clics, vers l’intention, les piliers métiers
                et la détection de déclin.
              </p>
            </div>
            <GscConnectionBar className="sm:pt-0.5" />
          </div>
        </header>

        <ExecutiveSummary northStar={northStar} loading={loading && connected && hasSite} />

        <FilterBar />

        <motion.section
          layout
          className="space-y-4"
          transition={{ type: 'spring', stiffness: 320, damping: 30 }}
        >
          <StrategicModuleGrid
            snapshot={snapshot}
            loading={loading}
            error={error}
            connected={connected}
            hasSite={hasSite}
            rowCount={rowCount}
          />
        </motion.section>
      </motion.div>
    </LayoutGroup>
  )
}

export function DashboardPage() {
  return (
    <GscAuthProvider>
      <DashboardFiltersProvider>
        <DashboardBody />
      </DashboardFiltersProvider>
    </GscAuthProvider>
  )
}
