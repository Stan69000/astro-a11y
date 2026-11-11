# Publier une version sur npm

Quatre paquets sont publiés ensemble, toujours au même numéro de version :
`@astro-a11y/core`, `@astro-a11y/reporters`, `@astro-a11y/astro-integration` et `astro-a11y` (la CLI).

La publication automatique utilise le **trusted publishing** de npm : GitHub Actions s'authentifie
auprès de npm sans aucun jeton stocké dans le dépôt, et npm ajoute une attestation de provenance
qui prouve que le paquet a été construit depuis ce dépôt.

## Mise en place (une seule fois)

npm n'autorise la configuration du trusted publishing que sur un paquet qui existe déjà.
La toute première version se publie donc depuis ta machine.

1. Créer un compte sur [npmjs.com](https://www.npmjs.com/signup) et activer la double
   authentification (**Account → Two-Factor Authentication**, mode « Authorization and writes »).
2. Créer l'organisation gratuite **`astro-a11y`** (**Add Organization**, plan « Unlimited public
   packages ») : c'est elle qui possède le préfixe `@astro-a11y/…`.
3. Préparer la version (voir « Publier une nouvelle version », étapes 1 à 3), puis depuis un clone
   propre, à jour sur `main` :

   ```bash
   pnpm install --frozen-lockfile
   node scripts/check-release.js v0.2.0
   pnpm lint && pnpm test
   npm login
   pnpm -r publish --access public
   ```

   `pnpm publish` remplace les dépendances `workspace:*` par le vrai numéro de version :
   ne pas utiliser `npm publish` directement depuis les dossiers des paquets.
4. Pour **chacun des quatre paquets**, sur npmjs.com : **Settings → Trusted Publisher → GitHub Actions** :
   - Organization or user : `Stan69000`
   - Repository : `astro-a11y`
   - Workflow filename : `release.yml`
   - Environment name : `npm`
5. Toujours dans **Settings** de chaque paquet, choisir **Publishing access → Require two-factor
   authentication and disallow tokens**. Seul le workflow pourra alors publier.
6. Optionnel : dans GitHub, **Settings → Environments → npm → Required reviewers**, pour devoir
   valider chaque publication à la main.

## Publier une nouvelle version

1. Choisir le numéro ([SemVer](https://semver.org/lang/fr/)) : correctif `0.2.1`, nouveauté `0.3.0`.
2. Mettre ce numéro dans les quatre `packages/*/package.json`.
3. Dans `CHANGELOG.md`, renommer `## [Unreleased]` en `## [0.3.0] - AAAA-MM-JJ`.
4. Fusionner ces changements dans `main`, puis créer et pousser le tag :

   ```bash
   git tag v0.3.0
   git push origin v0.3.0
   ```

Le workflow **Release** vérifie que le tag correspond aux versions et au CHANGELOG, relance lint,
tests et audit, construit les paquets, puis les publie.

## En cas d'erreur

- Une version publiée ne peut **jamais** être republiée sous le même numéro, même après retrait.
- Dans les 72 heures, tant qu'aucun autre paquet n'en dépend : `npm unpublish <paquet>@<version>`.
- Au-delà : `npm deprecate <paquet>@<version> "raison"`, puis publier un correctif.
- Si le workflow échoue au milieu de la boucle de publication, les paquets déjà publiés le restent :
  publier une nouvelle version de correctif plutôt que de relancer le même tag.
