# astro-a11y

[English](./README.md) | Français

[![Node.js Version](https://img.shields.io/node/v/astro-a11y)](https://nodejs.org)
[![RGAA Version](https://img.shields.io/badge/RGAA-4.1-green)](https://accessibilite.numerique.gouv.fr/)

Garde-fous d’accessibilité pour les projets Astro.

`astro-a11y` est une boîte à outils orientée Astro qui scanne les pages rendues avec Playwright + axe, enrichit les résultats avec des recommandations actionnables, mappe les problèmes courants vers le RGAA, et s’exécute via CLI ou automatiquement en fin de build Astro.

## Démarrage rapide

```bash
pnpm install
pnpm build
pnpm test
pnpm example:scan
```

## CLI

```bash
astro-a11y check <target> [--mode strict|balanced|learning] [--format terminal|json|html|markdown]
astro-a11y report --input ./reports/report.json [--format terminal|json|html|markdown]
```

Exemples :

```bash
astro-a11y check ./dist --mode balanced
astro-a11y check https://example.com --format json --output reports/report.json
astro-a11y report --input reports/report.json --format html --output reports/report.html
```

## Intégration Astro

```js
import { defineConfig } from 'astro/config';
import astroA11y from '@astro-a11y/astro-integration';

export default defineConfig({
  integrations: [
    astroA11y({
      mode: 'balanced',
      failOnBuild: false,
      writeReports: true
    })
  ]
});
```

Les rapports sont écrits dans `<dist>/astro-a11y/` par défaut.

## Pour la communauté

Le projet est maintenu par une seule personne, et les contributions sont bienvenues.

- Guide de contribution : [CONTRIBUTING.md](./CONTRIBUTING.md)
- Support et attentes : [SUPPORT.md](./SUPPORT.md)
- Direction produit : [ROADMAP.md](./ROADMAP.md)
- Politique sécurité : [SECURITY.md](./SECURITY.md)

## Structure du dépôt

- `packages/core` - moteur de scan, sécurité, mapping RGAA
- `packages/reporters` - reporters terminal, JSON, HTML, Markdown
- `packages/cli` - point d’entrée CLI
- `packages/astro-integration` - intégration Astro
- `examples/static-site` - fixture de site statique
- `tests` - tests automatiques

## Positionnement sécurité

- Local-first par défaut
- Pas de télémétrie
- Cibles distantes sensibles bloquées sauf autorisation explicite
- Workflow d’audit sécurité dédié
