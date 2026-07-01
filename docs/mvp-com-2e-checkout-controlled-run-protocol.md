# MVP-COM-2E-CHECKOUT-CONTROLLED-RUN — Protocole contrôlé

Date : 2026-07-01

Statut : PROTOCOL PREPARED / NOT RUN

## Résumé

Ce document prépare le jalon MVP-COM-2E-CHECKOUT-CONTROLLED-RUN.

Objectif du futur run : vérifier qu’un checkout WooCommerce peut créer une commande test pour le produit MVP Test Beat — Mémoire Vive, variation 121 Basic, sans paiement réel.

Ce document ne lance aucune action serveur.

Aucun checkout n’est lancé par ce document.
Aucune commande n’est créée par ce document.
Aucun paiement n’est effectué par ce document.

## État consolidé avant MVP-COM-2E

Jalons précédents :

- MVP-COM-2D-ADD-TO-CART-DIAGNOSTIC : PASS serveur
- MVP-COM-2D-FRONT-CART-RENDER-DIAGNOSTIC : cause identifiée
- MVP-COM-2D-COMING-SOON-CART-VISIBILITY-MINI-RUN : PASS panier navigateur / rollback OK

Conclusion consolidée :

- Le panier WooCommerce fonctionne côté serveur.
- Le panier WooCommerce fonctionne côté navigateur.
- Le blocage précédent venait du mode WooCommerce Coming Soon.
- Aucun checkout lancé.
- Aucune commande créée.
- Aucun paiement effectué.

Dernier état Git connu :

- ebd9e64 docs(mvp): document coming soon cart visibility mini run
- main aligné avec origin/main
- working tree clean avant préparation du présent protocole

## Produit test

Produit parent :

- ID : 120
- Nom : MVP Test Beat — Mémoire Vive
- Type : variable
- Statut final attendu : draft
- Catalog visibility finale attendue : hidden

Variation autorisée :

- ID : 121
- Licence : Basic
- SKU : MVP-MEMOIRE-VIVE-BASIC
- Prix : 29 €
- Virtual : true
- Downloadable : true
- Purchasable : true

URL add-to-cart validée :

https://www.louis94.com/?add-to-cart=120&variation_id=121&attribute_licence=Basic

Attribut correct :

attribute_licence=Basic

Ne pas utiliser :

attribute_pa_licence=basic

## Périmètre du futur run

Le futur run devra tester uniquement :

- 1 produit
- 1 variation
- 1 panier
- 1 checkout
- 1 commande test maximum
- aucun paiement réel

Variation autorisée :

- 121 Basic uniquement

Variations interdites :

- 122 Standard
- 123 Premium

## Interdictions absolues

- Ne pas toucher Stripe.
- Ne pas toucher PayPal.
- Ne pas lancer de paiement réel.
- Ne pas tester une vraie carte bancaire.
- Ne pas utiliser un moyen de paiement externe.
- Ne pas modifier un produit réel.
- Ne pas tester 122 Standard.
- Ne pas tester 123 Premium.
- Ne pas laisser le produit 120 publié après le run.
- Ne pas laisser woocommerce_coming_soon désactivé après le run.
- Ne pas laisser cheque activé après le run.
- Ne pas créer plusieurs commandes.
- Ne pas relancer le checkout en boucle.

## Changements temporaires prévus pour le futur run

Le futur run nécessitera probablement :

- woocommerce_coming_soon : yes -> no
- product 120 : draft -> publish
- catalog_visibility : hidden maintenu
- cheque : false -> true uniquement si nécessaire

État final obligatoire après rollback :

- product_status=draft
- catalog_visibility=hidden
- cheque_enabled=false
- woocommerce_coming_soon=yes
- woocommerce_store_pages_only=yes

## Préflight obligatoire

Avant toute modification temporaire, vérifier :

- product_status=draft
- catalog_visibility=hidden
- cheque_enabled=false
- woocommerce_coming_soon=yes
- woocommerce_store_pages_only=yes
- cart_page_id=109
- checkout_page_id=110

## Commandes lecture seule prévues côté serveur

À exécuter uniquement dans le Terminal cPanel, jamais dans PowerShell local :

    cd /home/zivi5632/louis94.com

    echo "=== MVP-COM-2E PREFLIGHT — READ ONLY ==="

    php -r '$p=json_decode(shell_exec("wp wc product get 120 --user=1 --format=json"),true); echo "product_status=".$p["status"].PHP_EOL."catalog_visibility=".$p["catalog_visibility"].PHP_EOL."purchasable=".($p["purchasable"]?"true":"false").PHP_EOL;'

    php -r '$v=json_decode(shell_exec("wp wc product_variation get 120 121 --user=1 --format=json"),true); echo "variation_id=".$v["id"].PHP_EOL."sku=".$v["sku"].PHP_EOL."price=".$v["price"].PHP_EOL."purchasable=".($v["purchasable"]?"true":"false").PHP_EOL;'

    php -r '$g=json_decode(shell_exec("wp wc payment_gateway get cheque --user=1 --format=json"),true); echo "cheque_enabled=".($g["enabled"]?"true":"false").PHP_EOL;'

    echo "woocommerce_coming_soon=$(wp option get woocommerce_coming_soon)"
    echo "woocommerce_store_pages_only=$(wp option get woocommerce_store_pages_only)"
    echo "cart_page_id=$(wp option get woocommerce_cart_page_id)"
    echo "checkout_page_id=$(wp option get woocommerce_checkout_page_id)"

