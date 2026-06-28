# MVP-COM-2C - Produit beat variable WooCommerce avec licences

Date : 2026-06-29

## Objectif

Creer et tester un premier produit beat variable WooCommerce sur louis94.com avec trois licences :

- Basic ;
- Standard ;
- Premium.

Le but etait de valider le modele reel de vente de beats/licences, sans automatiser le catalogue.

## Perimetre

WooCommerce uniquement.

## Hors perimetre

- Ne pas modifier Zydka Player.
- Ne pas modifier Zydka Analytics.
- Ne pas modifier Zydka Player Manager.
- Ne pas modifier le theme.
- Ne pas modifier le build JS.
- Ne pas toucher aux fichiers `apps/zydka-plugin`.
- Ne pas activer Stripe ou PayPal en production sans validation explicite.
- Ne pas creer de vrai paiement live.
- Ne pas changer les regles fiscales sans validation.

## Etat initial connu

Source de reference :

```text
docs/project-rules.md
docs/mvp-com-2a-woocommerce-setup.md
docs/mvp-com-2b-woocommerce-test-product-checkout.md
```

Etat connu depuis MVP-COM-2B :

- WooCommerce actif en version documentee `10.9.1`.
- Produit test MVP-COM-2B existant : ID `115`.
- Commande test MVP-COM-2B documentee : ID `116`, statut `completed`.
- La table `wpcq_woocommerce_downloadable_product_permissions` avait ete absente puis restauree manuellement apres sauvegarde SQL.
- Le tunnel produit numerique simple avait ete valide.

## Audit public

Commandes executees depuis l'environnement local :

```powershell
Resolve-DnsName louis94.com -Type A
curl.exe -I -L --max-time 20 https://www.louis94.com/shop/
curl.exe -sS --max-time 20 https://www.louis94.com/wp-json/wc/store/v1/products
```

Resultats :

- `louis94.com` pointe vers `109.234.167.74`.
- `https://www.louis94.com/shop/` repond `200 OK`.
- Le Store API public retourne le produit MVP-COM-2B ID `115`, type `simple`, prix `1.00 EUR`, categorie `Test`, achetable et en stock.

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

- L'audit WP-CLI obligatoire n'a pas pu etre execute.
- Les tables critiques WooCommerce n'ont pas pu etre verifiees.
- La mission fonctionnelle doit etre stoppee avant creation produit.

## Tables WooCommerce critiques

Etat au 2026-06-29 :

| Table | Etat |
| --- | --- |
| `wpcq_woocommerce_downloadable_product_permissions` | Non verifiee pendant MVP-COM-2C |
| `wpcq_woocommerce_order_items` | Non verifiee pendant MVP-COM-2C |
| `wpcq_woocommerce_order_itemmeta` | Non verifiee pendant MVP-COM-2C |
| `wpcq_woocommerce_payment_tokens` | Non verifiee pendant MVP-COM-2C |
| `wpcq_woocommerce_payment_tokenmeta` | Non verifiee pendant MVP-COM-2C |
| `wpcq_wc_product_meta_lookup` | Non verifiee pendant MVP-COM-2C |
| `wpcq_wc_order_stats` | Non verifiee pendant MVP-COM-2C |
| `wpcq_wc_order_product_lookup` | Non verifiee pendant MVP-COM-2C |
| `wpcq_wc_customer_lookup` | Non verifiee pendant MVP-COM-2C |
| `wpcq_wc_orders*` si HPOS actif | Non verifiee pendant MVP-COM-2C |
| `wpcq_actionscheduler_*` | Non verifiee pendant MVP-COM-2C |

Decision appliquee :

Ne pas creer de produit variable tant que les tables critiques ne sont pas confirmees via WP-CLI ou acces equivalent authentifie.

## Produit cree

Aucun produit MVP-COM-2C n'a ete cree.

Details attendus mais non disponibles :

| Element | Etat |
| --- | --- |
| Produit variable | Non cree |
| ID produit | Sans objet |
| URL produit | Sans objet |
| Variation Basic | Non creee |
| Variation Standard | Non creee |
| Variation Premium | Non creee |
| Fichiers test licences | Non crees sur le serveur |

## Paiement test

Aucune passerelle de paiement n'a ete modifiee.

Etat :

- `cheque` non reactive pendant cette mission ;
- Stripe non active ;
- PayPal non active ;
- aucun paiement live effectue.

## Checkout test

Aucun checkout MVP-COM-2C n'a ete execute.

Raison :

Le preflight WP-CLI obligatoire n'a pas pu verifier les tables critiques WooCommerce.

## Commande test

Aucune commande test MVP-COM-2C n'a ete creee.

Details :

| Element | Etat |
| --- | --- |
| ID commande | Sans objet |
| Statut commande | Sans objet |
| Total | Sans objet |
| Devise | Sans objet |
| Ligne produit | Sans objet |

## Permissions de telechargement

Aucune permission de telechargement MVP-COM-2C n'a ete creee.

Raison :

Aucune commande test MVP-COM-2C n'a ete passee en `completed`.

## Incident

Incident : acces serveur indisponible pour les controles WP-CLI obligatoires.

Impact :

- Impossible de confirmer les tables critiques WooCommerce.
- Impossible de creer proprement le produit variable.
- Impossible de tester le checkout et les permissions de telechargement.

La mission respecte donc la regle projet : stopper avant toute creation produit quand le controle critique ne peut pas etre valide.

## Commandes exactes a rejouer

Quand l'acces serveur est disponible, rejouer le preflight :

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

Si toutes les tables critiques sont presentes, preparer les fichiers test :

```bash
mkdir -p wp-content/uploads/louis94-license-test
echo "Louis94 Beat License Test - Basic" > wp-content/uploads/louis94-license-test/louis94-beat-basic-test.txt
echo "Louis94 Beat License Test - Standard" > wp-content/uploads/louis94-license-test/louis94-beat-standard-test.txt
echo "Louis94 Beat License Test - Premium" > wp-content/uploads/louis94-license-test/louis94-beat-premium-test.txt
```

Puis creer le produit variable via WooCommerce REST/WP-CLI ou `wp eval` avec les classes WooCommerce :

- `WC_Product_Variable` ;
- `WC_Product_Variation` ;
- `WC_Product_Download`.

Verifier ensuite :

```bash
wp wc product get PRODUCT_ID --user=1 --format=json
wp wc product_variation list PRODUCT_ID --user=1 --format=table
wp wc payment_gateway update cheque --user=1 --enabled=true
wp wc payment_gateway get cheque --user=1 --fields=id,title,enabled
wp wc shop_order list --user=1 --orderby=date --order=desc --per_page=5
wp wc shop_order update ORDER_ID --user=1 --status=completed
wp wc shop_order get ORDER_ID --user=1 --fields=id,status,total,currency,date_completed,line_items
wp eval 'wc_downloadable_product_permissions(ORDER_ID);'
wp db query "SELECT * FROM wpcq_woocommerce_downloadable_product_permissions WHERE order_id = ORDER_ID\G"
wp wc payment_gateway update cheque --user=1 --enabled=false
```

## Resultat final

Statut : bloque.

Decision : ne pas creer le produit MVP-COM-2C tant que l'audit WP-CLI obligatoire n'est pas executable et que les tables critiques WooCommerce ne sont pas confirmees.
