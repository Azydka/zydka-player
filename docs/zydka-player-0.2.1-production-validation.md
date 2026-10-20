# Zydka Player 0.2.1 — validation de production

Date : 21/10/2026
Statut : déployé et validé sur `https://www.louis94.com/demo-track/`

## Périmètre

La version 0.2.1 corrige la timeline tactile et l'intégration Media Session du player :

- timeline native utilisable au clic, au toucher, au glisser et au clavier ;
- commande `seekto` reliée au même chemin de seek que la timeline ;
- conservation des commandes précédent/suivant sur iOS ;
- synchronisation de la progression lorsque la page est masquée ou verrouillée ;
- retour à la pochette intégrée au MP3 si une URL de pochette échoue ;
- 25 tests unitaires sans nouvelle dépendance.

Cette version ne modifie ni WooCommerce, ni Zydka Analytics, ni Zydka Player Manager, ni le thème ou les contenus du site.

## Vérifications locales

- `pnpm test` : 25 tests réussis, aucun échec ;
- typecheck du plugin : réussi ;
- build `tsup` : réussi ;
- ZIP WordPress : `dist/zydka-player.zip` ;
- SHA-256 du ZIP 0.2.1 : `1924EDBDA52F8E19C1EB9906805A08507A1817EBAD7288AF6589F80FE1AAEE0E`.

Le ZIP contient uniquement le fichier PHP du plugin, son README et les bundles CSS et JavaScript.

## Validation sur Louis94

- Zydka Player 0.2.1 actif ;
- page `/demo-track/` en HTTP 200 ;
- ressources chargées avec `?ver=0.2.1` ;
- trois morceaux disponibles ;
- lecture, pause, précédent, suivant, timeline, file d'attente, volume, muet, repeat, shuffle, partage et pochettes vérifiés ;
- aucun retour arrière nécessaire ;
- validation manuelle sur téléphone confirmée par le propriétaire du site, sans problème constaté.

Le modèle de téléphone et le navigateur exacts n'ont pas été consignés. Le bouton d'achat reste masqué lorsque Player Manager ne fournit aucune URL d'achat ; ce comportement existait déjà en 0.2.0.

Comportement attendu en fin de morceau :

- répétition désactivée : arrêt de la lecture ;
- répétition de la file : passage au morceau suivant ;
- répétition du morceau : redémarrage du même morceau.

## Retour arrière

- sauvegarde serveur : `wp-content/plugin-backups/zydka-player-0.2.0-before-v021-20261020-223609` ;
- sauvegarde locale : `dist/zydka-player-0.2.0-rollback.zip` ;
- SHA-256 de la sauvegarde locale : `940BBF5B696414649C140713FEE9015F3E61DD094B0065088731E17A92E06FFC`.

En cas de régression, restaurer la sauvegarde serveur ou réinstaller le ZIP 0.2.0, puis vérifier que `/demo-track/` charge de nouveau les ressources avec `?ver=0.2.0`.
