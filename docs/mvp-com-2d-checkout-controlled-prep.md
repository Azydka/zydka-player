# MVP-COM-2D-PREP - Preparation test checkout controle WooCommerce

Date : 2026-06-29

## Statut

Statut : `preparation uniquement - MVP-COM-2D-RUN non lance`

Decision :

```text
MVP-COM-2D-PREP documente uniquement un futur test checkout controle.
Aucun checkout ne doit etre lance pendant cette mission.
Aucune commande ne doit etre creee.
Aucun paiement ne doit etre effectue.
Aucune gateway ne doit etre activee, desactivee ou modifiee.
Aucune modification serveur ne doit etre executee.
```

## Point de depart

Depot Git :

```text
main propre et synchronise
Dernier commit confirme : ca82e0a docs(mvp): prepare controlled checkout test protocol
```

Produit test issu de MVP-COM-2C-RUN :

```text
Produit parent : 120
Nom : MVP Test Beat - Memoire Vive
Type : variable
Statut : draft
Visibilite catalogue : hidden
```

Variations :

| Licence  | ID variation | SKU                       | Prix |
| -------- | -----------: | ------------------------- | ---: |
| Basic    |          121 | MVP-MEMOIRE-VIVE-BASIC    |   29 |
| Standard |          122 | MVP-MEMOIRE-VIVE-STANDARD |   99 |
| Premium  |          123 | MVP-MEMOIRE-VIVE-PREMIUM  |  299 |

Fichiers test :

```text
wp-content/uploads/woocommerce_uploads/louis94-memoire-vive-basic-test.txt
wp-content/uploads/woocommerce_uploads/louis94-memoire-vive-standard-test.txt
wp-content/uploads/woocommerce_uploads/louis94-memoire-vive-premium-test.txt
```

Regles de telechargement :

```text
Limite telechargement : 5
Expiration telechargement : 30 jours
```

## Objectif du futur MVP-COM-2D-RUN

Le futur RUN aura pour objectif de verifier le tunnel WooCommerce minimal pour un produit variable numerique :

* selection d'une variation ;
* ajout au panier ;
* checkout controle ;
* creation d'une commande test ;
* passage controle de la commande dans un etat permettant les permissions de telechargement ;
* verification des permissions de telechargement ;
* verification de la disponibilite du fichier test associe ;
* rollback ou remise en etat apres test.

Ce document ne lance pas ce RUN. Il prepare uniquement le protocole.

## Perimetre de MVP-COM-2D-PREP

Actions autorisees pendant PREP :

* creer ce fichier documentaire ;
* decrire les pre-requis ;
* decrire les risques ;
* decrire les commandes de verification futures ;
* decrire le rollback ;
* definir les criteres Go / No-Go ;
* definir les criteres de succes ;
* definir les criteres d'arret immediat.

Actions interdites pendant PREP :

* ne pas lancer de checkout ;
* ne pas creer de commande ;
* ne pas effectuer de paiement ;
* ne pas activer de gateway ;
* ne pas desactiver de gateway ;
* ne pas modifier de gateway ;
* ne pas modifier les reglages WooCommerce ;
* ne pas publier le produit ;
* ne pas changer le statut du produit ;
* ne pas modifier les variations ;
* ne pas modifier les fichiers telechargeables ;
* ne pas executer de commande serveur ;
* ne pas passer en MVP-COM-2D-RUN.

## Risques identifies

### Risque gateway

Le test checkout peut necessiter une gateway temporaire. Toute activation de gateway est une modification WooCommerce sensible.

Decision PREP :

```text
Aucune gateway ne doit etre modifiee pendant MVP-COM-2D-PREP.
```

### Risque commande reelle

Un checkout peut creer une commande visible dans WooCommerce et potentiellement generer des emails.

Decision PREP :

```text
Aucune commande ne doit etre creee pendant MVP-COM-2D-PREP.
```

### Risque paiement

Stripe, PayPal ou toute gateway live ne doivent pas etre utilises sans decision explicite.

Decision PREP :

```text
Aucun paiement live.
Aucun paiement test.
Aucune tentative Stripe.
Aucune tentative PayPal.
```

