# Refonte de l'étape « Data » — Workspace de cluster de sources

## Context

L'étape `research` du workflow REWOLF SEO Editor est actuellement compressée dans la sidebar de droite (440 px) sous forme de 3 sections empilées : `SourceImportZone` + `SourceList` + `SerpResearch` + `GscPanel`. L'éditeur Plate occupe toute la zone principale alors qu'il est inutile à ce stade (l'article n'existe pas encore).

Cette UI ne donne pas le sentiment qu'on **bâtit un cluster** de sources diverses, on a juste un formulaire dans une colonne étroite. Le user veut une expérience type **NotebookLM** : un espace dédié, en focus, où la collecte et la vue d'ensemble du cluster sont l'activité principale. Une fois le cluster prêt, on bascule vers les étapes Plan → Rédaction → Finaliser qui réutilisent l'éditeur Plate normalement.

**Choix design validés** :
- Mode focus plein écran (l'éditeur Plate est masqué tant qu'on est sur `research`)
- Layout 2 colonnes : Cluster gauche (~400 px) + Inspector droit (flex-1)
- Bouton « + Ajouter une source » qui ouvre un panneau modal avec 4 onglets (SERP / URL / Coller / Fichier)
- Toutes les sources actives par défaut (pas de checkboxes)
- Dashboard cluster au centre quand aucune source sélectionnée
- GSC retiré de l'étape Data (déplacement à un autre emplacement, hors scope MVP)

**Contraintes** :
- Aucune migration de données : les types `KbSource` / `KnowledgeBase` restent intacts, la KB en localStorage reste lisible.
- Les étapes outline / writing / finalize doivent continuer à recevoir la KB sans changement.
- Pas de nouvelles dépendances npm (sauf shadcn `sheet` si vraiment nécessaire — voir section dédiée).

---

## Layout final quand `currentStep === 'research'`

```
┌──────────────────────────────────────────────────────────────────┐
│ Header (REWOLF · Éditeur · Article SEO) + boutons header         │
├──────────────────────────────────────────────────────────────────┤
│ MetaFields (focusKeyword, slug, metaTitle, metaDescription)      │
├──────────────────────────────────────────────────────────────────┤
│ WorkflowStepper [●Data] [○Plan] [○Rédaction] [○Finaliser]        │
├──────────────────────────┬───────────────────────────────────────┤
│ DataSourcesPanel (~400) │ DataInspectorPanel (flex-1)            │
│ ┌────────────────────┐  │ ┌─────────────────────────────────┐    │
│ │ [+ Ajouter source] │  │ │ Vue Dashboard (par défaut)      │    │
│ └────────────────────┘  │ │ ─ Compteur sources / mots cumul │    │
│ Filtres (Tous / SERP /  │ │ ─ Benchmark vs concurrent       │    │
│ URL / Texte / Fichier)  │ │ ─ Répartition par type (barres) │    │
│ Recherche cmdk          │ │ ─ Top mots-clés extraits        │    │
│                         │ │ ─ Dernières sources ajoutées    │    │
│ ┌─ src 1 (sélection) ─┐ │ └─────────────────────────────────┘    │
│ ├─ src 2 ─────────────┤ │ OU                                     │
│ ├─ src 3 ─────────────┤ │ ┌─────────────────────────────────┐    │
│ ├─ src 4 ─────────────┤ │ │ Vue Source (si sélection)       │    │
│ └─ ...                │ │ │ ─ Header : type, label, URL     │    │
│                         │ │ ─ Stats : mots, date            │    │
│ Total : 12 src · 28k    │ │ ─ Contenu scrollable + highlight│    │
│                         │ │   du focusKeyword               │    │
│                         │ └─────────────────────────────────┘    │
└──────────────────────────┴───────────────────────────────────────┘
```

Quand l'étape change vers `outline | writing | finalize`, le rendu actuel `[Editor | Sidebar 440]` reprend exactement comme avant.

---

## Architecture des fichiers

### Nouveaux fichiers à créer

