\# MVP-COM-2D-FRONT-CART-RENDER-DIAGNOSTIC



Date : 2026-07-01



Statut : `READ-ONLY DIAGNOSTIC COMPLETE`



\## Résumé



Le diagnostic confirme que l’ajout panier WooCommerce de la variation `121 Basic` fonctionne côté serveur HTTP/cookies, mais que le rendu navigateur public de `/cart/` est bloqué par le mode WooCommerce Coming Soon.



Cause principale identifiée :



```text

woocommerce\_coming\_soon = yes

woocommerce\_store\_pages\_only = yes

Le HTML public de /cart/ contient le bloc Coming Soon :

woocommerce/coming-soon

woocommerce-coming-soon-store-only

Périmètre

Diagnostic uniquement.

Aucun checkout lancé. Aucune commande créée. Aucun paiement effectué. Stripe, PayPal et cheque non activés.

Contexte confirmé

Produit parent : 120

Variation testée uniquement : 121 Basic

URL add-to-cart correcte :

https://www.louis94.com/?add-to-cart=120\&variation\_id=121\&attribute\_licence=Basic

Points déjà validés :

attribute\_licence=Basic correct

variation 121 Basic ajoutable côté HTTP/cookie

cookies panier WooCommerce créés côté serveur

body add-to-cart contenant Mémoire Vive

Diagnostic front

Le problème navigateur n’est pas causé par :

URL add-to-cart

attribute\_licence=Basic

thème louis94-theme

Store API WooCommerce

WooCommerce core côté serveur

Le thème serveur est cohérent pour WooCommerce :

wp\_head() présent

wp\_footer() présent

the\_content() présent

add\_theme\_support('woocommerce') présent

Cause retenue :

Le panier public est intercepté par WooCommerce Coming Soon / Boutique bientôt disponible.

Fichiers inspectés

docs/mvp-com-2d-run-cpanel-manual-partial-front-nogo.md

docs/mvp-com-2d-add-to-cart-diagnostic.md

docs/mvp-com-2d-browser-cart-mini-run-nogo.md

État sécurisé confirmé

product\_status=draft

catalog\_visibility=hidden

cheque\_enabled=false

woocommerce\_coming\_soon=yes

woocommerce\_store\_pages\_only=yes

commande : aucune

paiement : aucun

Risques

Un futur test panier navigateur nécessitera une désactivation temporaire contrôlée de woocommerce\_coming\_soon.

Ce changement doit être isolé dans un jalon séparé, avec rollback immédiat.

Décision

MVP-COM-2D-FRONT-CART-RENDER-DIAGNOSTIC : READ-ONLY DIAGNOSTIC COMPLETE

Conclusion :

Le panier serveur/cookies fonctionne.

Le rendu navigateur public est bloqué/intercepté par WooCommerce Coming Soon.

Un futur test panier devra désactiver temporairement woocommerce\_coming\_soon, rollback obligatoire, sans cheque, sans checkout, sans commande, sans paiement.

Prochain jalon possible

MVP-COM-2D-COMING-SOON-CART-VISIBILITY-MINI-RUN

Périmètre futur :

désactivation temporaire contrôlée de woocommerce\_coming\_soon

test /cart/

rollback immédiat à yes

sans cheque

sans checkout

sans commande

sans paiement



Conclusion opérationnelle : `NO-GO modification` maintenant, puis `READY FOR SEPARATE COMING SOON CART VISIBILITY MINI-RUN` quand tu veux lancer le prochain jalon.

