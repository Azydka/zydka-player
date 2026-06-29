\# MVP-COM-2D-PREP - Preparation test checkout controle WooCommerce



Date : 2026-06-29



\## Statut



Statut : `preparation uniquement — MVP-COM-2D-RUN non lance`



Decision :



```text

MVP-COM-2D-PREP documente uniquement un futur test checkout controle.

Aucun checkout ne doit etre lance pendant cette mission.

Aucune commande ne doit etre creee.

Aucun paiement ne doit etre effectue.

Aucune gateway ne doit etre activee, desactivee ou modifiee.

Aucune modification serveur ne doit etre executee.

```



\## Point de depart



Depot Git :



```text

main propre et synchronise

Dernier commit confirme : c2e3b83 docs(mvp): restore clean variable beat run documentation

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

wp-content/uploads/woocommerce\_uploads/louis94-memoire-vive-basic-test.txt

wp-content/uploads/woocommerce\_uploads/louis94-memoire-vive-standard-test.txt

wp-content/uploads/woocommerce\_uploads/louis94-memoire-vive-premium-test.txt

```



Regles de telechargement :



```text

Limite telechargement : 5

Expiration telechargement : 30 jours

```



\## Objectif du futur MVP-COM-2D-RUN



Le futur RUN aura pour objectif de verifier le tunnel WooCommerce minimal pour un produit variable numerique :



\* selection d'une variation ;

\* ajout au panier ;

\* checkout controle ;

\* creation d'une commande test ;

\* passage controle de la commande dans un etat permettant les permissions de telechargement ;

\* verification des permissions de telechargement ;

\* verification de la disponibilite du fichier test associe ;

\* rollback ou remise en etat apres test.



Ce document ne lance pas ce RUN. Il prepare uniquement le protocole.



\## Perimetre de MVP-COM-2D-PREP



Actions autorisees pendant PREP :



\* creer ce fichier documentaire ;

\* decrire les pre-requis ;

\* decrire les risques ;

\* decrire les commandes de verification futures ;

\* decrire le rollback ;

\* definir les criteres Go / No-Go ;

\* definir les criteres de succes ;

\* definir les criteres d'arret immediat.



Actions interdites pendant PREP :



\* ne pas lancer de checkout ;

\* ne pas creer de commande ;

\* ne pas effectuer de paiement ;

\* ne pas activer de gateway ;

\* ne pas desactiver de gateway ;

\* ne pas modifier de gateway ;

\* ne pas modifier les reglages WooCommerce ;

\* ne pas publier le produit ;

\* ne pas changer le statut du produit ;

\* ne pas modifier les variations ;

\* ne pas modifier les fichiers telechargeables ;

\* ne pas executer de commande serveur ;

\* ne pas passer en MVP-COM-2D-RUN.



\## Risques identifies



\### Risque gateway



Le test checkout peut necessiter une gateway temporaire. Toute activation de gateway est une modification WooCommerce sensible.



Decision PREP :



```text

Aucune gateway ne doit etre modifiee pendant MVP-COM-2D-PREP.

```



\### Risque commande reelle



Un checkout peut creer une commande visible dans WooCommerce et potentiellement generer des emails.



Decision PREP :



```text

Aucune commande ne doit etre creee pendant MVP-COM-2D-PREP.

```



\### Risque paiement



Stripe, PayPal ou toute gateway live ne doivent pas etre utilises sans decision explicite.



Decision PREP :



```text

Aucun paiement live.

Aucun paiement test.

Aucune tentative Stripe.

Aucune tentative PayPal.

```



\### Risque produit public



Le produit test est actuellement en `draft` et `hidden`. Le rendre public pourrait exposer un produit de test.



Decision PREP :



```text

Ne pas publier le produit.

Ne pas changer la visibilite catalogue.

```



\### Risque permissions telechargement



Les permissions de telechargement ne doivent etre creees que dans un RUN controle, apres commande test clairement identifiee.



Decision PREP :



```text

Ne pas creer de permission de telechargement pendant PREP.

```



\## Pre-requis Go / No-Go pour un futur RUN



\### Go possible seulement si



\* le depot Git est propre ;

\* la documentation PREP est commitee ;

\* le produit `120` existe toujours ;

\* le produit `120` est toujours de type `variable` ;

\* les variations `121`, `122`, `123` existent toujours ;

\* les fichiers test sont toujours associes aux variations ;

\* les limites de telechargement sont toujours `5` ;

\* l'expiration est toujours `30` jours ;

\* les gateways ont ete lues avant RUN ;

\* la gateway de test a ete choisie explicitement ;

\* le rollback est compris ;

\* la decision de lancer MVP-COM-2D-RUN est explicite.



\### No-Go immediat si



\* le produit `120` est absent ;

\* une variation est absente ;

\* un SKU ne correspond plus ;

\* un fichier telechargeable est absent ;

\* une gateway est deja activee de maniere inattendue ;

\* le site a une erreur WooCommerce ;

\* le checkout public semble instable ;

\* le depot Git local n'est pas propre ;

\* l'utilisateur n'a pas explicitement valide le RUN.



\## Etat WooCommerce a verifier avant RUN



Commandes futures de lecture seule, a executer uniquement au debut de MVP-COM-2D-RUN :