| Fichier | Rôle |
|---|---|
| `src/app/editor/data/DataWorkspace.tsx` | Container 2 colonnes, gère le `selectedSourceId` local et le state du modal d'ajout. |
| `src/app/editor/data/DataSourcesPanel.tsx` | Colonne gauche : bouton ajout, filtres, recherche, liste cliquable des sources. |
| `src/app/editor/data/DataSourceCard.tsx` | Item compact d'une source dans la liste (titre, type badge, mots, hover delete). État sélectionné. |
| `src/app/editor/data/DataInspectorPanel.tsx` | Colonne droite : route entre `ClusterDashboard` et `SourcePreview` selon `selectedSourceId`. |
| `src/app/editor/data/ClusterDashboard.tsx` | Vue dashboard : stats, barres répartition, top mots, dernières sources. |
| `src/app/editor/data/SourcePreview.tsx` | Vue d'une source sélectionnée : header + contenu + highlight focus keyword. |
| `src/app/editor/data/AddSourceDialog.tsx` | Modal `Dialog` avec 4 onglets (SERP / URL / Coller / Fichier). |
| `src/app/editor/data/add-tabs/AddSerpTab.tsx` | Onglet SERP — réutilise la logique de `serp-research.tsx`. |
| `src/app/editor/data/add-tabs/AddUrlTab.tsx` | Onglet URL — réutilise `extractUrl` de `source-import-zone.tsx`. |
| `src/app/editor/data/add-tabs/AddPasteTab.tsx` | Onglet Coller — réutilise `addPastedText`. |
| `src/app/editor/data/add-tabs/AddFileTab.tsx` | Onglet Fichier — réutilise `onFiles`. |
| `src/lib/knowledge-base/kb-helpers.ts` | Helpers extraits : `countWords`, `makeSource`, `makeSerpSource`. **Source unique de vérité** réutilisée par tous les onglets d'ajout. |
| `src/lib/knowledge-base/kb-stats.ts` | Calculs purs pour le dashboard : `computeClusterStats`, `topTerms`, `breakdownByType`. |
| `src/lib/seo/highlight.ts` | Helper pur `highlightKeyword(text, keyword): { before, match, after }[]` ou retourne du JSX safe via spans. |

### Fichiers à modifier

| Fichier | Modification |
|---|---|
| `src/app/editor/SeoEditor.tsx` | Lignes 281-345 : ajouter une branche conditionnelle. Si `currentStep === 'research'` → rendre `<WorkflowStepper>` + `<DataWorkspace>` qui occupent toute la largeur sous `MetaFields`. Sinon → rendu actuel inchangé `[Editor | Sidebar(Stepper + WorkflowSidebar)]`. Le stepper apparaît donc dans **deux** positions selon le mode (acceptable car même composant et même `setCurrentStep`). |
| `src/components/workflow/workflow-sidebar.tsx` | Retirer le case `'research'` du `switch` (ou retourner `null`), puisque l'étape est gérée hors sidebar. Garder les autres cases intacts. |

### Fichiers à retirer du flux (ne pas supprimer le code)

| Fichier | Raison |
|---|---|
| `src/components/workflow/steps/step-research.tsx` | Remplacé par `DataWorkspace`. Garder le fichier pour récupérer rapidement le wiring si besoin, supprimer plus tard. |
| `src/components/workflow/research/source-import-zone.tsx` | Logique extraite dans les `add-tabs/`. Garder en référence pendant la transition, supprimer après validation. |
| `src/components/workflow/research/source-list.tsx` | Remplacé par `DataSourcesPanel` + `DataSourceCard`. Idem. |
| `src/components/workflow/research/serp-research.tsx` | Logique extraite dans `AddSerpTab`. Idem. |
| `src/components/seo/gsc-panel.tsx` | Sort de l'étape Data. Garder le fichier intact pour le réinjecter ailleurs (page `/analytics` ou drawer dédié, dans une itération future). |

---

## Plan de refactoring — extraction des helpers

Aujourd'hui `countWords`, `makeSource`, `makeSerpSource` sont **dupliqués** dans `source-import-zone.tsx:14-30` et `serp-research.tsx:14-31`. La refonte est l'occasion de centraliser :

**Créer `src/lib/knowledge-base/kb-helpers.ts`** avec :
```ts
export function countWords(text: string): number;
export function makeSource(p: Omit<KbSource, 'id'|'wordCount'|'addedAt'>): KbSource;
export function makeSerpSource(url: string, title: string, content: string): KbSource;
```

Les 4 onglets `Add*Tab.tsx` importent depuis ce module, ainsi que `ClusterDashboard` (pour `countWords` si besoin) et tout futur consommateur. Un seul endroit pour faire évoluer la logique d'ID (UUID), de date, de comptage de mots.

**Migration** : copier les 3 fonctions depuis `source-import-zone.tsx` et `serp-research.tsx`, vérifier qu'elles sont identiques, ajouter les imports dans les nouveaux composants, ne **pas** toucher aux deux anciens fichiers (ils sortent du flux et seront supprimés plus tard).

