# MVP-COM-2C - Produit beat variable WooCommerce avec licences

Date : 2026-06-29

## Statut

Statut : `bloque — prêt pour reprise Terminal cPanel / WP-CLI serveur`

Decision :

```text
MVP-COM-2C reste bloqué tant que l’accès serveur contrôlé n’est pas disponible
```

## Rappel MVP-COM-2C-PREP

Cette mission prépare uniquement une reprise serveur contrôlée.

Aucune action serveur ne doit être exécutée depuis l’environnement local tant que SSH reste en timeout et tant qu’aucun Terminal cPanel contrôlé n’est disponible.

Le produit test ne doit pas être créé maintenant. La procédure documentée est uniquement prête à être reprise plus tard depuis un Terminal cPanel / WP-CLI serveur contrôlé.

## Interdictions

* Ne pas créer le produit maintenant.
* Ne pas exécuter de commande serveur depuis l’environnement local.
* Ne pas modifier WooCommerce.
* Ne pas modifier les gateways.
* Ne pas activer ou réactiver de moyen de paiement.
* Ne pas modifier les réglages WooCommerce globaux.
* Ne pas lancer de checkout.
* Ne pas toucher aux produits existants.
* Ne pas corriger automatiquement la base de données.
* Ne pas passer à MVP-COM-2D.
* Ne pas créer de variation `Exclusive`.
* Ne pas utiliser de vrais fichiers audio.

## Verification procedure WP-CLI

La procédure WP-CLI documentée doit rester strictement limitée au périmètre suivant :

* Créer uniquement le produit test `MVP Test Beat — Mémoire Vive`.
* Créer uniquement les variations `Basic`, `Standard` et `Premium`.
* Utiliser uniquement des fichiers `.txt` de test.
* Garder le produit en `draft` ou `private`.
* Garder la visibilité catalogue sur `hidden`.
* Ne lancer aucun checkout.
* Ne modifier aucun moyen de paiement.
* Ne modifier aucune gateway.
* Ne toucher à aucun produit existant.
* S’arrêter si le slug produit ou un SKU prévu existe déjà.
* Ne créer aucune variation `Exclusive`.

## Checklist avant execution Terminal cPanel

A vérifier dans le Terminal cPanel avant toute exécution WP-CLI de création :

* Chemin racine WordPress confirmé.
* `wp core is-installed` retourne OK.
* `wp plugin is-active woocommerce` retourne OK.
* `wp option get woocommerce_currency` retourne la devise attendue.
* `wp option get woocommerce_file_download_method` retourne la méthode attendue.
* `wp option get woocommerce_downloads_grant_access_after_payment` retourne la valeur attendue.

Si l’un de ces contrôles échoue, stopper MVP-COM-2C et ne pas créer le produit.

## Checklist apres execution

A renseigner uniquement après une exécution serveur contrôlée :

* ID produit.
* Statut produit : `draft` ou `private`.
* Visibilité catalogue : `hidden`.
* Type produit : `variable`.
* Attribut `Licence`.
* IDs variations.
* SKUs.
* Prix.
* Fichiers associés.
* Limite téléchargement : `5`.
* Expiration téléchargement : `30` jours.
* Moyens de paiement inchangés.
* Gateways inchangées.
* Aucun checkout lancé.

## Rollback controle

Le rollback doit supprimer uniquement les éléments créés par MVP-COM-2C :

* Supprimer uniquement les variations créées pour le produit test.
* Supprimer uniquement le produit test `MVP Test Beat — Mémoire Vive`.
* Supprimer uniquement les fichiers `.txt` de test si nécessaire.
* Ne pas toucher aux réglages WooCommerce.
* Ne pas toucher aux gateways.
* Ne pas toucher aux moyens de paiement.
* Ne pas toucher aux autres produits.

## Decision finale

MVP-COM-2C reste bloqué tant que l’accès serveur contrôlé n’est pas disponible, mais la reprise Terminal cPanel / WP-CLI serveur est préparée.

## Objectif

Creer et tester un premier produit beat variable WooCommerce sur louis94.com avec trois licences :

* Basic ;
* Standard ;
* Premium.

Le but etait de valider le modele reel de vente de beats/licences, sans automatiser le catalogue.

## Perimetre

WooCommerce uniquement.

## Hors perimetre

* Ne pas modifier Zydka Player.
* Ne pas modifier Zydka Analytics.
* Ne pas modifier Zydka Player Manager.
* Ne pas modifier le theme.
* Ne pas modifier le build JS.
* Ne pas toucher aux fichiers `apps/zydka-plugin`.
* Ne pas activer Stripe ou PayPal en production sans validation explicite.
* Ne pas creer de vrai paiement live.
* Ne pas changer les regles fiscales sans validation.

