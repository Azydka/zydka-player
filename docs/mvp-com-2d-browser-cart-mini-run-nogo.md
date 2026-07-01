\# MVP-COM-2D-BROWSER-CART-MINI-RUN — No-Go navigateur



Date : 2026-07-01



Statut : `NO-GO navigateur / panier non confirmé`



\## Résumé



Le jalon `MVP-COM-2D-BROWSER-CART-MINI-RUN` avait pour objectif de vérifier uniquement, en navigation privée / session propre, que la variation WooCommerce `121 Basic` du produit `120` apparaissait correctement dans `/cart/` après ouverture de l’URL contrôlée d’ajout panier.



Le mini-run devait s’arrêter dès la confirmation ou l’infirmation de la présence de `121 Basic` dans le panier.



Aucun checkout ne devait être lancé. Aucune commande ne devait être créée. Aucun paiement ne devait être effectué.



Le test navigateur n’a pas permis de confirmer visuellement la présence de la variation `121 Basic` dans `/cart/`.



Le produit a été remis en `draft + hidden`.



Rollback confirmé.



\## Contexte documentaire



Ce mini-run fait suite aux jalons documentés suivants :



```text

4ef5848 docs(mvp): document cpanel checkout run partial front no-go

20ceb28 docs(mvp): document add-to-cart diagnostic pass

```



Diagnostic précédent confirmé :



```text

MVP-COM-2D-ADD-TO-CART-DIAGNOSTIC : PASS serveur / front navigateur à éclaircir

```



Conclusion technique déjà acquise :



```text

URL add-to-cart correcte

attribute\_licence=Basic correct

variation 121 Basic ajoutable au panier côté HTTP/cookie

WooCommerce core OK côté serveur

```



\## Périmètre strict du mini-run



```text

Objectif : vérifier uniquement que 121 Basic apparaît dans /cart/

Contexte : navigation privée / session propre

Produit : 120 temporairement publish + hidden si nécessaire

URL : add-to-cart avec attribute\_licence=Basic

Sans cheque

Sans checkout

Sans commande

Sans paiement

Rollback immédiat

```



Interdictions :



```text

Ne pas activer cheque.

Ne pas aller au checkout.

Ne pas créer de commande.

Ne pas lancer de paiement.

Ne pas toucher Stripe.

Ne pas toucher PayPal.

Ne pas tester 122 Standard.

Ne pas tester 123 Premium.

Ne pas laisser le produit 120 publié.

```



\## État initial



Avant mini-run :



```text

product\_status=draft

catalog\_visibility=hidden

cheque\_enabled=false

commande : aucune

paiement : aucun

```



\## Publication temporaire contrôlée



Le produit parent `120` a été temporairement republié pour permettre le test panier navigateur.



Snapshot avant mini-run :



```text

before\_status=draft

before\_catalog\_visibility=hidden

```



Action effectuée :



```text

wp wc product update 120 --status=publish --catalog\_visibility=hidden --user=1

```



État temporaire confirmé :



```text

product\_status=publish

catalog\_visibility=hidden

purchasable=true

```



Vérification gateway :



```text

cheque\_enabled=false

```



Le gateway `cheque` n’a pas été activé pendant ce mini-run.



\## URL navigateur contrôlée



URL utilisée pour le test :



```text

https://www.louis94.com/?add-to-cart=120\&variation\_id=121\&attribute\_licence=Basic

```



Panier à vérifier ensuite :



```text

https://www.louis94.com/cart/

```



Ordre attendu :



```text

1\. Ouvrir l’URL add-to-cart dans une fenêtre privée.

2\. Aller ensuite sur /cart/.

3\. Vérifier uniquement la présence de MVP Test Beat — Mémoire Vive / Basic / 29 € / quantité 1.

4\. Stop immédiat.

5\. Ne pas aller au checkout.

6\. Rollback immédiat.

```



\## Résultat navigateur



Résultat déclaré :



```text

ça ne marche pas

```



Le mini-run navigateur n’a donc pas permis de confirmer visuellement que la variation `121 Basic` apparaissait dans `/cart/`.



Aucun checkout n’a été lancé.



Aucune commande n’a été créée.



Aucun paiement n’a été effectué.



\## Rappel du diagnostic serveur positif



Le diagnostic serveur précédent reste valide.



Signaux HTTP/cookie observés lors du diagnostic add-to-cart :



```text

HTTP/2 200

set-cookie: woocommerce\_items\_in\_cart=1

set-cookie: woocommerce\_cart\_hash=...

set-cookie: wp\_woocommerce\_session\_...

```



Signaux cookie jar :



```text

wp\_woocommerce\_session\_...

woocommerce\_cart\_hash

woocommerce\_items\_in\_cart=1

```



Signal body :



```text

Mémoire Vive

```



Conclusion serveur maintenue :



```text

L’URL add-to-cart fonctionne côté HTTP/cookie.

La variation 121 Basic est ajoutable côté serveur.

Le problème restant concerne le contexte navigateur/front/session/cache/rendu panier.

```



\## Rollback effectué



Rollback immédiat après échec navigateur :



```text

wp wc product update 120 --status=draft --catalog\_visibility=hidden --user=1

```



Rollback confirmé :



```text

product\_status=draft

catalog\_visibility=hidden

cheque\_enabled=false

```



\## Actions non effectuées



```text

Aucun checkout lancé.

Aucune commande créée.

Aucun paiement effectué.

Aucun paiement réel.

Gateway cheque non activée.

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

cheque\_enabled=false

commande : aucune

paiement : aucun

rollback : OK

```



\## Décision finale



```text

MVP-COM-2D-BROWSER-CART-MINI-RUN : NO-GO navigateur / panier non confirmé

```



Synthèse :



```text

Add-to-cart serveur : PASS

Add-to-cart navigateur : non confirmé

Cart browser mini-run : NO-GO

Checkout : non lancé

Commande : aucune

Paiement : aucun

Rollback : OK

```



\## Hypothèses restantes



Le problème restant semble se situer côté front navigateur ou rendu panier :



```text

session navigateur ;

cookies WooCommerce ;

cache navigateur ;

cache front ;

timing entre publication temporaire et rollback ;

rendu WooCommerce Blocks ;

scripts WooCommerce Blocks ;

intégration du thème louis94-theme ;

contexte connecté/admin vs navigation privée ;

mauvaise manipulation navigateur possible entre URL add-to-cart et /cart/.

```



\## Prochain jalon recommandé



```text

MVP-COM-2D-FRONT-CART-RENDER-DIAGNOSTIC

```



Objectif :



```text

Diagnostiquer le rendu front du panier WooCommerce, les scripts WooCommerce Blocks, les cookies navigateur et le comportement de /cart/ après add-to-cart, sans checkout, sans commande et sans paiement.

```



Périmètre recommandé :



```text

Lecture seule autant que possible.

Si publication temporaire nécessaire : product 120 publish + hidden uniquement.

Rollback obligatoire.

cheque doit rester disabled.

Ne pas aller au checkout.

Ne pas créer de commande.

Ne lancer aucun paiement.

```