---

## Modal d'ajout — `Dialog` plutôt que `Sheet`

**Recommandation** : utiliser `Dialog` shadcn déjà installé (`src/components/ui/dialog.tsx`).

**Pourquoi** :
- `Sheet` n'est pas dans le projet → demanderait `npx shadcn add sheet` (nouvelle dépendance Radix).
- L'ajout de source est une action ponctuelle et focalisée → un Dialog centré 600-720 px avec 4 onglets fait très bien le job.
- Cohérent avec `LoadArticleDialog` (`src/components/article/load-article-dialog.tsx`) déjà utilisé dans l'app.

**Structure du Dialog** :
```
DialogContent (max-w-2xl)
  DialogHeader: "Ajouter une source"
  Tabs (defaultValue="serp")
    TabsList: SERP | URL | Coller | Fichier
    TabsContent[serp]: <AddSerpTab onAdd={...} focusKeyword={meta.focusKeyword} />
    TabsContent[url]:  <AddUrlTab onAdd={...} />
    TabsContent[paste]: <AddPasteTab onAdd={...} />
    TabsContent[file]:  <AddFileTab onAdd={...} />
```

Chaque onglet expose `onAdd: (sources: KbSource[]) => void`. Le parent (`DataWorkspace`) ferme le dialog après chaque ajout réussi (sauf SERP : reste ouvert pour permettre les ajouts batch successifs).

---

## Dashboard cluster — métriques sans lib graphique

`src/lib/knowledge-base/kb-stats.ts` (pur, testable) :

```ts
export type ClusterStats = {
  totalSources: number;
  totalWords: number;
  byType: Record<KbSourceType, { count: number; words: number }>;
  recent: KbSource[]; // 5 dernières par addedAt desc
  topTerms: { term: string; freq: number }[]; // top 12
};

export function computeClusterStats(kb: KnowledgeBase): ClusterStats;
```

**Détails de calcul** :
- `totalSources` = `kb.sources.length`
- `totalWords` = `Σ source.wordCount`
- `byType` = reduce sur `s.type`
- `recent` = `[...sources].sort((a,b) => b.addedAt.localeCompare(a.addedAt)).slice(0,5)`
- `topTerms` : tokenisation simple `lowercase + split(/\s+/) + filter stopwords FR + filter len ≥ 4`, comptage Map. Réutiliser la liste de stopwords déjà présente dans `src/lib/knowledge-base/kb-text.ts:kbExcerptForHeading` (extraire en constante exportée).

**Affichage dans `ClusterDashboard.tsx`** :
- 4 cards stat (Sources / Mots cumulés / Mots moy. par source / Diversité types)
- **Barres de répartition par type** : `<div className="flex h-2 rounded overflow-hidden">` avec 4 segments en `flex-grow` proportionnel à `byType[t].count`. Couleurs : `bg-blue-500` (serp), `bg-green-500` (url), `bg-amber-500` (text), `bg-violet-500` (file). Légende dessous avec compteurs.
- **Benchmark concurrent** : si `competitorWordCount` (déjà remonté à `SeoEditor`) est défini → afficher "Cluster : X mots · Cible concurrent moyenne : Y mots → ratio Z×". Sinon afficher "Lance une recherche SERP pour calibrer le benchmark".
- **Top mots** : nuage de pills (`<span className="bg-muted px-2 py-1 rounded text-xs">term · freq</span>`) sur 2-3 lignes avec `flex flex-wrap`.
- **Dernières sources** : 5 lignes cliquables qui sélectionnent la source dans le panneau gauche (callback `onSelect(id)`).

**Pas de lib chart** : tout est fait avec Tailwind + flex. Économe et cohérent avec le ton minimaliste du projet.

---

## State de sélection

**Recommandation** : `selectedSourceId: string | null` vit **localement dans `DataWorkspace`**, **pas dans `SeoEditor`** ni dans la KB.

**Pourquoi** :
- C'est un état purement UI, éphémère, sans valeur après fermeture de l'étape Data.
- Aucune autre étape n'en a besoin.
- Évite de polluer `StoredArticle` et de devoir gérer la migration localStorage.
- Si une source est supprimée alors qu'elle est sélectionnée, on remet à `null` (pattern existant dans `source-list.tsx:remove`).

`DataWorkspace` passe `selectedSourceId` et `setSelectedSourceId` aux deux panneaux.

---

## Highlight du focus keyword dans la preview

Helper pur dans `src/lib/seo/highlight.ts` :

