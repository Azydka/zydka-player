# Passation — Zydka Player Manager 0.6.0 (CTA d'achat WooCommerce)

Date : 23/10/2026
Statut : **déployé le 23/10/2026** sur www.louis94.com, après accord explicite du propriétaire (voir « Déploiement du 23/10/2026 »). Le Player reste en 0.3.2.

## État du dépôt

- Départ : `main` = `origin/main` = `2a6d3ea`, dépôt propre, aucun stash, un seul worktree.
- Branche de travail : `feat/manager-woocommerce-buy-cta`, fusionnée dans `main` avec `--no-ff` puis supprimée.
- Commits :
  - `5a98053 feat(manager): expose WooCommerce product links to player`
  - commit de documentation de cette passation (`docs(manager): document 0.6.0 commerce CTA bridge`)

## Fichiers modifiés

- `apps/zydka-player-manager/includes/class-rest-api.php`
- `apps/zydka-player-manager/includes/class-shortcodes.php`
- `apps/zydka-player-manager/zydka-player-manager.php` (version 0.6.0, en-tête et constante)
- `apps/zydka-player-manager/README.md` (section V0.6)
- `docs/passation-zydka-player-manager-0.6.0.md`

Les fins de ligne du Manager (LF, copie de la production) sont conservées. Rien n'a changé dans `apps/zydka-plugin/` ni dans `packages/`.

## Comportement ajouté

`productId` → `buyUrl`, en un seul endroit partagé :

1. `Zydka_Player_Manager_REST_API::get_track_payload()` lit `_zydka_track_product_id` (méta existante).
2. `get_product_buy_url()` renvoie le permalink seulement si :
   - l'ID est supérieur à 0 ;
   - `wc_get_product()` existe (WooCommerce actif) ;
   - le contenu est de type `product` (une variation ou un autre type de contenu est refusé) ;
   - `wc_get_product()` renvoie un `WC_Product` au statut `publish` ;
   - le permalink reste une URL `http`/`https` valide après `esc_url_raw()`.
   La visibilité catalogue est volontairement ignorée : un produit publié mais masqué garde son lien direct.
3. Le payload ajoute `buyUrl` et `buyLabel` (`Voir les licences`, traduisible). Les deux sont vides sinon. Le filtre `zydka_player_manager_track_payload` s'applique après et peut toujours les surcharger.
4. `get_player_tracks()` (shortcode) recopie `buyUrl` (`esc_url_raw`, http/https) et `buyLabel` (`sanitize_text_field`). Les valeurs vides sont retirées par le `array_filter` existant.
5. `render_player_container()` ajoute `data-buy-url` et `data-buy-label` de la première track. `get_html_attributes()` omet les attributs vides.
6. Le fallback HTML sans JS affiche un lien `<a class="zydka-manager-track-buy">` sous l'audio natif de la track concernée.

Côté Player 0.3.2, rien à changer : `normalizeTrack()` lit déjà `buyUrl`/`buyLabel` dans chaque entrée de `data-tracks`, et le CTA est recalculé à partir de la track active (Previous, Next, Queue, sélection). Les shortcodes manuels (`buy_url`, `buy_label`, libellé par défaut `Voir le projet`) ne passent pas par le Manager et restent inchangés.

L'endpoint REST `GET /wp-json/zydka-player-manager/v1/playlist/{id}` gagne deux champs par track (`buyUrl`, `buyLabel`). C'est un ajout : aucun champ existant ne change.

### CTA volontairement masqué

`productId` absent ou 0 ; WooCommerce absent ou désactivé ; `wc_get_product` indisponible ; produit introuvable ; ID d'une variation, d'une page, d'un article ou d'une track ; produit `draft`, `pending`, `private`, `future` ou `trash` ; permalink vide ou non http(s). Dans tous ces cas la playlist s'affiche et se lit normalement, sans CTA.

## Tests et validations

| Commande | Résultat |
|---|---|
| `pnpm test` | OK : audio-engine 3/3, zydka-plugin 49/49 |
| `pnpm --filter @zydka/zydka-plugin typecheck` | OK |
| `pnpm package:wp` | OK (voir contrôle des artefacts Player) |
| `pnpm package:wp:manager` | OK |
| `git diff --check` | OK |
| `php -l` | **non exécuté** : PHP CLI absent de la machine |

Aucun framework de test PHP n'existe pour le Manager et PHP n'est pas installé localement : pas de test automatisé PHP ajouté (cela aurait demandé PHP + stubs WordPress/WooCommerce). Vérifications faites à la place, par relecture du diff et traçage des appels :