### Risque produit public

Le produit test est actuellement en `draft` et `hidden`. Le rendre public pourrait exposer un produit de test.

Point de vigilance : un produit `draft` peut ne pas etre achetable par le tunnel public WooCommerce.

Avant tout RUN futur, la strategie exacte devra etre decidee explicitement :

* conserver `draft` et utiliser uniquement un mecanisme compatible ;
* ou passer temporairement en `publish` avec visibilite catalogue `hidden` ;
* ou choisir un autre mecanisme de test documente avant action.

Aucune de ces options ne peut etre appliquee pendant PREP.

No-Go immediat si le produit reste `draft` alors que le scenario suppose un checkout public.

No-Go immediat si la strategie `draft` / `hidden` / etat testable n'est pas decidee avant RUN.

Decision PREP :

```text
Ne pas publier le produit.
Ne pas changer la visibilite catalogue.
Ne pas changer le statut draft.
```

### Risque permissions telechargement

Les permissions de telechargement ne doivent etre creees que dans un RUN controle, apres commande test clairement identifiee.

Decision PREP :

```text
Ne pas creer de permission de telechargement pendant PREP.
```

### Risque tables critiques WooCommerce

Le projet a deja documente un incident ou le tunnel public WooCommerce repondait alors qu'une table critique de permissions de telechargement etait absente.

Decision PREP :

```text
Ne pas considerer WooCommerce comme valide seulement parce que le plugin est actif ou que le checkout repond.
Les tables critiques devront etre confirmees au debut d'un RUN futur.
```

## Pre-requis Go / No-Go pour un futur RUN

### Go possible seulement si

* le depot Git est propre ;
* la documentation PREP est commitee ;
* le dernier commit de reference est `ca82e0a docs(mvp): prepare controlled checkout test protocol` ;
* le produit `120` existe toujours ;
* le produit `120` est toujours de type `variable` ;
* les variations `121`, `122`, `123` existent toujours ;
* les SKU des variations correspondent toujours au protocole ;
* les prix des variations sont toujours `29`, `99`, `299` ;
* les fichiers test sont toujours associes aux variations ;
* les limites de telechargement sont toujours `5` ;
* l'expiration est toujours `30` jours ;
* les tables critiques WooCommerce ont ete verifiees selon `docs/project-rules.md` ;
* les gateways ont ete lues avant RUN ;
* la gateway de test a ete choisie explicitement ;
* le mode exact de la gateway de test est documente avant action ;
* Stripe et PayPal ne sont pas requis par le scenario retenu ;
* la strategie `draft` / `hidden` / etat testable est decidee avant action ;
* les emails WooCommerce attendus sont identifies ;
* le rollback indique l'etat initial et l'etat final attendu du produit, des variations, de la gateway et de toute commande test ;
* la decision de lancer MVP-COM-2D-RUN est explicite.

### No-Go immediat si

* le produit `120` est absent ;
* une variation est absente ;
* un SKU ne correspond plus ;
* un prix ne correspond plus a `29`, `99` ou `299` ;
* un fichier telechargeable est absent ;
* une table critique WooCommerce est absente ou non verifiee ;
* une gateway est deja activee de maniere inattendue ;
* le mode exact de la gateway de test n'est pas decide ;
* Stripe ou PayPal devraient etre sollicites ;
* le produit est encore `draft` alors que le scenario suppose un checkout public ;
* la strategie d'etat produit testable n'est pas decidee ;
* les emails attendus ne sont pas identifies ;
* le rollback ne precise pas l'etat initial et l'etat final attendu ;
* le site a une erreur WooCommerce ;
* le checkout public semble instable ;
* le depot Git local n'est pas propre ;
* l'utilisateur n'a pas explicitement valide le RUN.

## Etat WooCommerce a verifier avant RUN

Commandes futures de lecture seule, a executer uniquement au debut de MVP-COM-2D-RUN :