## Etat initial connu

Source de reference :

```text
docs/project-rules.md
docs/mvp-com-2a-woocommerce-setup.md
docs/mvp-com-2b-woocommerce-test-product-checkout.md
```

Etat connu depuis MVP-COM-2B :

* WooCommerce actif en version documentee `10.9.1`.
* Produit test MVP-COM-2B existant : ID `115`.
* Commande test MVP-COM-2B documentee : ID `116`, statut `completed`.
* La table `wpcq_woocommerce_downloadable_product_permissions` avait ete absente puis restauree manuellement apres sauvegarde SQL.
* Le tunnel produit numerique simple avait ete valide.

## Audit public

Commandes executees depuis l'environnement local :

```powershell
Resolve-DnsName louis94.com -Type A
curl.exe -I -L --max-time 20 https://www.louis94.com/shop/
curl.exe -sS --max-time 20 https://www.louis94.com/wp-json/wc/store/v1/products
```

Resultats :

* `louis94.com` pointe vers `109.234.167.74`.
* `https://www.louis94.com/shop/` repond `200 OK`.
* Le Store API public retourne le produit MVP-COM-2B ID `115`, type `simple`, prix `1.00 EUR`, categorie `Test`, achetable et en stock.

Produit public observe :

```text
ID: 115
Nom: Louis94 Test Download - MVP
Type: simple
URL: https://www.louis94.com/product/louis94-test-download-mvp/
Prix: 1.00 EUR
Categorie: Test
Achetable: oui
```

## Audit WP-CLI obligatoire

Audit demande avant toute creation produit :

```bash
cd /home/zivi5632/louis94.com
wp core is-installed
wp plugin list --fields=name,status,version --format=table | grep -i woocommerce
wp db prefix
wp db tables --all-tables | grep 'woocommerce'
wp db tables --all-tables | grep 'wpcq_wc_'
wp db tables --all-tables | grep 'wpcq_actionscheduler_'
wp db query "DESCRIBE wpcq_woocommerce_downloadable_product_permissions;"
wp option get woocommerce_currency
wp option get woocommerce_default_country
wp option get woocommerce_downloads_grant_access_after_payment
wp option get woocommerce_file_download_method
wp wc payment_gateway list --user=1 --format=table
```

Tentatives d'acces serveur executees :

```powershell
ssh -o BatchMode=yes -o ConnectTimeout=12 -p 22 zivi5632@louis94.com 'cd /home/zivi5632/louis94.com && pwd && wp core is-installed'
ssh -o BatchMode=yes -o ConnectTimeout=12 -p 2222 zivi5632@109.234.167.74 'cd /home/zivi5632/louis94.com && pwd && wp core is-installed'
```

Resultats :

```text
ssh: connect to host louis94.com port 22: Connection timed out
ssh: connect to host 109.234.167.74 port 2222: Connection timed out
```

Conclusion audit :

* L'audit WP-CLI obligatoire n'a pas pu etre execute.
* Les tables critiques WooCommerce n'ont pas pu etre verifiees.
* La mission fonctionnelle doit etre stoppee avant creation produit.

## Tables WooCommerce critiques

Etat au 2026-06-29 :

| Table                                               | Etat                            |
| --------------------------------------------------- | ------------------------------- |
| `wpcq_woocommerce_downloadable_product_permissions` | Non verifiee pendant MVP-COM-2C |
| `wpcq_woocommerce_order_items`                      | Non verifiee pendant MVP-COM-2C |
| `wpcq_woocommerce_order_itemmeta`                   | Non verifiee pendant MVP-COM-2C |
| `wpcq_woocommerce_payment_tokens`                   | Non verifiee pendant MVP-COM-2C |
| `wpcq_woocommerce_payment_tokenmeta`                | Non verifiee pendant MVP-COM-2C |
| `wpcq_wc_product_meta_lookup`                       | Non verifiee pendant MVP-COM-2C |
| `wpcq_wc_order_stats`                               | Non verifiee pendant MVP-COM-2C |
| `wpcq_wc_order_product_lookup`                      | Non verifiee pendant MVP-COM-2C |
| `wpcq_wc_customer_lookup`                           | Non verifiee pendant MVP-COM-2C |
| `wpcq_wc_orders*` si HPOS actif                     | Non verifiee pendant MVP-COM-2C |
| `wpcq_actionscheduler_*`                            | Non verifiee pendant MVP-COM-2C |

Decision appliquee :

Ne pas creer de produit variable tant que les tables critiques ne sont pas confirmees via WP-CLI ou acces equivalent authentifie.

## Produit cree

Aucun produit MVP-COM-2C n'a ete cree.

Details attendus mais non disponibles :

