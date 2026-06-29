\# MVP-COM-2D-RUN-CONTROLLED-CHECKOUT — Plan d’exécution verrouillé



Date : 2026-06-29



Statut : `PLAN uniquement - RUN non lance`



\## Objectif



Préparer un checkout WooCommerce contrôlé pour valider le tunnel d’achat numérique du produit test `MVP Test Beat — Mémoire Vive`, sans paiement réel.



Le RUN réel ne pourra être lancé qu’après validation humaine explicite séparée.



\## État de référence



```text

Product ID : 120

Nom : MVP Test Beat — Mémoire Vive

Type : variable

Status initial : draft

Catalog visibility initiale : hidden

Variation test autorisee : 121 Basic — 29 EUR

Gateway test autorisee : cheque

Gateway cheque initiale : disabled

Stripe : interdit

PayPal : interdit

```



\## Objectifs du RUN futur



```text

Produit test accessible uniquement de manière contrôlée.

Variation Basic 121 ajoutable au panier.

Checkout WooCommerce atteignable.

Gateway cheque disponible uniquement si activée temporairement.

Commande test créée au maximum une fois.

Téléchargement numérique associé à la commande test.

Aucun paiement réel.

Rollback complet après test.

```



\## Interdictions du RUN futur



```text

Ne pas tester Standard 122.

Ne pas tester Premium 123.

Ne pas activer Stripe.

Ne pas activer PayPal.

Ne pas lancer de paiement réel.

Ne pas modifier de produit réel.

Ne pas créer plusieurs commandes test.

Ne pas laisser cheque actif après RUN.

Ne pas laisser le produit 120 publié après RUN si publication temporaire nécessaire.

Ne pas supprimer de commande sans validation humaine séparée.

```



\## Préflight serveur obligatoire avant RUN



À exécuter dans Terminal cPanel, depuis :



```bash

cd /home/zivi5632/louis94.com

```



Commandes lecture seule :



```bash

wp core is-installed

wp option get siteurl

wp option get home

wp plugin list --status=active --format=table

wp wc product get 120 --user=1 --format=json

wp wc product\_variation get 120 121 --user=1 --format=json

wp wc payment\_gateway get cheque --user=1 --format=json

wp option get woocommerce\_currency

wp option get woocommerce\_file\_download\_method

wp option get woocommerce\_downloads\_grant\_access\_after\_payment

```



Critères GO :



```text

WP-CLI OK.

siteurl/home = https://www.louis94.com.

WooCommerce actif.

Produit 120 existe.

Produit 120 status draft ou publish.

Produit 120 catalog\_visibility hidden.

Variation 121 existe.

Variation 121 price 29.

Variation 121 virtual true.

Variation 121 downloadable true.

Variation 121 purchasable true.

Gateway cheque existe.

Aucune erreur bloquante.

```



Critères NO-GO :



```text

WP-CLI indisponible.

Produit 120 absent.

Variation 121 absente.

Variation 121 non purchasable.

Fichier téléchargeable manquant.

WooCommerce indisponible.

Erreur PHP/WP bloquante.

Présence d’un état inattendu non documenté.

```



\## Snapshot obligatoire avant modification



Avant toute modification temporaire, capturer :



```bash

wp wc product get 120 --user=1 --format=json > /tmp/mvp-com-2d-product-120-before.json

wp wc product\_variation get 120 121 --user=1 --format=json > /tmp/mvp-com-2d-variation-121-before.json

wp wc payment\_gateway get cheque --user=1 --format=json > /tmp/mvp-com-2d-gateway-cheque-before.json

wp option get woocommerce\_cheque\_settings --format=json > /tmp/mvp-com-2d-cheque-settings-before.json

```



\## Modifications temporaires autorisées pendant RUN



Seulement si nécessaire.



\### 1. Activer temporairement `cheque`



Autorisé uniquement si `cheque enabled` est `false`.



Objectif : permettre un checkout hors paiement réel.



Rollback obligatoire : remettre `cheque` dans son état initial après test.



\### 2. Passer temporairement le produit 120 en `publish + hidden`



Autorisé uniquement si le statut `draft` bloque l’accès panier/checkout.



Objectif : rendre le produit test techniquement achetable sans l’afficher dans le catalogue.



Rollback obligatoire : remettre le produit 120 en `draft + hidden` après test.



\## Variation autorisée



```text

Variation ID : 121

Licence : Basic

Prix : 29 EUR

```



Aucune autre variation ne doit être ajoutée au panier.



\## Point d’arrêt avant commande



Le RUN doit s’arrêter avant clic final de validation commande si une anomalie apparaît :



```text

Montant différent de 29 EUR.

Gateway autre que cheque proposée.

Stripe visible comme option active.

PayPal visible comme option active.

Produit autre que MVP Test Beat — Mémoire Vive dans le panier.

Variation autre que Basic 121 dans le panier.

Frais inattendus non documentés.

Erreur WooCommerce.

```



\## Création commande test



Autorisation maximale :



```text

Une seule commande test.

Gateway : cheque uniquement.

Paiement réel : aucun.

```



Données client à utiliser si nécessaire :



```text

Prénom : Test

Nom : Louis94

Email : test+louis94-mvp-com-2d@atelierzydka.com

Adresse : 1 rue du Test

Code postal : 31000

Ville : Toulouse

Pays : France

```



\## Contrôles après commande test



Après création d’une commande test, relever :



```bash

wp wc shop\_order list --user=1 --format=table

```



Puis identifier la commande test et vérifier :



```bash

wp wc shop\_order get ORDER\_ID --user=1 --format=json

wp db query "SELECT permission\_id, download\_id, product\_id, order\_id, user\_email, downloads\_remaining, access\_granted, access\_expires, download\_count FROM wpcq\_woocommerce\_downloadable\_product\_permissions WHERE order\_id = ORDER\_ID;"

```



Critères attendus :



```text

Commande créée une seule fois.

Produit 120 ou variation 121 liée à la commande.

Gateway cheque.

Aucun paiement réel.

Permission de téléchargement créée si WooCommerce l’accorde avec le statut obtenu.

```



\## Rollback obligatoire



Après RUN, même en cas d’échec :



```text

Remettre cheque dans son état initial.

Remettre produit 120 dans son état initial draft + hidden si modifié.

Vider panier/session navigateur.

Ne pas supprimer la commande test sans validation séparée.

Documenter l’ID de commande test si créée.

```



Contrôles rollback :



```bash

wp wc product get 120 --user=1 --format=json

wp wc payment\_gateway get cheque --user=1 --format=json

```



Résultat attendu rollback :



```text

Produit 120 : draft

Catalog visibility : hidden

Gateway cheque : enabled false

```



\## Décisions finales possibles



```text

MVP-COM-2D-RUN SUCCESS — checkout test hors paiement réel validé.

MVP-COM-2D-RUN PARTIAL — checkout atteint mais commande non créée.

MVP-COM-2D-RUN NO-GO — anomalie avant commande.

MVP-COM-2D-RUN ROLLBACK REQUIRED — rollback non confirmé.

```



\## État de cette mission



```text

Ce document est un plan.

Aucun checkout lancé.

Aucune commande créée.

Aucun paiement effectué.

Aucune modification WooCommerce effectuée.

Aucune gateway modifiée.

Aucun produit modifié.

RUN non lancé.

```