```bash
cd /home/zivi5632/louis94.com

wp core is-installed
wp plugin is-active woocommerce

wp wc product get 120 --user=1 --format=json
wp wc product_variation list 120 --user=1 --format=table
wp wc product_variation get 120 121 --user=1 --format=json
wp wc product_variation get 120 122 --user=1 --format=json
wp wc product_variation get 120 123 --user=1 --format=json

wp wc payment_gateway list --user=1 --format=table
wp option get woocommerce_currency
wp option get woocommerce_file_download_method
wp option get woocommerce_downloads_grant_access_after_payment
```

Ces commandes sont documentees ici mais ne doivent pas etre executees pendant PREP.

## Controles obligatoires avant RUN

Les controles suivants sont des pre-requis documentaires du RUN futur. Ils ne doivent pas etre executes pendant PREP.

Ils doivent confirmer :

* le produit parent `120` ;
* les variations `121`, `122`, `123` ;
* les fichiers de test associes ;
* les limites et expirations de telechargement ;
* les gateways et leur etat initial ;
* les tables critiques WooCommerce ;
* les options WooCommerce liees aux telechargements ;
* la strategie exacte `draft` / `hidden` / etat testable ;
* le rollback attendu avant toute action.

No-Go si l'un de ces controles ne peut pas etre effectue, n'est pas compris, ou revele un ecart non explique.

## Tables critiques WooCommerce a verifier avant RUN

Controles futurs obligatoires issus de `docs/project-rules.md`, a executer uniquement au debut de MVP-COM-2D-RUN :

```bash
cd /home/zivi5632/louis94.com

wp db tables --all-tables | grep 'woocommerce'
wp db query "SHOW TABLES LIKE 'wpcq_woocommerce_%';"
wp db query "SHOW TABLES LIKE 'wpcq_wc_%';"
wp db query "SHOW TABLES LIKE 'wpcq_actionscheduler_%';"
wp db query "DESCRIBE wpcq_woocommerce_downloadable_product_permissions;"
```

No-Go immediat si une table critique est absente ou si l'etat WooCommerce ne correspond pas a la regle projet.

Ces commandes sont documentees ici mais ne doivent pas etre executees pendant PREP.

## Gateway de test envisagee

Gateway envisageable pour un RUN futur :

```text
cheque
```

Raison :

* gateway hors ligne ;
* utile pour test WooCommerce controle ;
* ne declenche pas de paiement live ;
* permet de tester commande et permission de telechargement apres passage controle en completed.

Decision PREP :

```text
Ne pas activer cheque pendant PREP.
Ne pas modifier cheque pendant PREP.
Ne pas activer Stripe.
Ne pas activer PayPal.
```

Si `cheque` devait etre activee dans MVP-COM-2D-RUN, son etat initial devra etre documente avant modification et restaure apres test.

La decision RUN devra aussi preciser si `cheque` est deja disponible, si son activation temporaire est necessaire, et quel etat exact doit etre restaure apres test.

`cheque` reste uniquement une option de RUN futur. Sa mention dans PREP ne vaut ni autorisation d'activation, ni autorisation de modification WooCommerce.

## Protocole theorique du futur RUN

Ce protocole est theorique. Il ne doit pas etre execute pendant PREP.

1. Confirmer le Go explicite.
2. Lire l'etat initial des gateways.
3. Confirmer le produit `120`.
4. Confirmer les variations `121`, `122`, `123`.
5. Confirmer les fichiers telechargeables.
6. Confirmer les tables critiques WooCommerce.
7. Choisir une seule variation de test, probablement Basic `121`.
8. Decider explicitement si le produit reste `draft`, passe temporairement en `publish + hidden`, ou utilise un autre mecanisme de test.
9. Si necessaire, activer temporairement uniquement la gateway `cheque`.
10. Lancer un checkout controle.
11. Creer une seule commande test.
12. Relever l'ID commande.
13. Passer la commande dans l'etat requis si necessaire.
14. Verifier les permissions de telechargement.
15. Verifier que le fichier telechargeable est associe.
16. Ne pas effectuer de paiement live.
17. Restaurer l'etat initial de la gateway.
18. Remettre le produit dans l'etat final prevu.
19. Documenter le resultat.
20. Committer la documentation du RUN.

