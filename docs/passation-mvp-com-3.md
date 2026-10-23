# Passation — MVP-COM-3 premier beat commercial

Date : 2026-10-23

Statut : **préflight documentaire terminé — NO-GO commercial, production inchangée**

## État du dépôt au départ

- `main = origin/main = 8f068b5` ;
- dépôt propre ;
- aucun stash ;
- un seul worktree ;
- aucune branche concurrente ;
- branche de travail : `docs/mvp-com-3-first-commercial-beat-preflight`.

## Travail réalisé

- lecture intégrale d’`AGENTS.md` et des passations récentes ;
- consolidation des jalons WooCommerce MVP-COM-2A à 2F ;
- revalidation HTTP publique anonyme des tracks, playlists, produits et pages WooCommerce ;
- comparaison officielle des solutions Stripe, WooPayments et PayPal sandbox ;
- inventaire commercial, technique et juridique ;
- recommandation de conserver 120 comme fixture de test et de créer un nouveau produit réel ;
- protocole GO/NO-GO/arrêt immédiat ;
- plan de lancement et liste exhaustive des futures écritures de production.

Livrable principal : `docs/mvp-com-3-first-commercial-beat-preflight.md`.

## Faits importants

- Player 0.3.2 et Manager 0.6.0 ne sont pas modifiés.
- Les tracks publiques 88, 90 et 92 sont `listen_only`, sans produit lié, avec des références Anderson .Paak ; aucune n’est retenue pour une vente sans preuve de droits.
- Produit 115 : ancien produit test simple public à 1 EUR.
- Produit 120 : `draft` / `hidden`, variations 121–123 et fichiers `.txt` de test.
- Commande 127 : annulée et conservée ; aucune permission de téléchargement.
- Coming Soon actif ; `cheque`, `bacs`, `cod` désactivés ; aucune extension Stripe, PayPal ou WooPayments.
- La base technique CTA/panier/checkout est validée, mais le contenu, les licences, le juridique, la fiscalité, le paiement sandbox et la livraison réelle ne sont pas prêts.

## Limite d’accès

Le connecteur privé Novamira n’était pas exposé dans cette session et aucune session navigateur authentifiée n’était ouverte. Les dernières lectures privées documentées du 2026-10-23 ont été recoupées avec des lectures HTTP publiques actuelles. Tous les champs privés non couverts sont explicitement marqués « à relire » ou « non vérifié » dans le rapport.

## Décisions attendues

Le propriétaire doit choisir :

- le beat et confirmer les droits ;
- le titre commercial ;
- les licences et leurs droits/restrictions ;
- les livrables ;
- les prix ;
- les limites de téléchargement ;
- le traitement fiscal et les pays de vente ;
- la stratégie de compte client ;
- le prestataire de paiement ;
- la date de publication.

Recommandations :

- nouveau produit réel en `draft` / `hidden`, produit 120 inchangé ;
- nouvelle track propre si aucun beat original existant n’est disponible ;
- extension officielle Stripe, d’abord en mode test, sous réserve de la décision du propriétaire ;
- validation juridique et comptable professionnelle avant toute mise en vente.

## Production

Aucune écriture en production. Aucun produit, track, fichier, commande, permission, passerelle, option, plugin ou donnée modifié. Aucun checkout, aucune commande et aucun paiement lancés.

Toute étape suivante en production exige un nouvel accord explicite.

## Validation Git

Validations exécutées avant fusion conformément à `AGENTS.md` :

| Commande | Résultat |
| --- | --- |
| `pnpm test` | PASS — audio-engine 3/3, zydka-plugin 49/49 |
| `pnpm --filter @zydka/zydka-plugin typecheck` | PASS |
| `pnpm package:wp` | PASS |
| `git diff --check` | PASS |

`package:wp` a réécrit `apps/zydka-plugin/assets/js/zydka-player.js` en LF et recréé `dist/zydka-player.zip`. Le JS suivi par Git a été restauré exactement à `HEAD`, et le ZIP courant a été remplacé par la copie 0.3.2 déjà validée.

Contrôle final :

- version PHP : 0.3.2 ;
- `ZYDKA_PLAYER_VERSION` : 0.3.2 ;
- SHA-256 `dist/zydka-player.zip` : `3E50BA4A1DF54504DA8AD8588D553F08E0DB49BE46A83B42B50AEA6A4C2E7B85` ;
- SHA-256 `dist/zydka-player-0.3.2.zip` : identique ;
- aucun artefact Player dans le diff Git.

## Prochaine action la plus petite

Décision hors production : fournir le nom du beat original retenu, confirmer la chaîne de droits, puis fixer les trois licences et leurs prix. Ne rien modifier sur le site avant cette décision.
