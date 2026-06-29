\# MVP-COM-2D-ADD-TO-CART-DIAGNOSTIC — PASS serveur / front navigateur à éclaircir



Date : 2026-06-29



Statut : `PASS serveur / front navigateur à éclaircir`



\## Résumé



Le jalon `MVP-COM-2D-ADD-TO-CART-DIAGNOSTIC` avait pour objectif de diagnostiquer uniquement l’ajout panier de la variation WooCommerce `121 Basic`, sans checkout, sans commande et sans paiement.



Le diagnostic confirme que l’URL d’ajout panier est correcte et que la variation `121 Basic` est bien ajoutable au panier côté HTTP/cookie lorsque le produit parent `120` est temporairement publié.



Aucune commande n’a été créée. Aucun paiement n’a été lancé. Stripe et PayPal n’ont pas été touchés.



Rollback effectué et confirmé.



\## Contexte



Ce diagnostic fait suite au RUN documenté dans :



```text

docs/mvp-com-2d-run-cpanel-manual-partial-front-nogo.md

```



État Git de référence :



```text

4ef5848 docs(mvp): document cpanel checkout run partial front no-go

```



Conclusion précédente corrigée :



```text

Le RUN navigateur n’a pas permis de confirmer l’ajout panier.

Mais le diagnostic serveur confirme que l’ajout panier fonctionne côté HTTP/cookie.

```



\## Périmètre strict



```text

Diagnostiquer uniquement l’ajout panier variation 121 Basic.

Ne créer aucune commande.

Ne lancer aucun paiement.

Ne pas toucher Stripe.

Ne pas toucher PayPal.

Ne pas tester 122 Standard.

Ne pas tester 123 Premium.

Rollback obligatoire si le produit 120 est temporairement publié.

```



\## État initial sécurisé



Avant diagnostic HTTP :



```text

product\_status=draft

catalog\_visibility=hidden

cheque non touché

commande aucune

paiement aucun

```



\## Inspection des attributs WooCommerce



Produit parent :



```text

product\_id=120

status=draft

type=variable

catalog\_visibility=hidden

```



Attribut parent :



```text

id=0

name=Licence

slug=Licence

variation=true

visible=true

options=Basic|Standard|Premium

```



Métadonnée `\_product\_attributes` :



```text

licence

name=Licence

value=Basic | Standard | Premium

is\_visible=1

is\_variation=1

is\_taxonomy=0

```



Variation `121 Basic` :



```text

variation\_id=121

sku=MVP-MEMOIRE-VIVE-BASIC

price=29

purchasable=true

```



Attribut de variation :



```text

id=0

name=Licence

slug=licence

option=Basic

```



Métadonnée de variation :



```text

attribute\_licence=Basic

```



\## Conclusion sur le paramètre d’attribut



Hypothèse écartée :



```text

attribute\_pa\_licence=basic

```



Conclusion confirmée :



```text

L’attribut n’est pas une taxonomie globale WooCommerce.

L’attribut est un attribut custom produit.

La clé correcte est attribute\_licence.

La valeur correcte est Basic.

```



URL correcte :



```text

https://www.louis94.com/?add-to-cart=120\&variation\_id=121\&attribute\_licence=Basic

```



\## Diagnostic HTTP avec cookie jar



Action temporaire effectuée :



```text

Produit 120 passé temporairement en publish + hidden

```



État temporaire confirmé :



```text

product\_status=publish

catalog\_visibility=hidden

purchasable=true

```



Test HTTP exécuté avec `curl`, cookie jar et suivi des redirections :



```text

https://www.louis94.com/?add-to-cart=120\&variation\_id=121\&attribute\_licence=Basic

```



Signaux HTTP observés :



```text

HTTP/2 200

set-cookie: woocommerce\_items\_in\_cart=1

set-cookie: woocommerce\_cart\_hash=...

set-cookie: wp\_woocommerce\_session\_...

```



Signaux cookie jar observés :



```text

wp\_woocommerce\_session\_...

woocommerce\_cart\_hash

woocommerce\_items\_in\_cart=1

```



Signal body observé :



```text

Mémoire Vive

```



\## Conclusion technique



```text

MVP-COM-2D-ADD-TO-CART-DIAGNOSTIC : PASS serveur / front navigateur à éclaircir

```



Points confirmés :



```text

URL add-to-cart correcte.

attribute\_licence=Basic correct.

Variation 121 Basic ajoutable au panier côté HTTP/cookie.

WooCommerce core OK pour l’ajout panier.

Le produit variable peut générer les cookies panier WooCommerce attendus.

```



Le problème restant n’est donc pas :



```text

un mauvais nom d’attribut ;

une mauvaise valeur de variation ;

une absence de blocs WooCommerce cart/checkout ;

un défaut global WooCommerce core ;

une nécessité d’utiliser attribute\_pa\_licence=basic.

```



\## Hypothèses restantes côté navigateur



```text

Session navigateur déjà connectée/admin avec état panier incohérent.

Fenêtre non privée ou cookies WooCommerce anciens.

Consultation de /cart/ après rollback du produit en draft.

Cache navigateur ou cache front.

Confusion entre page accueil, produit, panier et checkout.

Timing de test trop court avant vérification du panier.

```



\## Rollback effectué



Rollback produit effectué après diagnostic :



```text

Produit 120 remis en draft + hidden

```



Rollback confirmé :



```text

product\_status=draft

catalog\_visibility=hidden

```



\## Actions non effectuées



```text

Aucune commande créée.

Aucun checkout lancé.

Aucun paiement effectué.

Aucun paiement réel.

Gateway cheque non activée pendant ce diagnostic.

Stripe non touché.

PayPal non touché.

Variation 122 Standard non testée.

Variation 123 Premium non testée.

Aucun produit réel modifié.

```



\## État final sécurisé



```text

product\_status=draft

catalog\_visibility=hidden

cheque non touché

commande aucune

paiement aucun

rollback OK

```



\## Décision opérationnelle



Ne pas relancer le checkout immédiatement.



Préparer séparément un mini-RUN navigateur sans checkout :



```text

publish + hidden temporaire produit 120

ouvrir l’URL add-to-cart en navigation privée

vérifier /cart/

rollback immédiat

sans cheque

sans checkout

sans commande

sans paiement

```



\## Prochain jalon recommandé



```text

MVP-COM-2D-BROWSER-CART-MINI-RUN

```



Objectif :



```text

Valider uniquement que la variation 121 Basic apparaît dans le panier navigateur après ouverture de l’URL add-to-cart, sans aller au checkout.

```



Interdictions :



```text

Ne pas activer cheque.

Ne pas aller au checkout.

Ne pas créer de commande.

Ne pas lancer de paiement.

Ne pas toucher Stripe.

Ne pas toucher PayPal.

Ne pas tester Standard 122.

Ne pas tester Premium 123.

Rollback immédiat après observation panier.

```



