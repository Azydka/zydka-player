# Zydka Player 0.3.2 — note de release

Date : 22/10/2026
Statut : **déployée** sur www.louis94.com et validée sur un Xiaomi 13T (Chrome Android)

## Périmètre

Correctifs du seek depuis l'écran verrouillé, construits sur 0.3.0 :

- **0.3.1** : pendant la lecture, le seek déplace directement l'élément `<audio>` déjà autorisé au lieu de passer par le seek HTML5 de Howler, qui met en pause puis relance la lecture. Sur iPhone écran verrouillé, cette relance pouvait être refusée et laisser le player muet et en erreur.
- **0.3.2** : pendant la pause, la cible du seek est seulement mémorisée dans `sound._seek` (champ `pausedSeek` de l'`AudioEngine`). Howler l'applique juste avant `node.play()`. La position affichée (page et écran verrouillé) reste sur la cible pendant la pause.

Cause du blocage corrigé en 0.3.2 : déplacer un `<audio>` en pause fait tomber son `readyState` sous 3. Au moment de la reprise, `Howler.play()` attend alors un `canplaythrough` que Chrome Android n'émet pas pour un média en pause écran verrouillé, et la lecture ne reprend jamais.

Code modifié : `packages/audio-engine/src/AudioEngine.ts` (méthode `seekActiveHtml5Node`). Le détail est dans le changelog de `apps/zydka-plugin/README.md`.

Cette version ne modifie ni Zydka Player Manager, ni Zydka Analytics, ni WooCommerce, ni le thème ou les contenus du site.

## Historique des déploiements

La 0.3.0 n'a jamais été déployée. Avant cette série, la production servait encore le JS 0.2.1 (`?ver=0.2.1`). Le premier test du Xiaomi « en 0.3.1 » tournait donc sur l'ancien code.

Ordre réel en production : 0.2.1 → 0.3.1 → 0.3.2. La 0.3.1 a révélé le blocage du seek en pause, corrigé par la 0.3.2.

## Branches fusionnées

Dans `main`, après `release/zydka-player-0.3.0` :

1. `e0ad125 fix(player): keep lock-screen seek playing` (0.3.1) ;
2. `fix/player-paused-seek`, fusionnée par `112a2c2 Merge branch 'fix/player-paused-seek'` (0.3.2).

## Vérifications locales

- tests `node:test` : 52 réussis, aucun échec (`pnpm test` lance maintenant aussi les tests de `@zydka/audio-engine`) ;
- typecheck du plugin : réussi ;
- `pnpm package:wp` : réussi.

## Validation sur appareil

Xiaomi 13T, Chrome Android, écran verrouillé :

- seek pendant la lecture ;
- seek pendant la pause, puis reprise ;
- pause et lecture ;
- précédent et suivant ;
- cohérence de la position après déverrouillage.

**Non revalidé en 0.3.2 :** iPhone écran verrouillé (cas d'origine du correctif 0.3.1).

## ZIP

- fichier : `dist/zydka-player-0.3.2.zip` ;
- SHA-256 : `3E50BA4A1DF54504DA8AD8588D553F08E0DB49BE46A83B42B50AEA6A4C2E7B85` ;
- JS servi en production : 170 569 octets, SHA-256 `3955520DE0CA692CEEC984A470E03178C4D04B0313C9C4E740B2F3E87B622567`. C'est exactement le fichier `apps/zydka-plugin/assets/js/zydka-player.js` du commit `112a2c2`.

Fichiers livrés, tailles dans le commit `112a2c2` (fins de ligne LF) :

| Fichier | Octets |
|---|---:|
| `zydka-player/zydka-player.php` | 5940 |
| `zydka-player/README.md` | 10720 |
| `zydka-player/assets/css/zydka-player.css` | 26592 |
| `zydka-player/assets/js/zydka-player.js` | 170569 |

Version `0.3.2` dans l'en-tête et dans la constante `ZYDKA_PLAYER_VERSION`. Aucune occurrence de `louis94`, `Demo Track`, `Atelier Zydka` ni `Status: ` dans le bundle JS.

## Déploiement effectué

Procédure détaillée dans `docs/passation-zydka-player-0.3.2.md`. En résumé :

1. sauvegarde du dossier 0.3.1 dans `wp-content/plugin-backups/zydka-player-0.3.1-before-v032-20261021-093450`, puis comparaison des hash ;
2. envoi du ZIP dans `wp-content/plugin-backups/`, puis vérification de son SHA-256 sur le serveur ;
3. `wp plugin install <zip> --force`, puis vérification avec `wp plugin list --name=zydka-player` ;
4. `wp cache flush` ;
5. vérification de `?ver=0.3.2` sur `/demo-track/` et `/test-zydka-player/`, et du hash du JS servi avec `curl --compressed`.

## Retour arrière

- vers 0.3.1 : restaurer `wp-content/plugin-backups/zydka-player-0.3.1-before-v032-20261021-093450`, ou réinstaller `wp-content/plugin-backups/zydka-player-0.3.1.zip` ;
- vers 0.2.1 : restaurer `wp-content/plugin-backups/zydka-player-0.2.1-before-v031-20261021-090820` ;
- puis `wp cache flush` et vérifier que `/demo-track/` charge les ressources avec le `?ver=` attendu.

Un retour en 0.3.1 réintroduit le blocage du seek en pause sur Android. Tout retour arrière en production nécessite l'accord explicite du propriétaire.

## Points ouverts

- iPhone écran verrouillé à revalider en 0.3.2 ;
- `safeRun()` dans `apps/zydka-plugin/src/mediaSession.ts` masque toutes les exceptions. Un journal de diagnostic est reporté au prochain incident concret ;
- anciennes sauvegardes visibles comme extensions inactives dans `wp-content/plugins/` (voir la passation).
