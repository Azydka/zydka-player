# MVP-COM-2B - Produit numerique test WooCommerce + checkout test

Date : 2026-06-29

## Objectif

Creer et tester un produit numerique simple sur louis94.com afin de valider le tunnel de vente minimal WooCommerce :

- produit numerique test ;
- prix test : 1 EUR ;
- fichier telechargeable simple ;
- checkout test ;
- email client ;
- livraison numerique ;
- verification commande dans WordPress.

## Perimetre

Mission limitee a WooCommerce.

Hors perimetre confirme :

- aucun changement au Zydka Player ;
- aucun changement a Zydka Analytics ;
- aucun changement a Zydka Player Manager ;
- aucun changement au theme ;
- aucun paiement reel active sans validation.

## Audit effectue

Source de reference locale :

```text
docs/mvp-com-2a-woocommerce-setup.md
```

Etat connu depuis MVP-COM-2A :

- racine WordPress cible : `/home/zivi5632/louis94.com` ;
- home/siteurl : `https://www.louis94.com` ;
- WooCommerce installe et actif en version 10.9.1 ;
- pages WooCommerce creees : Shop `108`, Cart `109`, Checkout `110`, My account `111` ;
- devise configuree : EUR ;
- pays par defaut : FR ;
- acces aux telechargements apres paiement : active ;
- methode de telechargement : force ;
- Stripe et PayPal non configures en production ;
- aucun vrai produit beat/kit cree.

Verifications publiques du 2026-06-29 :

- `https://www.louis94.com/shop/` repond en `200 OK` ;
- `https://www.louis94.com/cart/` repond en `200 OK` ;
- `https://www.louis94.com/checkout/` redirige vers le panier quand le panier est vide ;
- `https://www.louis94.com/wp-json/wc/store/v1/products` retourne `[]` ;
- `https://www.louis94.com/wp-json/wc/store/v1/cart` retourne un panier vide en EUR, pays FR, sans besoin de paiement ni livraison.

Acces admin/serveur :

- `https://www.louis94.com/wp-admin/` demande une connexion WordPress ;
- `https://louis94.com:2083/` demande une connexion cPanel ;
- SSH vers `louis94.com:22` a expire ;
- SSH vers `109.234.167.74:2222` a expire ;
- aucun dossier local `C:\Users\Vince\.ssh` trouve ;
- aucun acces WP-CLI exploitable n'a ete trouve dans l'environnement courant.

## Plan d'action minimal

1. Verifier WooCommerce via WP-CLI.
2. Creer un fichier test telechargeable non sensible.
3. Creer un produit simple, virtuel et telechargeable a 1 EUR.
4. Publier le produit test uniquement si une methode de paiement test est disponible.
5. Si aucun moyen de paiement test n'est disponible, garder le produit en brouillon ou configurer uniquement une passerelle de test explicite.
6. Tester ajout panier et checkout.
7. Passer une commande test sans paiement reel.
8. Verifier email client et lien de telechargement.
9. Verifier la commande dans WooCommerce.
10. Documenter les IDs produit/commande et l'etat final.

## Commandes WP-CLI proposees

Preflight :

```bash
cd /home/zivi5632/louis94.com
wp core version
wp option get home
wp option get siteurl
wp plugin list --fields=name,status,version --format=table
wp option get woocommerce_currency
wp option get woocommerce_default_country
wp option get woocommerce_downloads_grant_access_after_payment
wp option get woocommerce_file_download_method
wp post list --post_type=product --fields=ID,post_title,post_status --format=table
wp wc payment_gateway list --user=1 --format=table
```

Creer le fichier test :

```bash
mkdir -p wp-content/uploads/zydka-test-downloads
printf "Louis94 WooCommerce MVP test download\nMission: MVP-COM-2B\n" > wp-content/uploads/zydka-test-downloads/louis94-mvp-com-2b-test.txt
```

Creer le produit test :

```bash
wp post create \
  --post_type=product \
  --post_status=publish \
  --post_title="Produit test numerique MVP-COM-2B" \
  --post_content="Produit numerique de test pour validation WooCommerce MVP. Ne pas acheter en production." \
  --porcelain
```

