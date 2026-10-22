# MVP-COM-2F-TEST-ORDER-CLEANUP — Annulation de la commande test 127

Date : 2026-10-23

Statut : **PASS — commande 127 annulée, conservée**

Décision du propriétaire : annuler la commande test 127 (statut `cancelled`), **sans suppression**. Exécution autorisée explicitement par le propriétaire le 2026-10-23.

## Contexte

La commande 127 a été créée par le run MVP-COM-2E (`docs/mvp-com-2e-checkout-controlled-run-result.md`). C'est une commande test, sans paiement réel.

## Préflight lecture seule (2026-10-22 23:18 UTC)

Fait par le CLI Novamira, uniquement en lecture.

Commande 127 :

- status=on-hold
- total=29.00 EUR, payment_method=cheque, date_paid=null
- customer_id=0 (invité), billing_email=mvp.checkout.test+louis94@example.com
- date_created=2026-10-22T23:12:39, date_modified=2026-10-22T23:12:40
- notes : passage `pending` → `on-hold` ; e-mails « Nouvelle commande » et « Commande en attente » envoyés

Effets de bord possibles :

- permissions de téléchargement pour 127 : 0, donc rien à révoquer ;
- variation 121 : `manage_stock=false`, donc aucun mouvement de stock ;
- `wpcq_wc_order_stats` et `wpcq_wc_order_product_lookup` : pas encore de ligne pour 127 ;
- aucune action planifiée en attente pour 127 ;
- e-mails : aucun réglage enregistré, donc réglages par défaut. L'e-mail « Commande annulée » est envoyé **à l'administrateur** lors d'un passage `on-hold` → `cancelled`. Aucun e-mail n'est envoyé au client.

Commandes en base : 116 (`completed`, non concernée) et 127 (`on-hold`).

État de la boutique, inchangé depuis le rollback 2E : produit 120 `draft` / `hidden`, `woocommerce_coming_soon=yes`.

Conclusion du préflight : **PASS**. Aucun écart.

## Action prévue (après accord explicite seulement)

Pas de sauvegarde SQL dédiée : le seul changement est le statut d'une commande test, et il est réversible par le rollback ci-dessous.

    wp wc shop_order get 127 --user=1 --fields=id,status --format=json   # doit répondre on-hold
    wp wc shop_order update 127 --status=cancelled --user=1 --porcelain

Arrêt immédiat si :

- la commande n'est plus `on-hold` au moment de l'exécution ;
- une autre commande que 127 est visée ;
- la commande ressort dans un statut autre que `cancelled`.

Interdit : `wp wc shop_order delete`, `--force`, la corbeille, toute modification de la commande 116 ou du produit 120.

## Vérification prévue

- 127 : `status=cancelled`, total 29.00 inchangé, une note « État de la commande modifié de En attente à Annulée »
- 127 toujours présente dans `wpcq_wc_orders` ; aucune autre commande modifiée (116 toujours `completed`)
- permissions de téléchargement pour 127 : toujours 0
- produit 120 toujours `draft` / `hidden`, `woocommerce_coming_soon=yes`

## Rollback

En cas de mauvais résultat :

    wp wc shop_order update 127 --status=on-hold --user=1

L'e-mail « Commande annulée » envoyé à l'administrateur ne peut pas être rappelé.

## Sorties possibles

- PASS : 127 `cancelled`, conservée, vérifications OK
- NO-GO : écart au préflight d'exécution, rien modifié
- ROLLBACK : statut inattendu, remis à `on-hold`

## Exécution (2026-10-22 23:20 UTC)

- 23:20:37 : revérification, 127 `on-hold`
- 23:20:57 : `wp wc shop_order update 127 --status=cancelled --user=1` → `127`

## Vérification

- 127 : `status=cancelled`, total 29.00 inchangé, date_modified 2026-10-22T23:20:57
- notes ajoutées : « État de la commande modifié de En attente à Annulée. » et « E-mail « Commande annulée » envoyé. » (à l'administrateur)
- `wpcq_wc_orders` : 116 `wc-completed` (inchangée), 127 `wc-cancelled`, toujours présente
- permissions de téléchargement pour 127 : 0
- produit 120 `draft` / `hidden`, `woocommerce_coming_soon=yes`, passerelles `bacs`, `cheque`, `cod` désactivées

Rollback : non nécessaire.

## Décision

MVP-COM-2F-TEST-ORDER-CLEANUP : **PASS**. La commande 127 est annulée et conservée comme trace du test. Sa suppression définitive demanderait une nouvelle décision explicite.
