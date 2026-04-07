# dashboardseo

Application **dashboard SEO / BI** : connexion **Google Search Console**, filtres, tendances, modules analytiques (gains/pertes, striking distance, etc.) et enrichissements **DataForSEO** (volumes, opportunités, graphiques avancés).  
Produit présenté dans l’UI comme **« Search Console 2.0 » / Pilotage organique**.

**Dépôt :** [github.com/NicolasRewolf/dashboardseo](https://github.com/NicolasRewolf/dashboardseo)

> Ce dépôt **n’est pas** [rewolf-seo-editor](https://github.com/NicolasRewolf/rewolf-seo-editor) (éditeur d’articles). Les deux se complètent mais vivent dans **deux clones séparés**.

## Stack (résumé)

Vite, React 19, TypeScript, Tailwind, shadcn/ui, Nivo / Recharts / Tremor / etc.

## Commandes

```bash
git clone https://github.com/NicolasRewolf/dashboardseo.git
cd dashboardseo
npm install
npm run dev
```

Configurer les variables d’environnement (voir `.env.example`) : GSC / proxy, DataForSEO, etc. selon ce que tu utilises.

## Nom du package npm

Le champ `"name"` dans `package.json` est **`dashboardseo`** (plus le vieux nom de template `rewolf-starter`).

## Voir aussi

- [rewolf-seo-editor — docs/ECOSYSTEM.md](https://github.com/NicolasRewolf/rewolf-seo-editor/blob/main/docs/ECOSYSTEM.md) (tableau des dépôts REWOLF et pièges à éviter)