```ts
export function splitForHighlight(text: string, keyword: string): Array<{
  text: string;
  match: boolean;
}>;
```

Implémentation : si `keyword` est vide ou < 2 chars, retourner `[{ text, match: false }]`. Sinon `text.split(new RegExp(`(${escapeRegex(keyword)})`, 'gi'))` puis mapper en alternant `match: true/false`.

**`SourcePreview.tsx`** consomme le résultat et rend :
```tsx
{parts.map((p, i) =>
  p.match
    ? <mark key={i} className="bg-amber-200/60 dark:bg-amber-400/30 rounded px-0.5">{p.text}</mark>
    : <span key={i}>{p.text}</span>
)}
```

Pas de dépendance externe, pas de regex injection (échappement avec `replace(/[.*+?^${}()|[\]\\]/g, '\\$&')`).

---

## Filtres et recherche dans le panneau Sources

**Filtres** (3-4 boutons toggle en haut de la liste, sous le bouton + Ajouter) :
- `Tous` (default) | `SERP` | `URL` | `Texte` | `Fichier`
- Implémentation : `useState<KbSourceType | 'all'>('all')` + `kb.sources.filter(s => f === 'all' || s.type === f)`

**Recherche** :
- Simple `<Input>` (pas besoin de `cmdk` pour le MVP), filtrage case-insensitive sur `label + content.slice(0, 200)`.
- Skip si `< 2` caractères.
- Combinable avec le filtre type.

---

## Étapes d'implémentation

### Lot 1 — Fondations (helpers et types)
- Créer `src/lib/knowledge-base/kb-helpers.ts` (extraction de `countWords`, `makeSource`, `makeSerpSource`).
- Créer `src/lib/knowledge-base/kb-stats.ts` (`computeClusterStats`).
- Créer `src/lib/seo/highlight.ts` (`splitForHighlight` + `escapeRegex`).
- Exporter la liste de stopwords FR depuis `src/lib/knowledge-base/kb-text.ts` (qui la possède déjà en interne).
- **Fini quand** : les 3 modules compilent sans erreur, importables.

### Lot 2 — Composants visuels (sans branchement)
- Créer `DataSourceCard.tsx` (présentationnel pur, props : `source`, `selected`, `onSelect`, `onDelete`).
- Créer `SourcePreview.tsx` (props : `source`, `focusKeyword`).
- Créer `ClusterDashboard.tsx` (props : `stats: ClusterStats`, `competitorWordCount?`, `onSelectRecent`).
- **Fini quand** : les composants peuvent être rendus en isolation avec des données fakes.

### Lot 3 — Onglets d'ajout
- Créer `add-tabs/AddPasteTab.tsx`, `AddFileTab.tsx`, `AddUrlTab.tsx` en réutilisant les handlers existants depuis `kb-helpers.ts` + `fetchReaderContent`.
- Créer `add-tabs/AddSerpTab.tsx` en réutilisant `searchSerp` + `fetchReaderContent` + `makeSerpSource`. Garder la logique batch top 5.
- Créer `AddSourceDialog.tsx` avec les `Tabs` shadcn et un callback `onAdd(sources)`.
- **Fini quand** : on peut ouvrir le Dialog en standalone et ajouter une source de chaque type.

### Lot 4 — Container et panneaux
- Créer `DataSourcesPanel.tsx` (filtres, recherche, liste, total, bouton + qui ouvre le dialog).
- Créer `DataInspectorPanel.tsx` (route entre dashboard et preview).
- Créer `DataWorkspace.tsx` (layout 2 colonnes, gestion `selectedSourceId`, gestion ouverture du dialog, transmission de la KB et de `setKnowledgeBase`).
- **Fini quand** : `DataWorkspace` peut être rendu avec la KB et fonctionne en autonome.

### Lot 5 — Branchement dans `SeoEditor`
- Modifier `SeoEditor.tsx` lignes 281-345 : ajouter la branche conditionnelle. Si `research` → `<WorkflowStepper>` + `<DataWorkspace>`. Sinon → rendu actuel.
- Modifier `workflow-sidebar.tsx` : retirer `case 'research'` (return `null`).
- Vérifier que les props critiques transitent : `meta`, `knowledgeBase`, `setKnowledgeBase`, `competitorWordCount`, `onCompetitorBenchmark`.
- **Fini quand** : la bascule entre étapes fonctionne, l'éditeur Plate disparaît bien en mode Data et réapparaît sur les autres étapes.

