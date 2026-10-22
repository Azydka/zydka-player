# MVP-COM-2E PREFLIGHT — READ ONLY (2e passage)

Date : 2026-10-23

Statut : PASS PREFLIGHT READ ONLY

Remplace, pour la décision de run, le préflight du 2026-07-01 (`docs/mvp-com-2e-preflight-readonly-pass.md`).

## Méthode

Contrôles exécutés par Claude via le CLI Novamira (profil `www.louis94.com`, WP-CLI en lecture seule : `wc ... get/list`, `option get`, `post list`, `plugin list`, `db query SELECT`), plus des requêtes HTTP `GET` anonymes sans cookie depuis le poste local.

Aucune commande d'écriture n'a été lancée. Aucun ajout au panier, aucun checkout, aucune commande, aucun paiement.

## Résultats

Produit parent 120 (`MVP Test Beat — Mémoire Vive`) :

- type=variable
- product_status=draft
- catalog_visibility=hidden
- purchasable=true
- price=29
- date_modified=2026-07-01T16:36:57 (inchangé depuis le premier préflight)

Variation 121 Basic :

- variation_id=121, post_parent=120, post_status=publish
- sku=MVP-MEMOIRE-VIVE-BASIC
- price=29, regular_price=29, sale_price vide
- purchasable=true, in_stock=true
- virtual=true, downloadable=true
- attribute Licence=Basic
- 1 téléchargement : `Licence Basic - fichier test`
- date_modified=2026-06-29T11:52:53

Passerelles de paiement :

- cheque_enabled=false
- bacs=false, cod=false
- Seules passerelles enregistrées : `bacs`, `cheque`, `cod`. Aucune extension Stripe, PayPal ou WooPayments n'est installée.

Options WooCommerce :

- woocommerce_coming_soon=yes
- woocommerce_store_pages_only=yes
- cart_page_id=109 (page `cart`, publiée)
- checkout_page_id=110 (page `checkout`, publiée)
- woocommerce_custom_orders_table_enabled=yes (HPOS actif)

Tables critiques (règle `docs/project-rules.md`) : toutes présentes, dont `wpcq_woocommerce_downloadable_product_permissions`, `wpcq_woocommerce_order_items`, `wpcq_woocommerce_order_itemmeta`, `wpcq_woocommerce_payment_tokens(meta)`, `wpcq_woocommerce_tax_rate(s|_locations)`, `wpcq_wc_product_meta_lookup`, `wpcq_wc_order_stats`, `wpcq_wc_order_(product|tax|coupon)_lookup`, `wpcq_wc_customer_lookup`, `wpcq_wc_orders`, `wpcq_wc_orders_meta`, `wpcq_wc_order_addresses`, `wpcq_wc_order_operational_data`, `wpcq_actionscheduler_*`.

Commandes existantes : une seule, `#116`, `completed`, 1,00 €, du 2026-06-28. Toute nouvelle commande du run sera donc identifiable sans ambiguïté.

Extensions actives : novamira 1.12.9, woocommerce 11.2.1, zydka-analytics 0.9.1, zydka-player 0.3.2, zydka-player-manager 0.5.0.

HTTP (anonyme, sans cookie) :

- /cart/ : 200, page Coming Soon servie
- /wp-json/wc/store/v1/cart : 200
- /checkout/ : 302 vers /cart/ (comportement normal avec un panier vide)
- /?p=120 : 404 (normal pour un brouillon)

Le curl local ne supporte pas HTTP/2 : les réponses sont en HTTP/1.1, là où le premier préflight notait HTTP/2. Ce n'est pas un écart côté serveur.

## Écarts avec l'état attendu du protocole

Aucun.

## Décision

MVP-COM-2E PREFLIGHT — READ ONLY : PASS

## État retenu

- Activation temporaire : non lancée
- Product publish temporaire : non lancé
- Cheque activation : non lancée
- Checkout : non lancé
- Commande : aucune nouvelle
- Paiement : aucun

Le run MVP-COM-2E-CHECKOUT-CONTROLLED-RUN n'est pas autorisé par ce préflight. Il attend l'accord explicite du propriétaire.
