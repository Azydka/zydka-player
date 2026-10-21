# Zydka Player Manager 0.5.0 — import dans le dépôt

Date : 21/10/2026
Statut : importé à l'identique depuis la production, aucun déploiement

## Contexte

Zydka Player Manager 0.5.0 est actif sur `https://www.louis94.com` et génère la playlist de `/demo-track/` (`data-source="manager-playlist"`), mais son code n'était versionné nulle part. Cet import rend le plugin reconstructible et permet un retour arrière depuis le dépôt.

Le plugin est placé dans `apps/zydka-player-manager/` **sans aucune modification**. Toute évolution se fera dans une PR séparée.

## Méthode

- source : `wp-content/plugins/zydka-player-manager/` sur Louis94, lu en lecture seule ;
- 17 fichiers, aucun fichier caché, aucun fichier binaire ;
- taille de chaque fichier vérifiée contre celle annoncée par le serveur ;
- seconde lecture indépendante de la production : SHA-256 identiques pour les 17 fichiers ;
- `.gitattributes` : `apps/zydka-player-manager/** -text`, pour que Git ne convertisse jamais les fins de ligne (le dépôt est utilisé avec `core.autocrlf=true`).

## Empreintes de référence

| Fichier | Octets | SHA-256 |
|---|---:|---|
| `README.md` | 6345 | `99ab7a3ff66db162ccefdd40a9307f9cb5d0adfe52075ff260e6ccc1729a1e5a` |
| `assets/css/admin.css` | 6372 | `a8af725a56d0f93b436395be486ba766172323adcec2172f3b31401e64d6cf1a` |
| `assets/css/front.css` | 1097 | `4496722e3759c4cd808b4bbb6899577ebe3ec32555174f5dcc7c0db11aee4667` |
| `assets/js/admin.js` | 12771 | `32aa59b687919a416e36a73352f9b895d9c6fb943e3065f6e42a59b59aec7eb7` |
| `includes/class-admin-columns.php` | 9255 | `1efa98987d632ad541727d421090cadf766bd09bf9b655b12798319fe60e3d17` |
| `includes/class-admin-dashboard.php` | 8635 | `c580e88eda9f98a085033267f47847adb1d9f35b76ee1b4f8dcc375906b9ce64` |
| `includes/class-admin-diagnostic.php` | 10212 | `bb7a64a702bedbf728653570574a9b6dbee78da322e587e547800cddc874645c` |
| `includes/class-admin-library.php` | 23748 | `0e49c8fc3ee6c81fe49c2edd6ce2daf860167d6aad6733bcd92933bc9ce9c9ea` |
| `includes/class-admin-quick-add.php` | 22169 | `a9c10bccf04c05c5743fa522a7f55d79b3a7c061bfdf27d06c27465f1455fa79` |
| `includes/class-admin-shortcodes.php` | 2677 | `2581a43a156315fdde4a8c38340327f5237567ea7c217e4e5b12251787ed5088` |
| `includes/class-meta-boxes.php` | 12940 | `7b253e75ceabae5503f4b4301b731fa75f8de6b684f20bfef3bd93de9f8d3ffb` |
| `includes/class-post-types.php` | 8599 | `232aebecd23a7d5c5c6f966486e7eadfda1462131f48d55e681f6e25183492ca` |
| `includes/class-rest-api.php` | 4719 | `3d6b431102423ba88ed855a774727956ca6a0582a22892722d5b25701d918477` |
| `includes/class-shortcodes.php` | 10068 | `81cefb419e0882823eb298e1e9966f98cd916633490db8cbfa0554284bafdc70` |
| `includes/class-uninstall.php` | 978 | `0a3b9b1a2bee7018bf3076689fb62ca7863e8166eccb6ed2ecfa1062295c18d9` |
| `uninstall.php` | 231 | `0fa5f7a1c8fc138adf86cc4630b7409d365544604c31c4b54596522e755d68b2` |
| `zydka-player-manager.php` | 3819 | `1dfbcd140cdd1311c87fb2fd7febcc6ec1815256393593d7245ae480ac75f21b` |

## Packaging

```bash
pnpm package:wp:manager
```

Le script `scripts/package-zydka-plugin.ps1 -Plugin manager` produit `dist/zydka-player-manager.zip` contenant les 17 fichiers sous `zydka-player-manager/`. Le contenu du ZIP a été contrôlé : 17 fichiers, empreintes identiques au tableau ci-dessus.

`pnpm package:wp` (player, par défaut) garde le même comportement qu'avant.

## Points relevés pour la suite

- le Manager remplace le shortcode `[zydka_playlist]` lorsqu'un `id` est fourni et rend lui-même `#zydka-player-root` ; sans `id`, il délègue au shortcode du player ;
- les morceaux transmis au player contiennent `downloadUrl` mais pas `buyUrl` : le bouton d'achat ne peut pas s'afficher sur les playlists du Manager ;
- la feuille `front.css` est chargée sur toutes les pages publiques ;
- d'anciennes sauvegardes du Manager (0.3.0, 0.4.0, 0.4.1) sont rangées dans `wp-content/plugins/` et apparaissent comme plugins installés inactifs.