## Activation temporaire prévue

À exécuter uniquement quand le run sera explicitement lancé :

    cd /home/zivi5632/louis94.com

    echo "=== MVP-COM-2E TEMP ENABLE CHECKOUT CONDITIONS ==="

    wp option update woocommerce_coming_soon no
    wp wc product update 120 --status=publish --catalog_visibility=hidden --user=1
    wp wc payment_gateway update cheque --enabled=true --user=1

État temporaire attendu :

- product_status=publish
- catalog_visibility=hidden
- cheque_enabled=true
- woocommerce_coming_soon=no
- woocommerce_store_pages_only=yes

## Procédure navigateur future

Fenêtre privée neuve.

Ouvrir :

https://www.louis94.com/?add-to-cart=120&variation_id=121&attribute_licence=Basic

Puis ouvrir :

https://www.louis94.com/cart/

Vérifier :

- MVP Test Beat — Mémoire Vive
- Licence: Basic
- Prix : 29 €
- Quantité : 1

Si la quantité est différente de 1 :

- Ne pas continuer vers checkout.
- Vider ou corriger le panier.
- Repartir d’une fenêtre privée propre.

Puis ouvrir checkout uniquement si le panier est strictement correct :

https://www.louis94.com/checkout/

## Données client test proposées

- Prénom : MVP
- Nom : Test
- Adresse : 1 Rue du Test
- Code postal : 31000
- Ville : Toulouse
- Pays : France
- Email : mvp.checkout.test+louis94@example.com
- Téléphone : 0600000000

Note de commande si disponible :

Commande test MVP-COM-2E — sans paiement réel — à supprimer après validation.

## Paiement autorisé

Seul moyen autorisé :

- Paiement par chèque

Objectif :

- Créer une commande test sans paiement réel.

Aucun paiement carte.
Aucun Stripe.
Aucun PayPal.

## Critères d’arrêt immédiat

Arrêter immédiatement si :

- Stripe apparaît comme option sélectionnée.
- PayPal apparaît comme option sélectionnée.
- Le panier contient une quantité différente de 1.
- Le panier contient un autre produit.
- Le prix n’est pas 29 €.
- Le checkout demande une vraie carte bancaire.
- Le site tente une redirection externe de paiement.
- Une erreur JS bloque le checkout.
- Une commande est créée avant validation finale.
- woocommerce_coming_soon ne peut pas être réactivé.
- cheque ne peut pas être désactivé.

En cas d’arrêt :

- Ne pas insister.
- Ne pas relancer.
- Rollback immédiat.
- Documenter le point d’arrêt.

## Rollback obligatoire

À lancer immédiatement après le test, qu’il soit PASS ou NO-GO :

    cd /home/zivi5632/louis94.com

    echo "=== MVP-COM-2E ROLLBACK ==="

    wp wc product update 120 --status=draft --catalog_visibility=hidden --user=1
    wp option update woocommerce_coming_soon yes
    wp wc payment_gateway update cheque --enabled=false --user=1

    echo "=== VERIFY FINAL SAFE STATE ==="

    php -r '$p=json_decode(shell_exec("wp wc product get 120 --user=1 --format=json"),true); echo "product_status=".$p["status"].PHP_EOL."catalog_visibility=".$p["catalog_visibility"].PHP_EOL;'

    php -r '$g=json_decode(shell_exec("wp wc payment_gateway get cheque --user=1 --format=json"),true); echo "cheque_enabled=".($g["enabled"]?"true":"false").PHP_EOL;'

    echo "woocommerce_coming_soon=$(wp option get woocommerce_coming_soon)"
    echo "woocommerce_store_pages_only=$(wp option get woocommerce_store_pages_only)"

État final obligatoire :

- product_status=draft
- catalog_visibility=hidden
- cheque_enabled=false
- woocommerce_coming_soon=yes
- woocommerce_store_pages_only=yes

## Vérification commande après futur run

Si une commande test est créée, relever uniquement :

- order_id
- order_status
- order_total
- payment_method
- billing_email
- line_item product_id
- line_item variation_id
- line_item total
- download permissions granted ou non

Ne pas créer de seconde commande.

Ne pas tester de paiement réel.

## Traitement ultérieur de la commande test

Après documentation, la commande test devra être traitée dans un jalon séparé :

MVP-COM-2F-TEST-ORDER-CLEANUP

Options possibles :

- annuler la commande
- supprimer définitivement uniquement après décision explicite
- conserver temporairement comme preuve de test

## Sorties attendues du futur run

- PASS checkout contrôlé / commande test créée / rollback OK
- NO-GO checkout / aucune commande / rollback OK
- PARTIAL commande créée mais anomalie / rollback OK / cleanup requis
- ABORTED sécurité / rollback OK

## Décision actuelle

MVP-COM-2E-CHECKOUT-CONTROLLED-RUN : PROTOCOL PREPARED / NOT RUN

Aucune action serveur effectuée dans ce document.

Aucun checkout lancé.

Aucune commande créée.

Aucun paiement effectué.
