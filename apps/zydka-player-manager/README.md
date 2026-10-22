# Zydka Player Manager

Plugin WordPress separe pour gerer le catalogue audio utilise par Zydka Player.

## V0.4 Bibliotheque musicale visuelle

La V0.4 ajoute `Zydka Player > Bibliotheque`, une interface centrale pour gerer les tracks et les playlists sans manipuler les shortcodes au quotidien.

## V0.6 CTA d achat WooCommerce

La V0.6 transforme le produit WooCommerce associe a une track (`_zydka_track_product_id`) en bouton d achat dans le Zydka Player.

Comportement :

- le payload de track (REST et shortcode) ajoute `buyUrl` (permalink du produit) et `buyLabel` (`Voir les licences`) ;
- le CTA n apparait que si WooCommerce est actif et que l ID designe un produit (`product`) au statut `publish` ; un produit masque du catalogue reste accepte ;
- dans tous les autres cas (pas d ID, WooCommerce absent, produit introuvable, variation ou autre type de contenu, brouillon, prive, corbeille, permalink invalide), `buyUrl` et `buyLabel` sont vides et la playlist fonctionne sans CTA ;
- `[zydka_playlist id="123"]` transmet `buyUrl` et `buyLabel` dans `data-tracks`, et ceux de la premiere track dans `data-buy-url` et `data-buy-label` ;
- le fallback HTML affiche un lien `Voir les licences` sous la track concernee ;
- le CTA ouvre la page produit pour choisir la licence : aucun ajout direct au panier ;
- aucune nouvelle meta, option ou table ; les shortcodes manuels du player (`buy_url`, `buy_label`) ne changent pas.

## V0.5 Zydka Player Front Bridge

La V0.5 connecte `[zydka_playlist id="123"]` au vrai Zydka Player front.

Comportement :

- le shortcode avec `id` genere `#zydka-player-root` avec `data-source="manager-playlist"` ;
- les tracks sont injectees dans `data-tracks` avec `id`, `title`, `artist`, `album`, `audioUrl`, `cover`, `downloadUrl`, `type`, `bpm`, `mood` et `style` ;
- le Zydka Player demarre sur la premiere track et charge toute la queue ;
- le rendu HTML natif reste present dans le conteneur comme fallback si le JS du player ne monte pas ;
- le shortcode `[zydka_playlist]` sans `id`, l endpoint REST, WooCommerce et les metas existantes ne changent pas.

## V0.4.1 Compatibilite shortcode legacy

La V0.4.1 enregistre `[zydka_playlist]` tardivement afin que Zydka Player Manager controle le rendu quand un attribut `id` est fourni.

Comportement :

- `[zydka_playlist id="123"]` utilise le rendu Zydka Player Manager ;
- `[zydka_playlist]` sans `id` delegue a l ancien callback si un plugin legacy l avait deja enregistre ;
- le rendu manager affiche cover, titre lisible, artiste, audio HTML natif et fallback audio absent ;
- l endpoint REST et les metas existantes ne changent pas.

Fonctions principales :

- affichage des tracks sous forme de cartes visuelles ;
- statut audio et cover pour chaque track ;
- ajout d une track a une playlist par drag-and-drop ;
- reordonnancement des tracks d une playlist par drag-and-drop ;
- retrait d une track d une playlist ;
- selection de cover via la mediatheque WordPress ;
- selection d audio via la mediatheque WordPress ;
- creation d une playlist depuis la Bibliotheque ;
- previsualisation admin simple avec audio HTML natif ;
- copie du shortcode comme option d integration secondaire.

La V0.4 ne modifie pas WooCommerce, ne cree aucun produit, ne cree pas de paiement, ne cree pas de licences avancees, ne cree pas d analytics, ne modifie pas le player front et conserve le shortcode ainsi que l endpoint REST existants.

## Menu admin

- Zydka Player
- Tableau de bord
- Bibliotheque
- Ajouter rapidement
- Tracks
- Playlists
- Shortcodes
- Diagnostic

## Base de donnees

Le plugin utilise uniquement les tables natives WordPress :

- `wp_posts` pour les CPT `zydka_track` et `zydka_catalog`.
- `wp_postmeta` pour les metadonnees audio et les relations de playlists.
- `wp_options` pour l option `zydka_player_manager_delete_data_on_uninstall`.

