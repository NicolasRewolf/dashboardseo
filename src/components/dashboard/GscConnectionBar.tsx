import { AlertCircle, Link2, Loader2, LogOut, RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { useGscAuth } from '@/contexts/gsc-auth-context'

export function GscConnectionBar({ className }: { className?: string }) {
  const {
    status,
    error,
    hasClientId,
    isAuthenticated,
    sites,
    siteUrl,
    setSiteUrl,
    connect,
    disconnect,
    refreshSites,
  } = useGscAuth()

  if (!hasClientId) {
    return (
      <p
        className={cn(
          'flex max-w-md items-start gap-1.5 text-[11px] leading-snug text-muted-foreground',
          className
        )}
        role="status"
      >
        <AlertCircle className="mt-0.5 size-3 shrink-0 text-[color:var(--color-warning)]" aria-hidden />
        <span>
          <code className="rounded bg-muted px-0.5 font-mono">VITE_GSC_CLIENT_ID</code> manquant dans{' '}
          <code className="rounded bg-muted px-0.5 font-mono">.env</code>
        </span>
      </p>
    )
  }

  return (
    <div className={cn('flex min-w-0 flex-col items-stretch gap-1 sm:items-end', className)}>
      <div className="flex flex-wrap items-center justify-end gap-1.5 sm:justify-end">
        {status === 'connecting' ? (
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Loader2 className="size-3 animate-spin shrink-0" aria-hidden />
            Connexion…
          </span>
        ) : null}

        {!isAuthenticated ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => void connect()}
          >
            <Link2 className="size-3.5" aria-hidden />
            Connexion GSC
          </Button>
        ) : (
          <>
            <Select
              value={siteUrl ?? ''}
              onValueChange={(v) => setSiteUrl(v || null)}
              disabled={sites.length === 0}
            >
              <SelectTrigger
                className={cn(
                  'h-7 max-w-[min(72vw,260px)] border-border/80 bg-transparent px-2 font-mono text-[11px]',
                  !siteUrl && 'text-muted-foreground'
                )}
                aria-label="Propriété Search Console"
              >
                <SelectValue placeholder="Propriété…" />
              </SelectTrigger>
              <SelectContent align="end">
                {sites.map((s) => (
                  <SelectItem key={s.siteUrl} value={s.siteUrl} className="font-mono text-xs">
                    {s.siteUrl}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 shrink-0 text-muted-foreground hover:text-foreground"
              title="Actualiser les propriétés"
              onClick={() => void refreshSites()}
            >
              <RefreshCw className="size-3.5" aria-hidden />
              <span className="sr-only">Actualiser</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 shrink-0 text-muted-foreground hover:text-foreground"
              title="Déconnexion"
              onClick={disconnect}
            >
              <LogOut className="size-3.5" aria-hidden />
              <span className="sr-only">Déconnexion</span>
            </Button>
          </>
        )}
      </div>

      {error ? (
        <p
          className="max-w-md text-right text-[10px] leading-snug text-[color:var(--color-danger)]"
          title={error}
        >
          <span className="line-clamp-2">{error}</span>
        </p>
      ) : null}
    </div>
  )
}
