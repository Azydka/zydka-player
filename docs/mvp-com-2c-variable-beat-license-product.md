## Execution serveur controlee MVP-COM-2C-RUN

Date : 2026-06-29

Resultat : succes controle, sans checkout.

Produit cree :

- ID produit : `120`
- Nom : `MVP Test Beat — Mémoire Vive`
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