## Post meta

Tracks :

- `_zydka_track_artist`
- `_zydka_track_album`
- `_zydka_track_type`
- `_zydka_track_bpm`
- `_zydka_track_key`
- `_zydka_track_mood`
- `_zydka_track_style`
- `_zydka_track_isrc`
- `_zydka_track_audio_url`
- `_zydka_track_cover_url`
- `_zydka_track_download_url`
- `_zydka_track_commercial_status`
- `_zydka_track_product_id`

Playlists :

- `_zydka_catalog_track_ids`
- `_zydka_catalog_public_display`

Aucun nom de meta existant n est modifie en V0.4.

## AJAX admin

Actions securisees par nonce et permissions :

- `zydka_library_add_track`
- `zydka_library_reorder_playlist`
- `zydka_library_remove_track`
- `zydka_library_update_cover`
- `zydka_library_update_audio`
- `zydka_library_create_playlist`

Les covers et audios utilisent la mediatheque WordPress. Les URLs sont enregistrees dans les metas existantes `_zydka_track_cover_url` et `_zydka_track_audio_url`.

## Shortcode

`[zydka_playlist id="123"]`

Le shortcode reste disponible pour l integration externe, mais la gestion quotidienne se fait depuis la Bibliotheque.

## Endpoint REST

`GET /wp-json/zydka-player-manager/v1/playlist/{id}`

## Installation

1. Sauvegarder le dossier plugin actuel.
2. Sauvegarder la base de donnees si possible.
3. Copier `zydka-player-manager` dans `wp-content/plugins/`.
4. Activer le plugin depuis Extensions.
5. Ouvrir `Zydka Player > Tableau de bord`.
6. Ouvrir `Zydka Player > Bibliotheque`.
7. Tester l ajout, le reordonnancement, la cover, l audio et la previsualisation.
8. Verifier `Zydka Player > Diagnostic`.

## Tests fonctionnels V0.4

1. Aller dans `Zydka Player > Bibliotheque`.
2. Verifier que les tracks et playlists apparaissent.
3. Verifier que les covers et statuts Audio/Cover apparaissent.
4. Glisser une track vers une playlist.
5. Verifier qu aucun doublon n est cree si la meme track est deposee deux fois.
6. Reordonner les tracks d une playlist.
7. Recharger la page et verifier que l ordre est conserve.
8. Ajouter ou remplacer une cover depuis la mediatheque.
9. Ajouter ou remplacer un audio depuis la mediatheque.
10. Previsualiser une playlist.
11. Copier le shortcode depuis la Bibliotheque.
12. Verifier que `[zydka_playlist]` fonctionne encore sur le front.
13. Verifier que l endpoint REST renvoie les tracks dans le bon ordre.
14. Verifier que Tableau de bord, Ajouter rapidement, Tracks, Playlists, Shortcodes et Diagnostic fonctionnent encore.

## Tests techniques

Si PHP CLI est disponible :

```bash
find . -name "*.php" -print0 | xargs -0 -n1 php -l
```

Si Git est disponible :

```bash
git diff --check
```

Verifier aussi le contenu du ZIP avant installation :

```bash
tar -tf zydka-player-manager-v04-visual-library.zip
```

Les chemins doivent utiliser `/`.

## Rollback

1. Desactiver la V0.4.
2. Restaurer le dossier plugin V0.3 sauvegarde.
3. Reactiver le plugin.
4. Verifier que les tracks existent toujours.
5. Verifier que les playlists existent toujours.
6. Verifier que les shortcodes fonctionnent toujours.

Aucune donnee n est supprimee automatiquement pendant le rollback.

## Limites V0.4

- Pas d upload massif de dossiers.
- Pas de detection automatique de BPM.
- Pas de lecture automatique des tags ID3.
- Pas d import ZIP intelligent.
- Pas de gestion stems avancee.
- Pas de WooCommerce Bridge.
- Pas de licences.
- Pas de paiement.
- Pas d analytics.
- Pas de Verified Plays.
- Pas de contrats PDF.

## Hooks prevus

- `zydka_player_manager_track_payload`
- `zydka_player_manager_playlist_payload`
- `zydka_player_manager_allowed_track_types`
- `zydka_player_manager_allowed_commercial_statuses`
- `zydka_player_manager_shortcode_output`
