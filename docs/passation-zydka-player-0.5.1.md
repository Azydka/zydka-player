# Passation — Zydka Player 0.5.1 (iPhone : volume et répétition)

Date : 2026-10-25

Statut : **fusionné dans `main` et déployé en production le 2026-10-25 vers 00:35, avec l'accord explicite du propriétaire.** La 0.5.1 contient aussi les favoris de la 0.5.0.

## Origine

Retour d'un testeur sur iPhone 12, iOS 18.7.8 :

1. Le curseur de volume bouge, mais le son ne change pas. Les boutons du téléphone changent le son sans faire bouger le curseur. Le bouton muet fonctionne.
2. Pour boucler un morceau, il faut appuyer deux fois sur Répéter, et un « 1 » apparaît. Le testeur ne savait pas si c'était normal.

Le reste est validé par le testeur : ergonomie, réactivité, son, aléatoire.

## Analyse

1. Le volume est une limite de WebKit sur iOS et iPadOS, valable pour tous les navigateurs : `HTMLMediaElement.volume` y est en lecture seule et reste à 1. Ce n'est pas un bug du player.
2. La répétition fonctionne comme prévu, sur trois états : off → playlist → morceau (« 1 »). Mais le libellé n'existe qu'en `title`, que le survol rend invisible sur mobile.

## Changements

- `src/deviceCapabilities.ts` (nouveau) : `canControlMediaVolume()` écrit 0,5 sur un `<audio>`, puis relit la valeur. Si aucun élément audio n'est disponible ou si une erreur survient, il renvoie `true` (le curseur est conservé).
- `src/index.ts` :
  - si le volume n'est pas pilotable, le bloc volume reçoit `zydka-player-volume--system`, et le curseur et le pourcentage passent en `hidden` ;
  - un appui sur Répéter affiche le mode actif dans la zone d'annonce existante (`aria-live`, 2,2 s) ;
  - « Répéter la file » devient « Répéter la playlist ».
- `src/queueNavigation.ts` : `getRepeatFeedback(mode)`.
- `assets/css/zydka-player.css` : la grille du mode `--system` ne garde que le bouton muet.
- Version 0.5.1 : `zydka-player.php` (en-tête et constante), `package.json`, changelog du `README.md`.
- `tests/deviceCapabilities.test.ts` (nouveau) : 6 tests.

Aucun changement dans le Manager, Analytics, WooCommerce ni dans les packages.

## Validations faites (conteneur Linux, Node 22)

| Vérification | Résultat |
|---|---|
| tests `zydka-plugin` (runner Node) | 65/65 OK (59 avant, + 6) |
| compilation esbuild de `src/index.ts` | OK, avec `howler` remplacé par un stub et `zustand` externe |
| `git diff --check` | OK |

## Validations pnpm (non exécutées, remplacées par la procédure ci-dessous)

Le registre npm était inaccessible depuis la session, d'où ces manques :

```
pnpm test
pnpm --filter @zydka/zydka-plugin typecheck
pnpm package:wp
```

Le bundle a été régénéré sans pnpm, commit `dbaae7d` :

- outil : esbuild 0.28.2, avec les options de `tsup.config.ts` (iife, es2017) ;
- sources de howler 2.2.4 et zustand 5.0.14 tirées des tags officiels sur GitHub, aux mêmes versions que `pnpm-lock.yaml` ;
- contrôle de fidélité : la même méthode appliquée aux sources de la 0.5.0 redonne le bundle commité, à trois écarts près, tous dus à la version d'esbuild : un `try/catch` dans l'utilitaire `__commonJS`, un `"use strict"` en moins dans le wrapper howler et la position des mentions de licence. Le code du player, de howler et de zustand est identique ;
- test navigateur (Playwright, Chromium 375 px), sur une page locale :
  - mode ordinateur : curseur et pourcentage visibles ;
  - mode iPhone simulé (setter de volume neutralisé) : bloc `--system`, seul le bouton muet reste ;
  - dans les deux modes : messages de répétition corrects, muet opérationnel, aucune erreur JS.

À la prochaine occasion, lancer `pnpm test`, `typecheck` et `package:wp` sous Windows. Un bundle régénéré qui ne diffère que sur ces trois points est normal.

## Tests manuels à faire

- iPhone (Safari et Chrome) : le volume n'affiche que le bouton muet, qui fonctionne. Les boutons physiques règlent le son.
- Android et ordinateur : le curseur et le pourcentage restent présents et fonctionnent.
- Trois appuis sur Répéter affichent « toute la playlist », puis « ce morceau » (avec le « 1 »), puis « désactivée ». La boucle d'un morceau rejoue bien le même titre.
- Non-régression : lecture, seek, file, aléatoire, favoris, partage, écran verrouillé.

## Déploiement (fait le 2026-10-25)

Sans accès SSH ni WP-CLI, le déploiement est passé par *Extensions → Ajouter → Téléverser*, dans Chrome, avec la session admin du propriétaire.

1. **Sauvegarde** : `dist/zydka-player-0.4.0-rollback.zip`, dans la copie principale du propriétaire, reconstruit depuis `c3d9b5a`.
   - SHA-256 `dee55722…b92ee4d`.
   - Avant le déploiement, le JS, le CSS, le PNG et le README servis en production avaient le même SHA-256 que ce ZIP. Le CSS, le README et le PHP sont en CRLF, comme en production.
2. **ZIP 0.5.1** : `dist/zydka-player-0.5.1.zip`, SHA-256 `3e6a91ca…6f4b45`, 5 fichiers en LF.
3. **Installation** : WordPress a affiché « Actuelle 0.4.0 / Téléversée 0.5.1 ». Après « Remplacer l'extension actuelle », il a confirmé « L'extension a bien été mise à jour ».
4. **Contrôles**, en visiteur anonyme :
   - extension `zydka-player` 0.5.1 active ;
   - `/demo-track/` sert `?ver=0.5.1` ;
   - le JS (174 949 octets) et le CSS (25 866 octets) servis ont le même SHA-256 que le ZIP ;
   - la lecture de *Plein Jour* passe en `playing` sur une file de 6, le message « Répétition : toute la playlist » s'affiche, aucune erreur.

À valider par le testeur sur iPhone 12 : curseur masqué, boutons du téléphone, messages de répétition.

**Retour arrière** : *Extensions → Ajouter → Téléverser* `zydka-player-0.4.0-rollback.zip`, puis « Remplacer ». Aucune donnée n'est concernée.

**Constat** : le dossier `wp-content/plugins/` contient cinq anciennes sauvegardes inactives, `zydka-player-backup-before-v06x-…` et `zydka-player-manager-backup-…`, datées de juin 2026. `AGENTS.md` demande de les ranger dans `plugin-backups/`. À trier par le propriétaire.
