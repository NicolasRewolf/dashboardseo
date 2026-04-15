import { motion } from 'framer-motion'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { formatNumber } from '@/lib/format'
import type { DataLoadMeta } from '@/types/bi'

export function DataFoundationsCard({ meta }: { meta: DataLoadMeta }) {
  const anyTrunc =
    meta.queryPageLikelyTruncatedCurrent ||
    meta.queryPageLikelyTruncatedPrevious ||
    meta.dateLikelyTruncatedCurrent ||
    meta.dateLikelyTruncatedPrevious

  const qpMaxed =
    meta.queryPageLikelyTruncatedCurrent || meta.queryPageLikelyTruncatedPrevious

  return (
    <motion.div layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-border bg-card/80 backdrop-blur-sm">
        <CardHeader className="space-y-1 pb-3">
          <h2 className="text-sm font-medium tracking-tight text-foreground">
            Fiabilité des chiffres
          </h2>
          <p className="text-xs text-muted-foreground">
            Complétude des exports GSC pour la période (plafond {formatNumber(meta.rowLimit)} lignes / appel).
          </p>
          <details className="text-[11px] leading-relaxed text-muted-foreground/90">
            <summary className="cursor-pointer select-none text-muted-foreground hover:text-foreground">
              Pourquoi ça compte
            </summary>
            <p className="mt-2">
              Le détail requête+URL alimente les tableaux agrégés ; la série par jour sert aux courbes. Si une
              extraction atteint le plafond, certains totaux peuvent être incomplets même si les graphiques
              s’affichent.
            </p>
          </details>
        </CardHeader>
        <CardContent className="space-y-4 border-t border-border/80 pt-4 text-xs">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-border/80 bg-muted/20 p-3">
              <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Période analysée
              </p>
              <p className="font-mono text-sm text-foreground">
                {meta.dateRangeCurrent.start} → {meta.dateRangeCurrent.end}
              </p>
            </div>
            <div className="rounded-md border border-border/80 bg-muted/20 p-3">
              <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Période de référence (comparaison)
              </p>
              <p className="font-mono text-sm text-foreground">
                {meta.dateRangePrevious.start} → {meta.dateRangePrevious.end}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-border/80 p-3">
              <p className="mb-1 font-medium text-foreground">Tableaux requêtes & URLs</p>
              <p className="mb-2 text-[11px] leading-relaxed text-muted-foreground">
                Chaque ligne = une requête + une page. Plus il y a de lignes, plus le détail est fin,
                jusqu’au plafond ci-dessus.
              </p>
              <ul className="space-y-1 font-mono text-[11px] text-foreground">
                <li>
                  Période actuelle :{' '}
                  <strong>{formatNumber(meta.queryPageRowsCurrent)}</strong> lignes
                </li>
                <li>
                  Période de référence :{' '}
                  <strong>{formatNumber(meta.queryPageRowsPrevious)}</strong> lignes
                </li>
              </ul>
            </div>
            <div className="rounded-md border border-border/80 p-3">
              <p className="mb-1 font-medium text-foreground">Courbe jour par jour</p>
              <p className="mb-2 text-[11px] leading-relaxed text-muted-foreground">
                Un point par jour dans la fenêtre — pour la tendance et le pont « clics ».
              </p>
              <ul className="space-y-1 font-mono text-[11px] text-foreground">
                <li>
                  Actuelle : <strong>{formatNumber(meta.dateRowsCurrent)}</strong> jours
                </li>
                <li>
                  Référence : <strong>{formatNumber(meta.dateRowsPrevious)}</strong> jours
                </li>
              </ul>
            </div>
          </div>

          {qpMaxed ? (
            <div className="flex gap-2 rounded-md border border-[color:var(--color-warning)] bg-muted/40 p-3 text-[11px] text-foreground">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[color:var(--color-warning)]" aria-hidden />
              <div>
                <p className="font-medium">Export probablement incomplet</p>
                <p className="mt-1 leading-relaxed text-muted-foreground">
                  Le détail requête+page atteint le plafond ({formatNumber(meta.rowLimit)} lignes). Les
                  totaux de clics / impressions peuvent être <strong>inférieurs</strong> à la réalité.
                  Pour des chiffres plus fiables : raccourcir les dates, ou accepter que les tableaux
                  basés sur le détail soient partiels.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2 rounded-md border border-border/80 bg-muted/20 p-3 text-[11px] text-muted-foreground">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[color:var(--color-success)]" aria-hidden />
              <span>
                Détail requête+page : pas de plafond atteint sur les périodes affichées — les agrégats
                ci-dessous sont cohérents avec ce que l’API a renvoyé.
              </span>
            </div>
          )}

          {(meta.responseAggregationQueryPageCurrent || meta.responseAggregationDateCurrent) && (
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              {meta.responseAggregationQueryPageCurrent && (
                <>
                  Note technique Google (requêtes) :{' '}
                  <span className="font-mono">{meta.responseAggregationQueryPageCurrent}</span>.{' '}
                </>
              )}
              {meta.responseAggregationDateCurrent && (
                <>
                  Note technique (dates) :{' '}
                  <span className="font-mono">{meta.responseAggregationDateCurrent}</span>.
                </>
              )}
            </p>
          )}

          {anyTrunc && !qpMaxed && (
            <p className="text-[11px] text-muted-foreground">
              La série par jour touche aussi le plafond : la courbe peut manquer des jours si la fenêtre
              est très chargée.
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
