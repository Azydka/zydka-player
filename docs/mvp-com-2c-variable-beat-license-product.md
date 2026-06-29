# MVP-COM-2C - Produit beat variable WooCommerce avec licences

Date : 2026-06-29

## Statut

Statut : `bloque â€” prÃªt pour reprise Terminal cPanel / WP-CLI serveur`

Decision :

```text
MVP-COM-2C reste bloquÃ© tant que lâ€™accÃ¨s serveur contrÃ´lÃ© nâ€™est pas disponible
```

## Rappel MVP-COM-2C-PREP

Cette mission prÃ©pare uniquement une reprise serveur contrÃ´lÃ©e.

Aucune action serveur ne doit Ãªtre exÃ©cutÃ©e depuis lâ€™environnement local tant que SSH reste en timeout et tant quâ€™aucun Terminal cPanel contrÃ´lÃ© nâ€™est disponible.

Le produit test ne doit pas Ãªtre crÃ©Ã© maintenant. La procÃ©dure documentÃ©e est uniquement prÃªte Ã  Ãªtre reprise plus tard depuis un Terminal cPanel / WP-CLI serveur contrÃ´lÃ©.

## Interdictions

* Ne pas crÃ©er le produit maintenant.
* Ne pas exÃ©cuter de commande serveur depuis lâ€™environnement local.
* Ne pas modifier WooCommerce.
* Ne pas modifier les gateways.
* Ne pas activer ou rÃ©activer de moyen de paiement.
* Ne pas modifier les rÃ©glages WooCommerce globaux.
* Ne pas lancer de checkout.
* Ne pas toucher aux produits existants.
* Ne pas corriger automatiquement la base de donnÃ©es.
* Ne pas passer Ã  MVP-COM-2D.
* Ne pas crÃ©er de variation `Exclusive`.
* Ne pas utiliser de vrais fichiers audio.

## Verification procedure WP-CLI

La procÃ©dure WP-CLI documentÃ©e doit rester strictement limitÃ©e au pÃ©rimÃ¨tre suivant :

* CrÃ©er uniquement le produit test `MVP Test Beat â€” MÃ©moire Vive`.
* CrÃ©er uniquement les variations `Basic`, `Standard` et `Premium`.
* Utiliser uniquement des fichiers `.txt` de test.
* Garder le produit en `draft` ou `private`.
* Garder la visibilitÃ© catalogue sur `hidden`.
* Ne lancer aucun checkout.
* Ne modifier aucun moyen de paiement.
* Ne modifier aucune gateway.
* Ne toucher Ã  aucun produit existant.
* Sâ€™arrÃªter si le slug produit ou un SKU prÃ©vu existe dÃ©jÃ .
* Ne crÃ©er aucune variation `Exclusive`.

## Checklist avant execution Terminal cPanel

A vÃ©rifier dans le Terminal cPanel avant toute exÃ©cution WP-CLI de crÃ©ation :

* Chemin racine WordPress confirmÃ©.
* `wp core is-installed` retourne OK.
* `wp plugin is-active woocommerce` retourne OK.
* `wp option get woocommerce_currency` retourne la devise attendue.
* `wp option get woocommerce_file_download_method` retourne la mÃ©thode attendue.
* `wp option get woocommerce_downloads_grant_access_after_payment` retourne la valeur attendue.

Si lâ€™un de ces contrÃ´les Ã©choue, stopper MVP-COM-2C et ne pas crÃ©er le produit.

## Checklist apres execution

A renseigner uniquement aprÃ¨s une exÃ©cution serveur contrÃ´lÃ©e :

* ID produit.
* Statut produit : `draft` ou `private`.
* VisibilitÃ© catalogue : `hidden`.
* Type produit : `variable`.
* Attribut `Licence`.
* IDs variations.
* SKUs.
* Prix.
* Fichiers associÃ©s.
* Limite tÃ©lÃ©chargement : `5`.
* Expiration tÃ©lÃ©chargement : `30` jours.
* Moyens de paiement inchangÃ©s.
* Gateways inchangÃ©es.
* Aucun checkout lancÃ©.

## Rollback controle

Le rollback doit supprimer uniquement les Ã©lÃ©ments crÃ©Ã©s par MVP-COM-2C :

* Supprimer uniquement les variations crÃ©Ã©es pour le produit test.
* Supprimer uniquement le produit test `MVP Test Beat â€” MÃ©moire Vive`.
* Supprimer uniquement les fichiers `.txt` de test si nÃ©cessaire.
* Ne pas toucher aux rÃ©glages WooCommerce.
* Ne pas toucher aux gateways.
* Ne pas toucher aux moyens de paiement.
* Ne pas toucher aux autres produits.

