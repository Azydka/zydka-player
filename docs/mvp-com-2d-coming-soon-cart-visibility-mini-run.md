\# MVP-COM-2D-COMING-SOON-CART-VISIBILITY-MINI-RUN



Date : 2026-07-01



Statut : `PASS panier navigateur / rollback OK`



\## Résumé



Le mini-run avait pour objectif de vérifier si le panier WooCommerce redevenait visible côté navigateur lorsque le mode WooCommerce Coming Soon était temporairement désactivé.



Résultat : le panier navigateur a été confirmé.



Le produit `MVP Test Beat — Mémoire Vive`, variation `121 Basic`, est apparu dans `/cart/`.



Aucun checkout n’a été lancé. Aucune commande n’a été créée. Aucun paiement n’a été effectué.



Rollback effectué et confirmé.



\## Contexte



Le diagnostic précédent avait identifié que `/cart/` était intercepté par WooCommerce Coming Soon.



Options confirmées avant mini-run :



```text

woocommerce\_coming\_soon=yes

woocommerce\_store\_pages\_only=yes

