# MVP-COM-2A - WooCommerce Setup Minimal Controle

Date : 2026-06-28

## Objectif

Documenter la mission MVP-COM-2A : mise en place minimale et controlee de WooCommerce sur louis94.com pour preparer un futur test de vente numerique.

Cette mission ne versionne pas WooCommerce, ne contient aucun backup SQL, et ne modifie pas le theme Louis94, Zydka Player, Zydka Player Manager ou Zydka Analytics.

## Preflight

Racine WordPress cible :

```text
/home/zivi5632/louis94.com
```

Etat connu avant intervention :

- WordPress repond via WP-CLI.
- Home/siteurl : `https://www.louis94.com`.
- Theme actif : `louis94-theme` 0.1.0.
- Plugins actifs avant setup WooCommerce :
  - `novarian` 7.0
  - `zydka-analytics` 0.9.1
  - `zydka-player` 0.6.3
  - `zydka-player-manager` 0.5.0
- WooCommerce etait absent.
- Stripe absent.
- PayPal absent.
- Aucun produit beat/kit reel cree.

## Backup

Un backup SQL logique a ete cree avant modification :

```text
/home/zivi5632/louis94-backups/louis94-before-woocommerce-mvp-com-2a-20260628-213002.sql
```

Taille constatee : `793K`.

Le fichier SQL n'est pas ajoute au depot.

## WooCommerce installe

WooCommerce a ete installe et active sur louis94.com.

Version installee :

```text
WooCommerce 10.9.1
```

Aucun dossier WooCommerce vendor n'est ajoute au depot dans le cadre de cette trace documentaire.

## Pages creees

Pages WooCommerce creees :

| Page | ID | Statut |
| --- | ---: | --- |
| Shop | 108 | publiee |
| Cart | 109 | publiee |
| Checkout | 110 | publiee |
| My account | 111 | publiee |
| Refund and Returns Policy | 112 | draft |

## Reglages numeriques

Reglages WooCommerce minimaux appliques :

```text
woocommerce_currency = EUR
woocommerce_default_country = FR
woocommerce_downloads_grant_access_after_payment = yes
woocommerce_file_download_method = force
```

Reglages volontairement non effectues en MVP-COM-2A :

- pas de TVA configuree ;
- pas de Stripe configure en production ;
- pas de PayPal configure en production ;
- pas de vraies licences creees ;
- pas de vrais produits beats/kits crees.

Note : les paiements crypto sont envisages pour une phase ulterieure. Ils ne sont pas actives dans MVP-COM-2A.

## Non-regression Zydka

Controle apres setup :

- `zydka-analytics` actif en version 0.9.1 ;
- `zydka-player` actif en version 0.6.3 ;
- `zydka-player-manager` actif en version 0.5.0 ;
- tracks visibles ;
- catalogues visibles ;
- tables Zydka presentes.

Aucun evenement analytics n'a ete envoye dans le cadre de cette verification.

## Ce qui reste a faire

Avant une vente reelle, les points suivants restent a traiter :

- configuration Stripe et/ou PayPal ;
- configuration TVA ;
- CGV et licences ;
- mentions legales ;
- politique de confidentialite publiee ;
- page Contact ;
- produit numerique test ;
- test de checkout ;
- test d'achat reel uniquement quand le cadre legal et paiement sera pret.

## Decision

La base WooCommerce minimale est en place pour preparer la suite du MVP commerce.

Prochaine mission recommandee :

```text
MISSION MVP-COM-2B - Produit numerique test WooCommerce + checkout test
```

## Confirmation de perimetre

Cette documentation confirme :

- aucune modification du theme Louis94 ;
- aucune modification de Zydka Player ;
- aucune modification de Zydka Player Manager ;
- aucune modification de Zydka Analytics ;
- aucun vrai produit beat/kit cree ;
- aucun paiement production configure ;
- aucun backup SQL ajoute au depot ;
- aucun secret, mot de passe, cle API ou token ajoute au depot ;
- aucun dossier WooCommerce vendor ajoute au depot.