### Lot 6 — Cleanup (après validation user)
- Supprimer `step-research.tsx`, `source-import-zone.tsx`, `source-list.tsx`, `serp-research.tsx` (laisser pendant le PR de revue, supprimer après merge).
- Décider du sort de `gsc-panel.tsx` (page séparée à planifier dans une prochaine itération).

---

## Réutilisations critiques (à ne pas redévelopper)

| Existant | Chemin | Réutilisé pour |
|---|---|---|
| `KbSource`, `KnowledgeBase` types | `src/types/knowledge-base.ts` | Tout — shape inchangé |
| `fetchReaderContent` | `src/lib/api/reader-fetch.ts` | `AddUrlTab`, `AddSerpTab` |
| `searchSerp`, `SerpOrganicItem` | `src/lib/api/serp-search.ts` | `AddSerpTab` |
| `concatKbSources`, `kbExcerptForHeading` | `src/lib/knowledge-base/kb-text.ts` | Intacts (étapes outline/writing) |
| `loadStoredArticle`, `saveStoredArticle` | `src/lib/storage/local-article.ts` | Persistance KB inchangée |
| `WorkflowStepper` | `src/components/workflow/workflow-stepper.tsx` | Réutilisé tel quel, juste rendu à un autre endroit en mode research |
| `Dialog`, `Tabs`, `Button`, `Input`, `Textarea`, `Checkbox` | `src/components/ui/*` | Tous les composants UI |
| `toast` (sonner) | `import { toast } from 'sonner'` | Confirmations d'ajout |
| `lucide-react` icons | `PlusIcon`, `LinkIcon`, `FileUpIcon`, `SearchIcon`, `XIcon`, `ChevronRightIcon` | Tous nouveaux composants |

---

## Vérification end-to-end

1. **Lancer l'app** : `npm run dev:all` (vite + hono concurrent).
2. **Aller sur `/`** → vérifier que l'étape `Data` s'affiche en mode plein écran (l'éditeur Plate disparaît).
3. **Vérifier le stepper** : cliquer sur `Plan` → l'éditeur Plate réapparaît + sidebar 440 px. Revenir sur `Data` → workspace plein écran.
4. **Ajouter une source de chaque type** :
   - Bouton « + Ajouter une source » → onglet **SERP** : taper une requête (ex : `RGPD entreprise`), cliquer "Voir", ajouter une source individuelle puis "Ajouter le top 5".
   - Onglet **URL** : coller une URL, extraire.
   - Onglet **Coller** : coller du texte, ajouter.
   - Onglet **Fichier** : uploader un `.md` ou `.txt`.
5. **Vérifier le dashboard** (centre) : compteur, répartition par type, top mots, dernières sources, benchmark si SERP fetché.
6. **Cliquer une source** dans la liste gauche → la preview s'affiche au centre avec le focus keyword surligné en jaune (si défini dans MetaFields).
7. **Filtrer / rechercher** : tester les filtres par type et la recherche texte.
8. **Supprimer une source sélectionnée** → la sélection se réinitialise sur le dashboard.
9. **Tester la persistance** :
   - Recharger la page → la KB est conservée (via `saveStoredArticle` debounce 2 s).
   - Inspecter `localStorage['rewolf-seo-editor:article-v1']` → vérifier que `knowledgeBase.sources` est intact.
10. **Tester la chaîne aval** :
    - Cliquer sur `Plan` → la KB doit s'afficher dans le `kbSummary` du `step-outline.tsx`. Lancer un outline → le prompt doit recevoir les extraits.
    - Cliquer sur `Rédaction` → tester `runSectionForIndex(0)`, vérifier que `kbExcerptForHeading` filtre bien par H2.
    - Cliquer sur `Finaliser` > onglet `Liens` > `Termes manquants` → le TF-IDF doit toujours fonctionner sur les sources `type === 'serp'`.
11. **Vérifier qu'il n'y a aucune régression** sur les autres étapes (visuel, navigation, sauvegarde disque via le bouton header).

---

## Notes hors scope

- **GSC** : sera réintégré dans une page séparée ou un drawer dans une prochaine itération. Pour l'instant, on retire simplement son rendu de l'étape Data, le code reste intact.
- **Tags / catégorisation des sources** : envisagé mais hors MVP.
- **Cocher / décocher des sources** : hors MVP, toutes actives par défaut.
- **Visualisation graphique avancée** (graph, nuage de mots animé) : hors MVP, dashboard textuel suffit.
- **Migration des anciens tests / hooks** : aucun test n'existe actuellement sur l'étape research, rien à migrer.
