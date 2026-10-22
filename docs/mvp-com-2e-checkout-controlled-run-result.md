# MVP-COM-2E-CHECKOUT-CONTROLLED-RUN — Résultat

Date : 2026-10-23 (heure de Paris), soit 2026-10-22 en UTC

Statut : **PASS checkout contrôlé / commande test créée / rollback OK**

Autorisation : accord explicite du propriétaire le 2026-10-23, après le préflight `docs/mvp-com-2e-preflight-readonly-pass-2026-10-23.md` (PASS).

Protocole appliqué : `docs/mvp-com-2e-checkout-controlled-run-protocol.md`.

## Déroulé

Côté serveur : CLI Novamira (WP-CLI). Côté navigateur : navigateur intégré de l'application Claude, session anonyme (pas de barre d'admin, pas de cookie de session WooCommerce, panier vide au départ).

| Heure UTC | Étape |
|---|---|
| 23:09:42 | Revérification de l'état de départ : identique au préflight |
| 23:09:4x | Activation temporaire : `woocommerce_coming_soon=no`, produit 120 `publish` / `hidden`, `cheque` activé |
| ~23:10 | Ajout au panier par l'URL du protocole (`attribute_licence=Basic`) |
| ~23:10 | Panier vérifié via l'API Store : 1 article, variation 121, Licence Basic, quantité 1, 29,00 EUR, seule passerelle proposée `cheque`, pas de livraison |
| ~23:11 | Checkout rempli avec les données test du protocole et la note de commande ; aucune commande en base avant validation |
| 23:12:39 | Clic unique sur « Commander » → page « Commande reçue », commande 127 |
| 23:12:56 | Rollback lancé |

Fenêtre d'exposition (Coming Soon désactivé) : environ 3 minutes 15 secondes.

État temporaire vérifié avant le test : product_status=publish, catalog_visibility=hidden, cheque_enabled=true, woocommerce_coming_soon=no, woocommerce_store_pages_only=yes.

Aucun critère d'arrêt n'a été rencontré : pas de Stripe ni de PayPal (aucune extension installée), pas de demande de carte, pas de redirection externe, pas d'erreur bloquante.

## Commande test

- order_id=127
- order_status=on-hold
- order_total=29.00 EUR
- payment_method=cheque (`Paiements par chèque`)
- created_via=store-api
- customer_id=0 (invité)
- billing_email=mvp.checkout.test+louis94@example.com
- line_item product_id=120, variation_id=121, SKU `MVP-MEMOIRE-VIVE-BASIC`, quantité 1, total 29.00, taxe 0.00
- note client : `Commande test MVP-COM-2E — sans paiement réel — à supprimer après validation.`
- download permissions : **non accordées**. C'est le comportement attendu : `woocommerce_downloads_grant_access_after_payment=yes`, et une commande par chèque reste `on-hold` tant que le paiement n'est pas confirmé.

Une seule commande a été créée : `wpcq_wc_orders` ne contient que 116 et 127.

WooCommerce a envoyé ses e-mails de commande habituels (administrateur, et client à une adresse `example.com` non délivrable).

## Rollback et état final vérifié

- product_status=draft
- catalog_visibility=hidden
- cheque_enabled=false (bacs et cod toujours à false)
- woocommerce_coming_soon=yes
- woocommerce_store_pages_only=yes
- cart_page_id=109, checkout_page_id=110
- Extensions actives inchangées ; aucune extension Stripe ou PayPal.

HTTP anonyme après rollback : /cart/ 200 (Coming Soon), /checkout/ 302 vers /cart/, /wp-json/wc/store/v1/cart 200, /?p=120 404. Identique au préflight.

## Décision

MVP-COM-2E-CHECKOUT-CONTROLLED-RUN : **PASS** — commande test 127 créée, rollback OK.

## Suite

La commande 127 n'a pas été modifiée ni supprimée. Son traitement relève du jalon séparé **MVP-COM-2F-TEST-ORDER-CLEANUP** (annuler, conserver comme preuve, ou supprimer définitivement), sur décision explicite du propriétaire.

Points à valider éventuellement plus tard, hors de ce jalon :

- le passage de la commande en `processing` ou `completed` pour vérifier l'octroi des permissions de téléchargement au client ;
- le contenu des e-mails WooCommerce reçus côté administrateur.