## Commandes de verification prevues apres RUN

Commandes futures possibles, a adapter pendant MVP-COM-2D-RUN :

```bash
wp wc shop_order get ORDER_ID --user=1 --format=json
wp db query "SELECT * FROM wpcq_woocommerce_downloadable_product_permissions WHERE order_id = ORDER_ID;"
wp wc payment_gateway list --user=1 --format=table
wp wc product get 120 --user=1 --format=json
wp wc product_variation list 120 --user=1 --format=table
```

Ces commandes ne doivent pas etre executees pendant PREP.

## Rollback prevu pour RUN futur

Rollback a prevoir selon ce qui aura ete modifie pendant RUN :

* documenter avant action l'etat initial du produit parent `120` ;
* documenter avant action l'etat initial des variations `121`, `122`, `123` ;
* documenter avant action l'etat initial de la gateway utilisee ;
* documenter avant action la strategie d'etat produit testable ;
* restaurer l'etat initial de la gateway utilisee ;
* ne pas laisser de gateway activee si elle etait inactive avant RUN ;
* documenter l'ID de toute commande test creee ;
* documenter le statut final attendu de toute commande test ;
* conserver la commande test uniquement si elle sert de preuve documentaire ;
* privilegier l'annulation ou le statut de commande documente plutot qu'une suppression destructive ;
* verifier qu'aucun paiement live n'existe ;
* verifier que le produit test reste non public ;
* remettre le produit dans son etat initial `draft` et `hidden`, sauf decision RUN explicite contraire ;
* verifier que les autres produits ne sont pas touches ;
* documenter l'ID commande et les actions de remise en etat.

Rollback interdit :

* ne pas supprimer des commandes non liees au test ;
* ne pas supprimer automatiquement une commande test sans decision explicite ;
* ne pas modifier des produits existants ;
* ne pas purger des tables WooCommerce ;
* ne pas modifier les reglages globaux WooCommerce hors besoin explicitement valide ;
* ne pas toucher Stripe ou PayPal.

## Criteres de succes du futur RUN

MVP-COM-2D-RUN pourra etre considere reussi si :

* une seule commande test est creee ;
* la commande concerne uniquement le produit `120` et une variation attendue ;
* aucune gateway live n'est utilisee ;
* aucune transaction live n'est effectuee ;
* les permissions de telechargement sont creees correctement ;
* le fichier `.txt` attendu est associe ;
* l'etat initial des gateways est restaure ;
* le produit test reste non public ou revient a l'etat prevu ;
* le resultat est documente dans Git.

## Criteres d'arret immediat

Arreter immediatement le RUN futur si :

* une gateway live apparait activee ;
* Stripe ou PayPal est sollicite ;
* une commande reelle client apparait ;
* le produit test n'est plus le produit attendu ;
* une variation manque ;
* une table critique WooCommerce manque ;
* le checkout demande une configuration fiscale ou paiement non prevue ;
* une erreur WooCommerce critique apparait ;
* une permission de telechargement est creee pour un mauvais produit ;
* une modification non prevue est necessaire.

## Interdictions finales MVP-COM-2D-PREP

Pendant MVP-COM-2D-PREP :

```text
Aucun checkout.
Aucune commande.
Aucun paiement.
Aucune gateway modifiee.
Aucune modification WooCommerce.
Aucune modification serveur.
Aucun changement de statut produit.
Aucune publication produit.
Aucun passage en RUN.
```

## Decision finale

```text
MVP-COM-2D-PREP prepare uniquement un futur test checkout controle.
MVP-COM-2D-RUN n'est pas lance.
Le RUN necessitera une decision explicite separee.
```

## Historique RUN - No-Go serveur MVP-COM-2D

Date de tentative RUN : 2026-06-29

Statut : `bloque - No-Go serveur`

MVP-COM-2D-RUN-EXECUTION a ete prepare avec validation humaine explicite, puis arrete avant toute action WooCommerce car l'acces serveur etait indisponible.

Cause observee :

```text
SSH louis94.com:22 : timeout
SSH 109.234.167.74:2222 : timeout
WP-CLI serveur non atteint
