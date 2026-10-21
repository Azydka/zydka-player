# Zydka Player 0.3.0 — préparation de release

Date : 21/10/2026
Statut : ZIP prêt, **non déployé**

## Périmètre

Version de consolidation, construite sur 0.2.1 :

- enchaînement automatique des morceaux et shuffle sans répétition (lot 2) ;
- liens partagés `#track-<id>` qui ouvrent le bon morceau (lot 3) ;
- nettoyage de l'interface : français, plus de ligne « Status », erreurs lisibles, plus de valeurs de démonstration (lot 4).

Le détail est dans le changelog de `apps/zydka-plugin/README.md`.

Cette version ne modifie ni Zydka Player Manager, ni Zydka Analytics, ni WooCommerce, ni le thème ou les contenus du site. L'import du Manager 0.5.0 (lot 1) est une PR séparée, sans effet sur ce ZIP.

## Ordre de fusion

Les branches sont empilées ; les fusionner dans cet ordre :

1. `chore/manager-import-0.5.0` (indépendante) ;
2. `feat/player-auto-advance` ;
3. `feat/player-share-deeplink` ;
4. `fix/player-ui-cleanup` ;
5. `release/zydka-player-0.3.0`.

## Vérifications locales

- tests `node:test` : 49 réussis, aucun échec ;
- typecheck du plugin : réussi ;
- build `tsup` : réussi ;
- comportements vérifiés dans un navigateur local (page de test, morceaux WAV courts) : les quatre modes de répétition et le shuffle, liens partagés avec des id numériques, libellés, morceau en erreur, page sans `src`, affichage desktop 1280 px et mobile 375 px ;
- **non vérifié localement** : syntaxe PHP (`php -l`, PHP absent du poste) et comportement sur un vrai téléphone.

## ZIP

- fichier : `dist/zydka-player-0.3.0.zip` (copie de `dist/zydka-player.zip` produit sur la branche de release) ;
- SHA-256 : `91DEDE2D451ACDEC746164D0285D2687EE04933F889CC20E60B4A7771F7693CD` ;
- contenu :

| Fichier | Octets |
|---|---:|
| `zydka-player/zydka-player.php` | 6141 |
| `zydka-player/README.md` | 10006 |
| `zydka-player/assets/css/zydka-player.css` | 27840 |
| `zydka-player/assets/js/zydka-player.js` | 169441 |

Contrôles sur le ZIP : version `0.3.0` dans l'en-tête et la constante PHP, aucune occurrence de `louis94`, `Demo Track`, `Atelier Zydka` ni `Status: ` dans le bundle.

## Contrôles pré-déploiement (21/10/2026, lecture seule)

Aucun fichier, réglage ni contenu modifié sur Louis94.

**`[zydka_player]` sans `src` : aucun usage trouvé.**

- recherche dans les pages et articles publiés (API REST) : aucun `[zydka_player]` ; `[zydka_playlist]` uniquement sur `/demo-track/` (page 83) et `/test-zydka-player/` (page 12) ;
- recherche dans les produits, blocs réutilisables et contenus du Manager (`zydka_track`, `zydka_catalog`) : aucun résultat ;
- thème actif `louis94-theme` : 16 fichiers lus, aucune référence à Zydka ;
- rendu des 14 URL publiques du sitemap : seules `/demo-track/` et `/test-zydka-player/` affichent un player, et chacun a un `src`.

Contenu brut des deux pages :

- page 83 : `[zydka_playlist id="97"]`, rendu par le Manager ;
- page 12 : une playlist en shortcodes (2 `[zydka_track]`, chacun avec `src`), compatible 0.3.0, suivie de `[zydka_playlist id="76"]`, qui n'affiche rien aux visiteurs dès aujourd'hui (le Manager ne rend rien pour une playlist invalide ou vide). Comportement inchangé par la 0.3.0.

Non couvert : brouillons et contenus privés (non accessibles en lecture seule), widgets (non lisibles sans exécuter de code sur le serveur ; aucun player n'apparaît dans le rendu public).

**`/demo-track/` :**

- HTTP 200, aucun cache de page détecté (pas de purge à prévoir) ;
- ressources `zydka-player.css` et `zydka-player.js` en `?ver=0.2.1`, `front.css` du Manager en `?ver=0.5.0` ;
- player rendu par le Manager : `data-source="manager-playlist"`, playlist 97 ;
- 3 morceaux MP3 (id 90, 88, 92), tous avec cover, aucun `buyUrl` ;
- les 3 fichiers audio répondent en HTTP 200 (`audio/mpeg`, `Accept-Ranges: bytes`) ;
- liens de recette : `/demo-track/#track-90`, `#track-88`, `#track-92`.

## Procédure de déploiement (à valider au moment voulu)

1. Sauvegarder le dossier 0.2.1 dans `wp-content/plugin-backups/zydka-player-0.2.1-before-v030-<date>`, **hors** de `wp-content/plugins/`.
2. Installer le ZIP 0.3.0 et vérifier que `php -l` passe sur `zydka-player.php` avant l'activation.
3. Vérifier que `/demo-track/` répond en HTTP 200 et charge les ressources avec `?ver=0.3.0`.
4. Recette :
   - enchaînement 1 → 2 → 3 puis arrêt (répétition désactivée), boucle (répétition de la file), même morceau (répétition du morceau), shuffle ;
   - lien `/demo-track/#track-<id>` : bon morceau sélectionné, player à l'écran ;
   - partage : texte « Artiste – Titre » et lien `#track-<id>` ;
   - interface en français, pas de ligne « Status » ;
   - **iPhone écran verrouillé** : passage automatique au morceau suivant et commandes de l'écran verrouillé. Si l'enchaînement bloque, le correctif (réutiliser un seul élément audio) part en 0.3.1.
5. Rédiger `docs/zydka-player-0.3.0-production-validation.md`.

## Retour arrière

- restaurer la sauvegarde serveur de l'étape 1, ou réinstaller le ZIP 0.2.1 : `dist/zydka-player.zip`, SHA-256 `1924EDBDA52F8E19C1EB9906805A08507A1817EBAD7288AF6589F80FE1AAEE0E` ;
- vérifier que `/demo-track/` charge de nouveau les ressources avec `?ver=0.2.1`.