```bash

cd /home/zivi5632/louis94.com



wp core is-installed

wp plugin is-active woocommerce



wp wc product get 120 --user=1 --format=json

wp wc product\_variation list 120 --user=1 --format=table

wp wc product\_variation get 120 121 --user=1 --format=json

wp wc product\_variation get 120 122 --user=1 --format=json

wp wc product\_variation get 120 123 --user=1 --format=json



wp wc payment\_gateway list --user=1 --format=table

wp option get woocommerce\_currency

wp option get woocommerce\_file\_download\_method

wp option get woocommerce\_downloads\_grant\_access\_after\_payment

```



Ces commandes sont documentees ici mais ne doivent pas etre executees pendant PREP.



\## Gateway de test envisagee



Gateway envisageable pour un RUN futur :



```text

cheque

```



Raison :



\* gateway hors ligne ;

\* utile pour test WooCommerce controle ;

\* ne declenche pas de paiement live ;

\* permet de tester commande et permission de telechargement apres passage controle en completed.



Decision PREP :



```text

Ne pas activer cheque pendant PREP.

Ne pas modifier cheque pendant PREP.

Ne pas activer Stripe.

Ne pas activer PayPal.

```



Si `cheque` devait etre activee dans MVP-COM-2D-RUN, son etat initial devra etre documente avant modification et restaure apres test.



\## Protocole theorique du futur RUN



Ce protocole est theorique. Il ne doit pas etre execute pendant PREP.



1\. Confirmer le Go explicite.

2\. Lire l'etat initial des gateways.

3\. Confirmer le produit `120`.

4\. Confirmer les variations `121`, `122`, `123`.

5\. Confirmer les fichiers telechargeables.

6\. Choisir une seule variation de test, probablement Basic `121`.

7\. Si necessaire, activer temporairement uniquement la gateway `cheque`.

8\. Passer le produit dans un etat testable uniquement si necessaire.

9\. Lancer un checkout controle.

10\. Creer une seule commande test.

11\. Relever l'ID commande.

12\. Passer la commande dans l'etat requis si necessaire.

13\. Verifier les permissions de telechargement.

14\. Verifier que le fichier telechargeable est associe.

15\. Ne pas effectuer de paiement live.

16\. Restaurer l'etat initial de la gateway.

17\. Laisser ou remettre le produit en etat non public selon decision.

18\. Documenter le resultat.

19\. Committer la documentation du RUN.



\## Commandes de verification prevues apres RUN



Commandes futures possibles, a adapter pendant MVP-COM-2D-RUN :



```bash

wp wc shop\_order get ORDER\_ID --user=1 --format=json

wp db query "SELECT \* FROM wpcq\_woocommerce\_downloadable\_product\_permissions WHERE order\_id = ORDER\_ID;"

wp wc payment\_gateway list --user=1 --format=table

wp wc product get 120 --user=1 --format=json

wp wc product\_variation list 120 --user=1 --format=table

```



Ces commandes ne doivent pas etre executees pendant PREP.



\## Rollback prevu pour RUN futur



Rollback a prevoir selon ce qui aura ete modifie pendant RUN :



\* restaurer l'etat initial de la gateway utilisee ;

\* ne pas laisser de gateway activee si elle etait inactive avant RUN ;

\* conserver la commande test uniquement si elle sert de preuve documentaire ;

\* sinon, definir une strategie de suppression ou d'annulation de commande ;

\* verifier qu'aucun paiement live n'existe ;

\* verifier que le produit test reste non public ;

\* verifier que les autres produits ne sont pas touches ;

\* documenter l'ID commande et les actions de remise en etat.



Rollback interdit :



\* ne pas supprimer des commandes non liees au test ;

\* ne pas modifier des produits existants ;

\* ne pas purger des tables WooCommerce ;

\* ne pas modifier les reglages globaux WooCommerce hors besoin explicitement valide ;

\* ne pas toucher Stripe ou PayPal.



\## Criteres de succes du futur RUN



MVP-COM-2D-RUN pourra etre considere reussi si :



\* une seule commande test est creee ;

\* la commande concerne uniquement le produit `120` et une variation attendue ;

\* aucune gateway live n'est utilisee ;

\* aucune transaction live n'est effectuee ;

\* les permissions de telechargement sont creees correctement ;

\* le fichier `.txt` attendu est associe ;

\* l'etat initial des gateways est restaure ;

\* le produit test reste non public ou revient a l'etat prevu ;

\* le resultat est documente dans Git.



\## Criteres d'arret immediat



Arreter immediatement le RUN futur si :



\* une gateway live apparait activee ;

\* Stripe ou PayPal est sollicite ;

\* une commande reelle client apparait ;

\* le produit test n'est plus le produit attendu ;

\* une variation manque ;

\* le checkout demande une configuration fiscale ou paiement non prevue ;

\* une erreur WooCommerce critique apparait ;

\* une permission de telechargement est creee pour un mauvais produit ;

\* une modification non prevue est necessaire.



\## Interdictions finales MVP-COM-2D-PREP



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



\## Decision finale



```text

MVP-COM-2D-PREP prepare uniquement un futur test checkout controle.

MVP-COM-2D-RUN n'est pas lance.

Le RUN necessitera une decision explicite separee.

```



