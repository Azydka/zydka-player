# Passation — MVP-COM-2E checkout contrôlé

## État du dépôt

- Départ : `main` = `origin/main` = `a4cd462`.
- Travail fait sur `docs/mvp-com-2e-preflight-20261023`, fusionné dans `main` avec `--no-ff`, puis branche supprimée.
- Aucun code, aucune version et aucun ZIP du lecteur modifiés.

## Fait

- 2026-10-23 : préflight lecture seule, **PASS**, aucun écart. Voir `docs/mvp-com-2e-preflight-readonly-pass-2026-10-23.md`.
- 2026-10-23 : run contrôlé, **PASS**, après accord explicite du propriétaire. Commande test **127** (`on-hold`, 29,00 EUR, chèque, variation 121). Rollback fait et vérifié. Voir `docs/mvp-com-2e-checkout-controlled-run-result.md`.

## État de production laissé

- Produit 120 : `draft` / `hidden`.
- `cheque`, `bacs`, `cod` : désactivés. Aucune extension Stripe, PayPal ou WooPayments installée.
- `woocommerce_coming_soon=yes`, `woocommerce_store_pages_only=yes`.
- Commandes : 116 (ancienne) et 127 (test MVP-COM-2E).

## Attend une décision du propriétaire

- **MVP-COM-2F-TEST-ORDER-CLEANUP** : annuler, conserver ou supprimer la commande 127. Rien n'a été fait dessus.
- Optionnel : tester l'octroi des téléchargements en passant une commande test en `completed` (ce serait une modification de production à autoriser).

## MVP-COM-2F (2026-10-23)

- Le propriétaire a choisi d'annuler la commande 127, sans la supprimer.
- Préflight lecture seule PASS, protocole prêt : `docs/mvp-com-2f-test-order-cleanup.md`.
- Annulation **non exécutée** : elle attend un accord explicite. Branche `docs/mvp-com-2f-test-order-cleanup`, non fusionnée.
