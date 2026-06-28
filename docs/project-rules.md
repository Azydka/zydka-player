# Regles projet

## WooCommerce - verification des tables critiques

Decision projet a partir de MVP-COM-2C :

Ne plus considerer WooCommerce comme "installe correctement" seulement parce que le plugin est actif, que les pages existent, ou que l'interface publique repond.

Avant toute mission commerce WooCommerce, verifier explicitement les tables critiques en base de donnees.

Contexte incident MVP-COM-2B :

- WooCommerce etait actif sur louis94.com ;
- le tunnel public WooCommerce repondait ;
- la table `wpcq_woocommerce_downloadable_product_permissions` etait absente ;
- `verify_db_tables`, `db_update_routine` et `WC_Install::create_tables()` n'ont pas recree la table ;
- la table a ete recreee manuellement apres sauvegarde SQL ;
- les permissions de telechargement ont ete regenerees avec `wc_downloadable_product_permissions(116)` ;
- le tunnel produit numerique a ensuite ete valide techniquement.

Controle minimal obligatoire :

```bash
cd /home/zivi5632/louis94.com
wp db tables --all-tables | grep 'woocommerce'
wp db query "SHOW TABLES LIKE 'wpcq_woocommerce_%';"
wp db query "SHOW TABLES LIKE 'wpcq_wc_%';"
wp db query "SHOW TABLES LIKE 'wpcq_actionscheduler_%';"
```

Tables WooCommerce a surveiller au minimum :

- `wpcq_woocommerce_downloadable_product_permissions` ;
- `wpcq_woocommerce_order_items` ;
- `wpcq_woocommerce_order_itemmeta` ;
- `wpcq_woocommerce_payment_tokens` ;
- `wpcq_woocommerce_payment_tokenmeta` ;
- `wpcq_woocommerce_tax_rates` ;
- `wpcq_woocommerce_tax_rate_locations` ;
- `wpcq_wc_product_meta_lookup` ;
- `wpcq_wc_order_stats` ;
- `wpcq_wc_order_product_lookup` ;
- `wpcq_wc_order_tax_lookup` ;
- `wpcq_wc_order_coupon_lookup` ;
- `wpcq_wc_customer_lookup` ;
- tables `wpcq_wc_orders*` si HPOS est actif ;
- tables `wpcq_actionscheduler_*` pour les taches WooCommerce.

Commande de controle cible pour les permissions de telechargement :

```bash
wp db query "DESCRIBE wpcq_woocommerce_downloadable_product_permissions;"
```

Regle de decision :

- Si une table critique est absente, stopper la mission fonctionnelle.
- Faire une sauvegarde SQL avant toute correction.
- Documenter l'absence, la commande de verification, la correction appliquee et la verification finale.
- Ne reprendre les tests produit/checkout qu'apres confirmation des tables critiques.