## Decision finale

MVP-COM-2C reste bloquÃ© tant que lâ€™accÃ¨s serveur contrÃ´lÃ© nâ€™est pas disponible, mais la reprise Terminal cPanel / WP-CLI serveur est prÃ©parÃ©e.

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

Quand l'acces serveur contrÃ´lÃ© est disponible, rejouer uniquement le preflight :

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

Puis creer le produit variable via WooCommerce REST/WP-CLI ou `wp eval` avec les classes WooCommerce, uniquement depuis le serveur contrÃ´lÃ© :

* `WC_Product_Variable` ;
* `WC_Product_Variation` ;
* `WC_Product_Download`.

Contraintes de creation :

* Produit : `MVP Test Beat â€” MÃ©moire Vive`.
* Statut : `draft` ou `private`.
* VisibilitÃ© catalogue : `hidden`.
* Type : produit variable.
* Attribut : `Licence`.
* Variations : `Basic`, `Standard`, `Premium`.
* Fichiers : `.txt` de test uniquement.
* Limite tÃ©lÃ©chargement : `5`.
* Expiration tÃ©lÃ©chargement : `30` jours.
* Aucun checkout.
* Aucun changement gateway.
* Aucun produit existant modifiÃ©.
* Aucune variation `Exclusive`.

Verifier ensuite uniquement le produit et ses variations, sans checkout ni gateway :

```bash
wp wc product get PRODUCT_ID --user=1 --format=json
wp wc product_variation list PRODUCT_ID --user=1 --format=table
```

Les commandes de checkout, commande test, passage en `completed`, permission de tÃ©lÃ©chargement et activation/dÃ©sactivation de gateway restent hors pÃ©rimÃ¨tre tant que MVP-COM-2C est bloquÃ©.

## Resultat final

Statut : `bloque â€” prÃªt pour reprise Terminal cPanel / WP-CLI serveur`.

Decision :

```text
MVP-COM-2C reste bloquÃ© tant que lâ€™accÃ¨s serveur contrÃ´lÃ© nâ€™est pas disponible.
Aucun produit MVP-COM-2C nâ€™a Ã©tÃ© crÃ©Ã©.
Aucun checkout MVP-COM-2C nâ€™a Ã©tÃ© lancÃ©.
Aucune gateway nâ€™a Ã©tÃ© modifiÃ©e.
Aucune action WooCommerce destructive nâ€™a Ã©tÃ© exÃ©cutÃ©e.
```



## Execution serveur controlee MVP-COM-2C-RUN

Date : 2026-06-29

Resultat : succes controle, sans checkout.

Produit cree :

- ID produit : `120`
- Nom : `MVP Test Beat - Memoire Vive`
- Type : `variable`
- Statut : `draft`
- Visibilite catalogue : `hidden`
- Attribut : `Licence`
- Variations :
  - Basic : ID `121`, SKU `MVP-MEMOIRE-VIVE-BASIC`, prix `29`
  - Standard : ID `122`, SKU `MVP-MEMOIRE-VIVE-STANDARD`, prix `99`
  - Premium : ID `123`, SKU `MVP-MEMOIRE-VIVE-PREMIUM`, prix `299`
- Fichiers test :
  - `louis94-memoire-vive-basic-test.txt`
  - `louis94-memoire-vive-standard-test.txt`
  - `louis94-memoire-vive-premium-test.txt`
- Dossier utilise : `wp-content/uploads/woocommerce_uploads/`
- Limite telechargement : `5`
- Expiration telechargement : `30` jours

Controles effectues :

- Produit parent verifie via `wp wc product get 120`
- Variations verifiees via `wp wc product_variation list 120`
- Variations individuelles verifiees via :
  - `wp wc product_variation get 120 121`
  - `wp wc product_variation get 120 122`
  - `wp wc product_variation get 120 123`
- Gateways relues via `wp wc payment_gateway list --user=1 --format=table`

Incidents traites :

- Premier dossier `wp-content/uploads/louis94-license-test/` refuse par WooCommerce car non approuve.
- Sous-dossier `wp-content/uploads/woocommerce_uploads/louis94-license-test/` refuse aussi.
- Produit partiel ID `117` cree puis supprime par rollback controle.
- Script final valide avec fichiers directement dans `wp-content/uploads/woocommerce_uploads/`.

Restrictions maintenues :

- Aucun checkout lance.
- Aucune commande creee.
- Aucun paiement effectue.
- Aucune gateway modifiee.
- Aucun produit existant modifie.
- Produit laisse en `draft` et `hidden`.