| Element                | Etat                     |
| ---------------------- | ------------------------ |
| Produit variable       | Non cree                 |
| ID produit             | Sans objet               |
| URL produit            | Sans objet               |
| Variation Basic        | Non creee                |
| Variation Standard     | Non creee                |
| Variation Premium      | Non creee                |
| Fichiers test licences | Non crees sur le serveur |

## Paiement test

Aucune passerelle de paiement n'a ete modifiee.

Etat :

* `cheque` non reactive pendant cette mission ;
* Stripe non active ;
* PayPal non active ;
* aucun paiement live effectue.

## Checkout test

Aucun checkout MVP-COM-2C n'a ete execute.

Raison :

Le preflight WP-CLI obligatoire n'a pas pu verifier les tables critiques WooCommerce.

## Commande test

Aucune commande test MVP-COM-2C n'a ete creee.

Details :

| Element         | Etat       |
| --------------- | ---------- |
| ID commande     | Sans objet |
| Statut commande | Sans objet |
| Total           | Sans objet |
| Devise          | Sans objet |
| Ligne produit   | Sans objet |

## Permissions de telechargement

Aucune permission de telechargement MVP-COM-2C n'a ete creee.

Raison :

Aucune commande test MVP-COM-2C n'a ete passee en `completed`.

## Incident

Incident : acces serveur indisponible pour les controles WP-CLI obligatoires.

Impact :

* Impossible de confirmer les tables critiques WooCommerce.
* Impossible de creer proprement le produit variable.
* Impossible de tester le checkout et les permissions de telechargement.

La mission respecte donc la regle projet : stopper avant toute creation produit quand le controle critique ne peut pas etre valide.

## Commandes exactes a rejouer

Quand l'acces serveur contrôlé est disponible, rejouer uniquement le preflight :

```bash
cd /home/zivi5632/louis94.com
wp core is-installed
wp plugin list --fields=name,status,version --format=table | grep -i woocommerce
wp db prefix
wp db tables --all-tables | grep 'woocommerce'
wp db tables --all-tables | grep 'wpcq_wc_'
wp db tables --all-tables | grep 'wpcq_actionscheduler_'
wp db query "DESCRIBE wpcq_woocommerce_downloadable_product_permissions;"
wp option get woocommerce_currency
wp option get woocommerce_default_country
wp option get woocommerce_downloads_grant_access_after_payment
wp option get woocommerce_file_download_method
wp wc payment_gateway list --user=1 --format=table
```

Si toutes les tables critiques sont presentes, preparer uniquement les fichiers test `.txt` :

```bash
mkdir -p wp-content/uploads/louis94-license-test
echo "Louis94 Beat License Test - Basic" > wp-content/uploads/louis94-license-test/louis94-beat-basic-test.txt
echo "Louis94 Beat License Test - Standard" > wp-content/uploads/louis94-license-test/louis94-beat-standard-test.txt
echo "Louis94 Beat License Test - Premium" > wp-content/uploads/louis94-license-test/louis94-beat-premium-test.txt
```

Puis creer le produit variable via WooCommerce REST/WP-CLI ou `wp eval` avec les classes WooCommerce, uniquement depuis le serveur contrôlé :

* `WC_Product_Variable` ;
* `WC_Product_Variation` ;
* `WC_Product_Download`.

Contraintes de creation :

* Produit : `MVP Test Beat — Mémoire Vive`.
* Statut : `draft` ou `private`.
* Visibilité catalogue : `hidden`.
* Type : produit variable.
* Attribut : `Licence`.
* Variations : `Basic`, `Standard`, `Premium`.
* Fichiers : `.txt` de test uniquement.
* Limite téléchargement : `5`.
* Expiration téléchargement : `30` jours.
* Aucun checkout.
* Aucun changement gateway.
* Aucun produit existant modifié.
* Aucune variation `Exclusive`.

Verifier ensuite uniquement le produit et ses variations, sans checkout ni gateway :

```bash
wp wc product get PRODUCT_ID --user=1 --format=json
wp wc product_variation list PRODUCT_ID --user=1 --format=table
```

Les commandes de checkout, commande test, passage en `completed`, permission de téléchargement et activation/désactivation de gateway restent hors périmètre tant que MVP-COM-2C est bloqué.

## Resultat final

Statut : `bloque — prêt pour reprise Terminal cPanel / WP-CLI serveur`.

Decision :

```text
MVP-COM-2C reste bloqué tant que l’accès serveur contrôlé n’est pas disponible.
Aucun produit MVP-COM-2C n’a été créé.
Aucun checkout MVP-COM-2C n’a été lancé.
Aucune gateway n’a été modifiée.
Aucune action WooCommerce destructive n’a été exécutée.
```