Appliquer les metas produit, en remplacant `PRODUCT_ID` :

```bash
wp post meta update PRODUCT_ID _regular_price "1"
wp post meta update PRODUCT_ID _price "1"
wp post meta update PRODUCT_ID _virtual "yes"
wp post meta update PRODUCT_ID _downloadable "yes"
wp post meta update PRODUCT_ID _sold_individually "yes"
wp post meta update PRODUCT_ID _manage_stock "no"
wp post meta update PRODUCT_ID _stock_status "instock"
wp post meta update PRODUCT_ID _download_limit "1"
wp post meta update PRODUCT_ID _download_expiry "7"
wp term set PRODUCT_ID product_type simple
```

Ajouter le fichier telechargeable :

```bash
wp eval '
$product_id = PRODUCT_ID;
$file_url = content_url("uploads/zydka-test-downloads/louis94-mvp-com-2b-test.txt");
update_post_meta($product_id, "_downloadable_files", [
  md5($file_url) => [
    "name" => "Louis94 MVP-COM-2B test file",
    "file" => $file_url,
  ],
]);
wc_delete_product_transients($product_id);
'
```

Verification produit :

```bash
wp wc product get PRODUCT_ID --user=1 --format=json
```

Verifier commandes :

```bash
wp wc shop_order list --user=1 --format=table
wp wc shop_order get ORDER_ID --user=1 --format=json
```

## Checklist admin WordPress

- WooCommerce > Reglages > General : devise EUR, pays France.
- WooCommerce > Reglages > Produits > Produits telechargeables : methode de telechargement forcee, acces apres paiement actif.
- WooCommerce > Reglages > Paiements : confirmer qu'aucun paiement reel n'est actif pour le test sans validation.
- Produits > Ajouter : produit simple, virtuel, telechargeable, prix 1 EUR.
- Produit : fichier de test attache, limite de telechargement 1, expiration 7 jours.
- Boutique : produit visible uniquement si le test checkout est pret.
- Panier : ajout du produit OK.
- Checkout : coordonnees client test, aucun paiement reel.
- WooCommerce > Commandes : commande test creee, statut attendu confirme.
- Email client : reception email commande et lien de telechargement.
- Mon compte / page confirmation : lien de telechargement disponible.

## Resultat actuel

Statut : validee techniquement.

Resultat :

Tunnel produit numerique valide sur louis94.com :

```text
Produit -> panier -> checkout -> commande -> paiement test -> commande terminee
```

Produit numerique test cree et tunnel de vente minimal WooCommerce valide techniquement.

## Incident WooCommerce documente

Incident constate pendant la mission :

- WooCommerce etait actif ;
- la table `wpcq_woocommerce_downloadable_product_permissions` etait absente ;
- les outils/routines `verify_db_tables`, `db_update_routine` et `WC_Install::create_tables()` n'ont pas recree la table ;
- une sauvegarde SQL a ete realisee avant correction ;
- la table `wpcq_woocommerce_downloadable_product_permissions` a ete recreee manuellement ;
- les permissions de telechargement ont ensuite ete regenerees avec `wc_downloadable_product_permissions(116)`.

Decision :

La correction a ete limitee a la restauration de la table WooCommerce manquante et a la regeneration des permissions de telechargement du produit test. Aucun changement destructif n'est documente dans cette mission.

Regle projet ajoutee :

Voir `docs/project-rules.md` : ne plus considerer WooCommerce comme installe correctement sans verification explicite des tables critiques.

## Ancien blocage initial

Ce qui a ete valide sans authentification :

- WooCommerce repond publiquement ;
- les pages boutique/panier/checkout existent ;
- le Store API WooCommerce repond ;
- aucun produit public n'etait expose au moment de l'audit initial ;
- le panier public est vide et configure en EUR/FR.

Blocage initial leve apres acces/correction :

- audit WP-CLI authentifie ;
- creation du produit numerique test ;
- configuration/choix d'une methode de checkout test ;
- commande test ;
- verification email et livraison numerique ;
- verification commande dans WordPress.
