# Règles communes aux assistants (Codex, Claude)

Ce dépôt est modifié par plusieurs assistants à tour de rôle. Ces règles évitent qu'un assistant écrase ou perde le travail de l'autre. Le propriétaire du projet a le dernier mot sur tout.

## Avant de commencer

1. Lire la passation la plus récente dans `docs/passation-*.md`.
2. Vérifier l'état du dépôt :
   ```
   git fetch
   git status -sb
   git stash list
   git worktree list
   git branch -vv
   ```
3. S'il y a des modifications non commitées, un stash, un worktree ou une branche non fusionnée que vous n'avez pas créés : ne rien toucher et demander au propriétaire.

## Pendant le travail

- Une branche par tâche (`fix/…`, `feat/…`, `docs/…`, `release/…`), créée depuis `main` à jour.
- Ne pas laisser de modifications non commitées sur `main`. Pas de stash « temporaire » sur `main` : commiter sur une branche de travail à la place.
- Fusion dans `main` avec un commit de merge (`git merge --no-ff`), puis `git push origin main`.
- Ne jamais supprimer, réécrire ou force-pousser le travail d'un autre assistant (branche, stash, worktree, commit) sans l'accord du propriétaire.
- Messages de commit au format Conventional Commits (`fix(player): …`, `docs(release): …`).

## Production (www.louis94.com)

- **Aucune modification en production sans l'accord explicite du propriétaire**, à chaque fois.
- Toujours sauvegarder avant de déployer, dans `wp-content/plugin-backups/`. La procédure complète est dans la dernière passation.
- Chaque livraison incrémente la version du plugin, sinon le cache `?ver=` sert l'ancien JS.

## Validation avant fusion

```
pnpm test
pnpm --filter @zydka/zydka-plugin typecheck
pnpm package:wp
```

## Fin de tâche

Écrire ou mettre à jour `docs/passation-<sujet>.md` : état du dépôt (commit, branches), ce qui a été fait, ce qui reste, ce qui attend une décision. Supprimer les branches et worktrees locaux de la tâche une fois fusionnés.

## Pièges de l'environnement (Windows)

- `pnpm` n'est pas dans le PATH. Le binaire est `%LOCALAPPDATA%\node\corepack\v1\pnpm\11.7.0\bin\pnpm.cjs`. Il faut un shim `pnpm.cmd` dans le PATH, car pnpm se rappelle lui-même :
  ```
  @node "%LOCALAPPDATA%\node\corepack\v1\pnpm\11.7.0\bin\pnpm.cjs" %*
  ```
- Dans Git Bash, préfixer les commandes avec `MSYS_NO_PATHCONV=1` pour les chemins serveur (`/home/…`), sinon ils sont réécrits en chemins Windows.
- Les fichiers source sont en CRLF. `apps/zydka-player-manager/` est une copie exacte de la production : ne jamais convertir ses fins de ligne.
- Les worktrees avec `node_modules` peuvent dépasser la limite de longueur des chemins Windows à la suppression. Supprimer alors le dossier avec le préfixe `\\?\`.