- `get_track_payload()` n'est appelée que par `get_playlist_payload()`, elle-même utilisée par l'endpoint REST et par `[zydka_playlist id]` ; `get_player_tracks()` n'est appelée que par `playlist_shortcode()`. Aucun autre consommateur de `productId` (l'admin lit la méta directement pour la colonne « Produit associé »).
- Track sans produit, produit inexistant, WooCommerce absent, produit non publié : `get_product_buy_url()` sort avant tout appel WooCommerce ou renvoie `''` ; `buyUrl`/`buyLabel` vides, retirés de `data-tracks`, attributs `data-buy-*` omis, pas de lien dans le fallback.
- Produit publié : `buyUrl` = `get_permalink()` du produit, `buyLabel` = `Voir les licences`.
- Deux tracks liées à deux produits : chaque entrée de `data-tracks` porte son propre `buyUrl`, et le Player affiche celui de la track active.
- Shortcodes manuels : code du Player et `[zydka_playlist]` sans `id` non modifiés.
- Playlists Manager existantes : seuls deux champs optionnels sont ajoutés ; `downloadUrl`, covers, audio et ordre inchangés.

## ZIP Manager

- Chemin : `dist/zydka-player-manager.zip`, copie identique `dist/zydka-player-manager-0.6.0.zip`.
- SHA-256 : `4AF1A9E0346A310BC569B28672137266E508FAF86FC636CE712F68DBF3843606`.
- Racine unique `zydka-player-manager/`, 17 fichiers (les mêmes qu'en 0.5.0), aucun fichier de développement.
- Chaque fichier du ZIP a la même empreinte que sa source dans `apps/zydka-player-manager/`.
- `zydka-player-manager.php` du ZIP : `Version: 0.6.0` et `ZYDKA_PLAYER_MANAGER_VERSION` = `0.6.0`.
- `dist/` est ignoré par Git : le ZIP n'est pas versionné.

## Player 0.3.2 non modifié

- `pnpm package:wp` a réécrit `assets/js/zydka-player.js` en LF : contenu identique (SHA-256 sans CR `3955520D…2567`, celui de la 0.3.2). La copie de travail a été remise à l'état du dépôt.
- Le `dist/zydka-player.zip` reconstruit ne différait de la 0.3.2 que par les fins de ligne CRLF de `zydka-player.php` (copie de travail en `core.autocrlf=true`). Il a été remplacé par `dist/zydka-player-0.3.2.zip` ; SHA-256 de nouveau `3E50BA4A…7B85`.
- Aucun artefact Player n'est dans la branche.

## Avant le déploiement

Lors du développement, rien n'a été envoyé ni modifié sur www.louis94.com, ni dans WooCommerce. Le déploiement n'a touché que le dossier du Manager (et `plugin-backups/`) : Le produit test 120 reste en `draft`/`hidden`, le mode Coming Soon et les passerelles sont inchangés.

## Validation WordPress proposée (à faire plus tard, avec accord)

**Toute intervention en production demande un accord explicite du propriétaire, à chaque fois.** De préférence, valider d'abord sur un site de test.

1. Sauvegarder `wp-content/plugins/zydka-player-manager` vers `wp-content/plugin-backups/zydka-player-manager-0.5.0-before-v060-<date UTC>` et comparer les hash.
2. Envoyer le ZIP, vérifier son SHA-256, puis `wp plugin install <zip> --force` ; vérifier `wp plugin list --name=zydka-player-manager` (0.6.0) ; `wp cache flush`.
3. Lecture seule : `wp eval 'echo Zydka_Player_Manager_REST_API::get_product_buy_url( <id> );'` sur un produit publié (URL attendue), un produit brouillon (vide) et un ID non produit (vide).
4. Sur une page `[zydka_playlist id="…"]` dont une track est liée à un produit publié : bouton `Voir les licences` visible, lien vers la page produit, mis à jour par Previous/Next/Queue ; tracks sans produit : pas de bouton.
5. Vérifier lecture, pause, seek, Repeat, Shuffle, covers, `downloadUrl`, l'endpoint REST et `[zydka_playlist]` sans `id`.
6. Point d'attention : le produit test 120 est en `draft`, donc aucun CTA n'apparaîtra pour lui tant qu'il n'est pas publié (publication hors périmètre).
7. Rollback : réinstaller la sauvegarde 0.5.0. Aucune donnée n'est créée par la 0.6.0.

## Déploiement du 23/10/2026 (accord explicite du propriétaire)

Fait par le CLI Novamira (profil `www.louis94.com`), selon la procédure ci-dessus :

1. Préflight : Manager 0.5.0 actif dans `wp-content/plugins/zydka-player-manager`, 17 fichiers identiques à l'import du dépôt.
2. Sauvegarde : `wp-content/plugin-backups/zydka-player-manager-0.5.0-before-v060-20261023-000453`, 17/17 fichiers identiques à la source.
3. ZIP envoyé dans `wp-content/plugin-backups/zydka-player-manager-0.6.0.zip` : 39 768 octets, SHA-256 serveur `4AF1A9E0…3606`, identique au local.
4. `wp plugin install … --force` : succès ; `zydka-player-manager` actif en **0.6.0**. `wp cache flush` fait.
5. Contrôles en lecture seule :
   - les 17 fichiers installés ont les mêmes empreintes que `apps/zydka-player-manager/` sur `main` ; PHP les charge sans erreur (`wp eval`) ;
   - `get_product_buy_url()` : produit 115 publié → son permalink ; produit 120 `draft` → vide ; variations 121–123 → vide ; ID 0, ID inexistant, page 111 → vide ;
   - les tracks 88, 90 et 92 n'ont aucun produit lié : `buyUrl` et `buyLabel` vides, donc aucun CTA ;
   - `/demo-track/` : HTTP 200, `data-source="manager-playlist"` (playlist 97), `front.css?ver=0.6.0`, `zydka-player.js?ver=0.3.2`, aucun `data-buy-url` ;
   - `/test-zydka-player/` (shortcode manuel) : HTTP 200, `data-buy-url` manuel toujours présent ;
   - REST `playlist/97` : 3 tracks, `buyUrl`/`buyLabel` vides ; `playlist/76` répond 403 « Playlist non publique », comme avant.

Le bouton `Voir les licences` n'était pas vérifié à ce stade : il l'a été ensuite par le test temporaire ci-dessous.

Rollback : `wp plugin install` depuis une archive de la sauvegarde ci-dessus, ou recopie du dossier sauvegardé, puis `wp cache flush`.

## Validation fonctionnelle du CTA (23/10/2026, accord explicite du propriétaire)

Test temporaire en production : la track 88 a été liée au produit 115, puis restaurée. Aucune autre modification en production.

Préflight (lecture seule) :

- Manager 0.6.0 et Player 0.3.2 actifs ; WooCommerce 11.2.1 actif ; pas de cache objet externe.
- Playlist 97 (« Test 1 », publiée, page `/demo-track/`) : tracks 90, 88, 92 dans cet ordre, toutes publiées. Aucune n'avait de méta `_zydka_track_product_id` (ligne absente, pas `0`) ; aucune track du site n'avait de valeur non nulle.
- Produit 115 « Louis94 Test Download — MVP » : `product` / `simple`, `publish`, visibilité `visible`, achetable ; permalink `https://www.louis94.com/product/louis94-test-download-mvp/`.
- Track 88 choisie : elle n'appartient qu'à la playlist 97 (la 90 est aussi dans la 76) et sa position centrale permet de vérifier l'apparition et la disparition du CTA dans les deux sens.

Déroulé :

1. Sauvegarde de l'état de la track 88 (méta absente, 0 ligne en base, `post_modified_gmt` `2026-06-26 12:15:54`, 8 clés de méta, payload REST complet) dans un fichier local hors dépôt.
2. `wp post meta add 88 _zydka_track_product_id 115` (meta_id 330), puis `wp cache flush`.
3. Contrôles avec la liaison :
   - REST `playlist/97` : la track 88 porte `productId` 115, `buyUrl` = permalink du produit, `buyLabel` `Voir les licences` ; 90 et 92 restent vides ;
   - `/demo-track/` (HTML) : seule l'entrée 88 de `data-tracks` porte `buyUrl`/`buyLabel` ; lien de fallback `<a class="zydka-manager-track-buy">Voir les licences</a>` présent ; pas de `data-buy-url` sur le conteneur, car la première track n'est pas liée (comportement prévu) ; `front.css?ver=0.6.0`, `zydka-player.js?ver=0.3.2` ;
   - navigateur, desktop : bouton `Voir les licences` visible sur la track 88 uniquement, `href` vers le produit, `target="_blank"`, `rel="noopener noreferrer"`. Il suit la track active : Next 90→88 (apparaît), Next 88→92 (disparaît), Previous 92→88 (réapparaît), Previous 88→90 (disparaît) ; sélection directe dans la liste « À suivre » 92 (absent), 88 (présent), 90 (absent) ;
   - navigateur, mobile 375 px : bouton « À suivre (3) », sélection de la 88 dans le panneau de file → bouton visible avec le bon lien ;
   - page produit : HTTP 200 ;
   - non-régression : `/test-zydka-player/` garde son CTA manuel (`Voir le projet`, `https://www.louis94.com/`) ; `playlist/76` répond toujours 403.
4. Restauration : `wp post meta delete 88 _zydka_track_product_id`, puis `wp cache flush`.
5. Relecture après restauration : méta absente, 0 ligne en base, aucune liaison produit sur le site, `post_modified_gmt` inchangé, mêmes 8 clés de méta, payload REST identique à la sauvegarde. REST `playlist/97` revenu à trois `buyUrl` vides ; `/demo-track/` sans aucune trace de `buy`.

Résultat : CTA validé en conditions réelles. L'état de production est identique à celui d'avant le test.

## Reste / décisions

- Lier durablement des tracks à leurs produits quand le catalogue commercial sera prêt (modification de données, à autoriser).
- Optionnel : styler `.zydka-manager-track-buy` dans `front.css` (le lien du fallback utilise le style par défaut du thème).
