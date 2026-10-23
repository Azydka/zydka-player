# MVP-COM-3 — Préflight du premier beat commercial

Date : 2026-10-23

Statut : **préflight terminé — NO-GO commercial en l’état**

Ce document est un audit et un plan. Il n’autorise et n’exécute aucune modification de WordPress, WooCommerce, des produits, des tracks, des commandes, des passerelles, des options, de la base ou des fichiers de production.

## Verdict exécutif

La chaîne technique est prometteuse : le CTA par track, le panier, le checkout, la création d’une commande et le rollback ont déjà été validés. La boutique ne peut toutefois pas vendre un beat réel aujourd’hui.

Les blocages principaux sont :

1. aucun des trois contenus audio publiés n’est démontré comme étant un beat Louis94 commercialisable ; les métadonnées visibles les rattachent à Anderson .Paak et aucune preuve de droits n’est documentée ;
2. le produit 120 et ses trois variations sont des fixtures de test avec titre, SKU et fichiers `.txt` factices ;
3. les licences Basic, Standard et Premium n’ont pas de texte contractuel, de droits ni de restrictions définis ;
4. les pages et consentements commerciaux/juridiques indispensables ne sont pas publiés ou pas vérifiés ;
5. la fiscalité n’est pas configurée pour une vente réelle ;
6. aucune passerelle de paiement en mode test ou en production n’est installée ;
7. l’octroi réel des téléchargements, l’e-mail client et `Mon compte > Téléchargements` n’ont pas été validés avec le produit variable.

**Recommandation : conserver le produit 120 comme modèle de test immuable et créer un nouveau produit réel, en recopiant seulement les réglages validés après relecture.** Ne pas dupliquer aveuglément les fichiers, SKU, textes ou métadonnées de test.

La plus petite prochaine action sans risque est une décision du propriétaire, hors production : choisir un beat dont les droits de vente et de licence sont établis, puis fixer son titre commercial, les licences, les prix et la date cible.

## Périmètre et méthode

### Faits vérifiés

- Dépôt au départ : `main = origin/main = 8f068b5`, propre, aucun stash, un seul worktree et aucune branche concurrente.
- Passations et dossiers de preuve relus, notamment :
  - `docs/passation-zydka-player-manager-0.6.0.md` ;
  - `docs/passation-mvp-com-2e.md` ;
  - `docs/mvp-com-2c-variable-beat-license-product.md` ;
  - `docs/mvp-com-2e-preflight-readonly-pass-2026-10-23.md` ;
  - `docs/mvp-com-2e-checkout-controlled-run-result.md` ;
  - `docs/mvp-com-2f-test-order-cleanup.md`.
- Dernières lectures privées WP-CLI documentées le 2026-10-23 : produit 120 `draft` / `hidden`, commande 127 `cancelled`, `cheque`, `bacs` et `cod` désactivés, Coming Soon actif, aucune extension Stripe, PayPal ou WooPayments.
- Revalidation HTTP publique anonyme le 2026-10-23 vers 02:34, heure de Paris :
  - trois tracks publiées, IDs 88, 90 et 92 ;
  - deux playlists publiées, IDs 76 et 97 ;
  - playlist publique 97 accessible et trois tracks `listen_only`, sans produit lié ;
  - Store API : un seul produit public, l’ancien produit test simple 115 à 1 EUR ;
  - pages Shop 108, Cart 109, Checkout 110 et My account 111 publiées ;
  - `/cart/` répond 200, `/checkout/` avec panier vide redirige vers `/cart/`, `/my-account/` répond 200, `/?p=120` répond 404 comme attendu pour un brouillon.
- Documentation officielle WooCommerce consultée pour les modes de test et la livraison numérique.
- Sources officielles françaises consultées uniquement pour identifier les sujets à faire valider professionnellement, sans formuler de conclusion juridique définitive.

### Limite de preuve

Le connecteur Novamira utilisé dans les passations précédentes n’est pas disponible dans cette session et aucune session navigateur authentifiée n’était ouverte. Les champs privés de production sont donc classés selon leur niveau de preuve :

- **actuel public** : revérifié par requête HTTP anonyme le 2026-10-23 ;
- **actuel documenté** : dernière lecture privée WP-CLI documentée le 2026-10-23 ;
- **historique** : vérifié lors d’un jalon antérieur, à relire avant toute écriture ;
- **non vérifié** : aucune preuve suffisante ; valeur à obtenir par un nouveau préflight privé en lecture seule.

Cette limite n’autorise aucune supposition. Un champ non vérifié devient un critère NO-GO avant lancement.

## 1. Inventaire des tracks

La production expose trois tracks publiques. Elles appartiennent toutes à la playlist 97 « Test 1 » et n’ont aucun produit lié.

| ID | Slug / contenu observé | Métadonnées du payload Manager | État commercial |
| ---: | --- | --- | --- |
| 88 | `right-there` ; fichier `15-anderson_.paak-right_there-ftd.mp3` | artiste `Anderson paak`, album `Venice`, cover générique Venice, `productId=0`, `downloadUrl` vide, `commercialStatus=listen_only` | **non commercialisable sans preuve de droits** ; entrée de test |
| 90 | `get-em-up` ; audio `10-anderson_.paak-get_em_up-ftd.mp3` ; titre WordPress erroné pointant vers un autre fichier | artiste `Anderson Paak`, album `Venice`, même cover, `productId=0`, `downloadUrl` vide, `commercialStatus=listen_only` | **non commercialisable sans preuve de droits** ; métadonnées incohérentes |
| 92 | slug et titre dérivés de `07-anderson_.paak-already_ft._sir-ftd.mp3` | artiste `Anderson Paak feat Sir`, album `Venice`, même cover, `productId=0`, `downloadUrl` vide, `commercialStatus=listen_only` | **non commercialisable sans preuve de droits** ; entrée de test |

Autres constats publics : contenu WordPress vide, `featured_media=0`, BPM à 0, tonalité, humeur et style vides. La cover visible provient d’une URL commune aux trois tracks ; elle ne constitue pas une cover commerciale propre à un beat.

### Recommandation track

Ne sélectionner aucune de ces trois entrées pour la première vente tant que le propriétaire n’a pas fourni une preuve exploitable de droits. Le choix le moins risqué est d’importer ou de créer une nouvelle track pour un beat original, avec :

- titre propre ;
- artiste Louis94 ;
- extrait d’écoute distinct du fichier livré ;
- cover originale et droits documentés ;
- métadonnées propres ;
- produit réel lié seulement après validation complète.

Cette recommandation ne crée aucune track et ne modifie aucune track existante.

## 2. Produits existants

### Produit 115

Faits publics actuels :

- `Louis94 Test Download — MVP` ;
- produit simple, publié, visible et achetable ;
- 1,00 EUR ;
- catégorie `Test` ;
- description explicitement factice ;
- aucune image publique ;
- ancien produit utilisé pour la validation MVP-COM-2B.

Conclusion : ce produit doit rester un produit technique de test et ne doit pas devenir le premier beat.

### Produit 120

Dernier état privé documenté le 2026-10-23 :

- nom : `MVP Test Beat — Mémoire Vive` ;
- type : variable ;
- statut : `draft` ;
- visibilité catalogue : `hidden` ;
- prix minimum : 29 EUR ;
- achetable selon l’API privée, mais inaccessible publiquement tant qu’il reste brouillon ;
- URL publique directe : 404, résultat revérifié ;
- commande test 127 annulée et conservée comme preuve ;
- aucune track liée.

Il s’agit d’un modèle technique, pas d’un produit commercial final.

## 3. Audit des variations et licences

### Tableau de préparation

| Champ | Basic — 121 | Standard — 122 | Premium — 123 |
| --- | --- | --- | --- |
| Nom de licence | `Basic` | `Standard` | `Premium` |
| Prix | 29 EUR | 99 EUR | 299 EUR |
| SKU | `MVP-MEMOIRE-VIVE-BASIC` | `MVP-MEMOIRE-VIVE-STANDARD` | `MVP-MEMOIRE-VIVE-PREMIUM` |
| Statut | `publish` au niveau variation, relu le 2026-10-23 | existence confirmée historiquement ; statut actuel à relire | existence confirmée historiquement ; statut actuel à relire |
| Attribut | attribut produit custom `Licence=Basic`, relu | `Licence=Standard` issu de la création ; à relire | `Licence=Premium` issu de la création ; à relire |
| Virtuel | `true`, relu | `true`, historique | `true`, historique |
| Téléchargeable | `true`, relu | `true`, historique | `true`, historique |
| Fichier | `louis94-memoire-vive-basic-test.txt` ; factice | `louis94-memoire-vive-standard-test.txt` ; factice | `louis94-memoire-vive-premium-test.txt` ; factice |
| Libellé de téléchargement | `Licence Basic - fichier test`, relu | non relu | non relu |
| Limite | 5 téléchargements | 5, historique | 5, historique |
| Expiration | 30 jours | 30 jours, historique | 30 jours, historique |
| Stock | `in_stock=true`, `manage_stock=false` | `in_stock=true`, historique ; gestion de stock à relire | `in_stock=true`, historique ; gestion de stock à relire |
| Achetable | `true`, relu | `true`, historique | `true`, historique |
| Prix promo | vide, relu | à relire | à relire |
| Statut fiscal | **non vérifié** | **non vérifié** | **non vérifié** |
| Classe fiscale | **non vérifiée** | **non vérifiée** | **non vérifiée** |
| État commercial | **factice / incomplet** | **factice / incomplet** | **factice / incomplet** |

Le produit parent est `draft`, donc ces variations ne sont pas actuellement vendables au public même si certaines propriétés individuelles indiquent `purchasable=true`.

### Éléments prêts

- structure de produit variable validée ;
- attribut custom `Licence` validé ;
- trois paliers de prix et SKU de test ;
- variations virtuelles et téléchargeables ;
- règles techniques de limite et d’expiration ;
- dossier `woocommerce_uploads` accepté par WooCommerce ;
- table des permissions de téléchargement présente lors du dernier préflight privé ;
- ajout au panier et checkout Basic déjà éprouvés.

### Éléments factices ou incomplets

- titres, slug et SKU contiennent encore la logique MVP/test ;
- les trois fichiers sont des `.txt` de test ;
- aucun master audio, stems, WAV, MP3 ou archive de livraison n’est documenté ;
- aucun texte de licence n’est joint ;
- aucun visuel produit réel ;
- Standard et Premium n’ont pas été testées de bout en bout ;
- statut et classe fiscale non vérifiés ;
- contenu réel des fichiers et contrôle d’accès non validés ;
- aucune permission de téléchargement n’a été créée pour la commande 127.

## 4. Réutiliser 120 ou créer un produit réel

| Option | Avantages | Risques |
| --- | --- | --- |
| Réutiliser 120 | moins d’objets à créer ; structure déjà éprouvée ; variation Basic déjà testée | mélange durable test/réel ; commande 127 attachée à ce produit ; titres, slug, SKU et fichiers factices à remplacer ; risque d’oublier une donnée de test ; historique d’audit brouillé ; modification des fichiers pouvant affecter des permissions passées ; rollback plus difficile |
| Créer un nouveau produit réel à partir de la structure | séparation nette test/réel ; produit 120 conservé comme fixture ; audit et rollback simples ; SKU, fichiers, textes et prix décidés explicitement ; aucune ambiguïté avec la commande 127 | davantage de champs à vérifier ; nécessite de rejouer un test complet ; duplication aveugle à éviter |

### Recommandation

Créer un nouveau produit réel en `draft` / `hidden`, en utilisant 120 comme checklist manuelle et non comme source à cloner sans contrôle. Conserver 120, 121, 122 et 123 inchangés pour les futurs tests techniques. Cette option réduit le risque de contamination par les fichiers et libellés factices et protège la traçabilité de la commande 127.

## 5. Contenu commercial et juridique

### Inventaire actuel

| Élément | État vérifié | Verdict |
| --- | --- | --- |
| Description du beat | aucune description commerciale réelle | manquant |
| Titre commercial | `MVP Test Beat — Mémoire Vive`, titre de test | à décider |
| Cover / visuels produit | aucune image de produit démontrée ; cover générique des tracks de test | manquant |
| Texte Basic | absent | manquant |
| Texte Standard | absent | manquant |
| Texte Premium | absent | manquant |
| Droits accordés | non définis | bloquant |
| Restrictions | non définies | bloquant |
| Preuve des droits sur l’audio et la cover | non documentée | bloquant prioritaire |
| Politique de remboursement / retours | page 112 créée en `draft` lors du setup ; aucune page publique correspondante aujourd’hui | bloquant |
| CGV | aucune page publique identifiée | bloquant |
| Politique de confidentialité | aucune page publique identifiée | bloquant |
| Mentions légales | aucune page publique identifiée | bloquant |
| Contact commercial | aucune page publique identifiée ; seul le nom Louis94 apparaît dans le footer | bloquant |
| Médiation / litiges | non documenté | à faire valider |
| Consentement CGV au checkout | non observé et non vérifié | NO-GO |
| Consentement contenu numérique / exécution immédiate | non observé et non vérifié | NO-GO |
| Reconnaissance de perte du droit de rétractation | non observée et non vérifiée | NO-GO |
| Confirmation durable de ces consentements | non vérifiée dans l’e-mail ou la commande | NO-GO |

### Points à faire valider professionnellement

Ce préflight n’est pas un avis juridique. Avant une vente B2C, faire valider au minimum :

- l’identité du vendeur, les mentions légales, les coordonnées et le médiateur compétent ;
- les CGV, la politique de remboursement et la procédure de réclamation ;
- l’étendue exacte des licences (usage commercial, streams, ventes, spectacles, vidéo, Content ID, crédit, modifications, transfert, exclusivité ou non) ;
- la territorialité, la durée, les limites quantitatives, les interdictions et le traitement des samples ;
- les fonctionnalités, formats, compatibilités et modalités de livraison du contenu numérique ;
- le recueil séparé et traçable du consentement à l’exécution immédiate et de la reconnaissance de la perte du droit de rétractation lorsque ce régime est applicable ;
- la politique de confidentialité, les durées de conservation et les sous-traitants de paiement/e-mail ;
- la TVA et les obligations comptables selon le statut du vendeur et les pays servis.

Sources officielles consultées :

- [Code de la consommation, article L221-28](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044563170/2026-05-04) ;
- [Code de la consommation, article L221-5](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000053310511/2026-06-26) ;
- [DGCCRF — Guide du vendeur e-commerce](https://www.economie.gouv.fr/files/files/directions_services/dgccrf/media-document/guide-dgccrf-vendeur-e-commerce.pdf) ;
- [CNIL — Communiquer et vendre en ligne](https://www.cnil.fr/sites/default/files/atoms/files/bpi-cnil-rgpd_fiche-1_que-faire-quand-votre-entreprise-communique-vend-en-ligne.pdf).

## 6. Configuration WooCommerce

| Domaine | Fait vérifié | État avant vente |
| --- | --- | --- |
| Devise | EUR | prêt techniquement |
| Pays par défaut | FR | prêt techniquement, zones de vente à décider |
| Taxes | pas de TVA configurée lors du setup ; commande 127 à taxe 0,00 | **bloquant**, décision comptable/fiscale puis relecture privée |
| Boutique | page 108 publiée, HTTP 200 | prête techniquement |
| Panier | page 109 publiée, HTTP 200 ; Coming Soon servi | prête techniquement |
| Checkout | page 110 publiée ; panier vide redirigé vers le panier | prête techniquement, contenus/consentements à valider |
| Mon compte | page 111 publiée, HTTP 200 | page présente ; inscription non affichée publiquement |
| Création de compte | commande 127 passée en invité (`customer_id=0`) ; My account affiche uniquement la connexion | stratégie à décider et option checkout à relire |
| Méthode de téléchargement | `force`, dernière preuve privée historique | à relire avant test |
| Accès après paiement | `yes`, dernière preuve privée historique | à relire avant test |
| Limites / expiration | 5 / 30 jours sur le modèle | décision commerciale à confirmer |
| E-mails de commande | e-mails admin et client déclenchés lors du run 127 ; adresse client factice non délivrable | mécanisme déclenché, contenu et délivrabilité non validés |
| E-mail de téléchargement | jamais validé avec 120 | manquant |
| Téléchargement réel | jamais validé avec un fichier commercial | manquant |
| HPOS | actif ; tables critiques présentes au dernier préflight privé | prêt, à relire avant écriture |
| Coming Soon | `yes`, `store_pages_only=yes` | état sûr actuel |
| Catalogue | produit 115 public ; produit 120 `draft` / `hidden` ; aucune track liée | aucun produit réel prêt |
| Permaliens | pages WooCommerce et endpoints publics répondent ; slug du futur produit non décidé | base prête |

À noter : la documentation WooCommerce indique que l’accès après paiement peut être accordé en `processing`, et qu’une commande composée uniquement de produits virtuels et téléchargeables passe normalement directement à `completed` après confirmation du paiement. Voir [Digital/Downloadable Product Guide](https://woocommerce.com/document/digital-downloadable-product-handling/) et [Variable Products](https://woocommerce.com/document/variable-product/).

## 7. Paiement de test et lancement

État actuel documenté :

- `cheque`, `bacs`, `cod` désactivés ;
- seules ces trois passerelles cœur sont enregistrées ;
- aucune extension Stripe, PayPal ou WooPayments installée ;
- aucune passerelle live active.

### Comparaison

| Option | Mode de test | Prérequis | Risques / coût opérationnel |
| --- | --- | --- | --- |
| Extension officielle Stripe pour WooCommerce | connexion Stripe de test séparée puis option `Enable test mode` ; cartes de test | installer l’extension, compte Stripe ou compte de test, connexion, webhooks, vérification du statut test | confusion test/live, webhooks ou 3-D Secure à valider ; compte externe ; ne jamais tester avec une vraie carte |
| WooPayments | compte de test ou mode test ; commandes et e-mails marqués test | installer WooPayments ; connexion WordPress.com requise même pour un compte de test ; France supportée | dépendance WordPress.com supplémentaire, onboarding et réglages plus larges, risque d’activer le live par erreur |
| WooCommerce PayPal Payments | Sandbox Mode, compte marchand et compte acheteur sandbox | installer l’extension, compte PayPal Business/developer, identifiants sandbox | redirection et deux identités sandbox, plus de pièces mobiles pour un premier test |

Sources officielles :

- [Tester l’extension Stripe](https://woocommerce.com/document/stripe/customer-experience/testing/) ;
- [Tester WooPayments](https://woocommerce.com/document/woopayments/testing-and-troubleshooting/testing/) ;
- [Comptes de test WooPayments](https://woocommerce.com/document/woopayments/testing-and-troubleshooting/test-accounts/) ;
- [Disponibilité WooPayments en France](https://woocommerce.com/document/woopayments/compatibility/countries/) ;
- [Onboarding et sandbox PayPal Payments](https://woocommerce.com/document/woocommerce-paypal-payments/account-setup-and-onboarding/).

### Recommandation paiement

Pour le premier lancement, privilégier **l’extension officielle Stripe pour WooCommerce**, d’abord avec une connexion strictement test. Elle permet un paiement carte proche du parcours final sans la dépendance WordPress.com obligatoire de WooPayments et sans le double parcours marchand/acheteur de PayPal Sandbox.

Prérequis : décision du propriétaire sur le prestataire, compte Stripe, identité d’entreprise prête, installation autorisée, sauvegarde, connexion de test, webhooks fonctionnels, confirmation visuelle et serveur du mode test. PayPal peut être ajouté dans une phase ultérieure si la demande client le justifie.

Aucune installation, connexion, activation ou configuration n’a été exécutée.

## 8. Risques et blocages classés

### P0 — arrêt absolu

1. **Droits audio/cover non établis.** Les tracks visibles portent des références Anderson .Paak. Aucun contenu ne doit être vendu sans chaîne de droits validée.
2. **Licences inexistantes.** Aucun droit accordé ni restriction n’est défini.
3. **Cadre consommateur incomplet.** CGV, confidentialité, mentions légales, remboursement et consentements numériques absents/non vérifiés.
4. **Fiscalité non décidée.** Aucun lancement tant que TVA, pays de vente et classes fiscales ne sont pas validés.
5. **Aucun vrai fichier de livraison.** Les trois téléchargements sont des `.txt` factices.

### P1 — bloque le test de bout en bout

1. aucune passerelle sandbox installée ;
2. statut/classe fiscale et certains champs des variations 122/123 non relus ;
3. e-mail de téléchargement et délivrabilité non validés ;
4. permission de téléchargement, fichier réel et espace Mon compte non validés ;
5. stratégie compte invité/compte client non décidée ;
6. visuels, description et métadonnées commerciales manquants.

### P2 — dette et confusion

1. produit test 115 toujours publié et achetable à 1 EUR ;
2. tracks de test publiques avec titres URL et métadonnées incohérentes ;
3. playlists nommées `Test 1` et `bang catalogue` ;
4. produit 120 et commande 127 à conserver clairement comme fixtures de test.

Le traitement de ces dettes demande un jalon séparé et un accord explicite, surtout pour toute dépublication, suppression ou modification.

## 9. Décisions attendues du propriétaire

Avant tout travail en production :

1. beat choisi et preuve de droits sur audio, samples et cover ;
2. titre commercial, slug souhaité, artiste et métadonnées ;
3. contenu livré par licence : MP3, WAV, stems, archive, contrat PDF, autres ;
4. droits/restrictions Basic, Standard, Premium et éventuelle licence Exclusive ;
5. prix TTC/HT de chaque licence, devise et éventuelles limites de vente ;
6. limites/expiration des téléchargements ;
7. pays desservis et cible B2C, B2B ou mixte ;
8. traitement fiscal validé avec un professionnel ;
9. politique de remboursement et régime de rétractation validés ;
10. compte client obligatoire, optionnel ou achat invité ;
11. Stripe recommandé, WooPayments, PayPal, ou autre prestataire ;
12. date et créneau de publication ;
13. sort du produit test public 115, dans un jalon distinct ;
14. conservation du produit 120 comme fixture de test, option recommandée.

## 10. Protocole contrôlé à préparer

Ce protocole n’est pas autorisé par le présent document. Chaque phase écrivant en production demande un accord explicite distinct.

### Préconditions GO

- droits, licences, fiscalité et textes légaux validés ;
- nouveau produit réel complet en `draft` / `hidden` ;
- trois variations relues champ par champ ;
- fichiers réels vérifiés par hash, non accessibles anonymement ;
- passerelle connectée uniquement en mode test ;
- sauvegardes et snapshots de rollback vérifiés ;
- Coming Soon actif au départ ;
- compteur des commandes relevé ;
- fenêtre privée neuve et panier vide ;
- autorisation explicite pour une seule commande test.

### Séquence unique

1. **CTA Player** : lier temporairement la track réelle au nouveau produit testable ; vérifier que seule cette track expose le bon CTA et la bonne URL.
2. **Page produit** : publier temporairement le produit en visibilité `hidden` ; vérifier titre, cover, description, licences, prix, taxes, stock et textes légaux.
3. **Licence** : choisir uniquement la variation explicitement autorisée pour le test ; vérifier SKU et fichier attendu.
4. **Panier** : quantité 1, un seul produit, aucune livraison physique, total et taxes exacts.
5. **Checkout** : données client de test dédiées, CGV et consentements numériques visibles, aucun mode live.
6. **Paiement test** : utiliser uniquement les données de test officielles du prestataire ; un clic final, aucune répétition.
7. **Commande** : relever l’unique nouvel ID, le marqueur sandbox, le montant, la variation et l’identifiant de transaction test.
8. **Statut** : accepter `processing` ou `completed` seulement si la passerelle confirme le paiement test ; pour un panier 100 % virtuel et téléchargeable, `completed` est le comportement normalement attendu.
9. **E-mail client** : vérifier réception, identité du vendeur, variation, prix, statut, consentements et lien de téléchargement.
10. **Permission** : vérifier une permission pour le bon ordre, le bon e-mail, la bonne variation, la bonne limite et la bonne expiration.
11. **Téléchargement réel** : télécharger une fois, vérifier nom, taille, hash, contenu et décrément du compteur ; confirmer qu’aucune autre licence n’est accessible.
12. **Compte client** : si un compte est prévu, vérifier `Mon compte > Téléchargements` ; sinon documenter le parcours invité par e-mail/order received.
13. **Nettoyage de la commande test** : statut, révocation éventuelle des permissions et conservation/suppression selon une décision explicite distincte ; ne jamais créer une seconde commande.
14. **Rollback complet** : rétablir Coming Soon, remettre le produit en `draft` / `hidden`, retirer la liaison track-produit, désactiver la passerelle de test si prévu, vider le panier/session de test et comparer tous les snapshots.

### Critères GO

- parcours unique terminé sans argent réel ;
- ordre marqué test et statut cohérent ;
- e-mail reçu ;
- permission exacte et fichier exact ;
- accès Mon compte conforme à la stratégie décidée ;
- aucune autre variation ou donnée exposée ;
- rollback intégral prouvé.

### Critères NO-GO

- un seul prérequis P0 ou P1 manque ;
- droits ou textes non validés ;
- prix, taxe, SKU, fichier, limite ou expiration diffère de la décision ;
- une passerelle live apparaît ;
- panier contient autre chose qu’une unité de la variation autorisée ;
- e-mail, permission ou téléchargement échoue ;
- produit, CTA ou fichiers deviennent publics plus largement que prévu ;
- rollback non démontré.

### Arrêt immédiat

- demande de vraie carte ou débit réel ;
- mode test non prouvé dans l’interface et côté serveur ;
- redirection vers un compte live ou un prestataire inattendu ;
- création d’une commande avant le clic final ;
- création de plus d’une commande ;
- fichier téléchargeable accessible sans permission ;
- lien donnant accès à la mauvaise licence ;
- impossibilité de réactiver Coming Soon, de remettre le produit en brouillon, de désactiver la passerelle ou de retirer la liaison CTA ;
- toute erreur non comprise : ne pas réessayer, rollback immédiat.

## 11. Plan de lancement par phases

### Phase 0 — décisions hors production

Choisir le beat, confirmer les droits, fixer titre, licences, livrables, prix, fiscalité, prestataire de paiement, stratégie de compte et date.

### Phase 1 — assets et validation professionnelle

Finaliser audio, previews, cover, contrats de licence, CGV, confidentialité, remboursement, mentions légales, contact, consentements checkout et traitement fiscal.

### Phase 2 — sauvegarde et construction sûre

Après accord explicite : sauvegarde SQL et fichiers, snapshots des options et commandes, création d’une nouvelle track et d’un nouveau produit en `draft` / `hidden`, upload des fichiers réels, configuration des variations et relecture croisée. Ne pas toucher à 120.

### Phase 3 — paiement sandbox

Après nouvel accord explicite : installer l’extension choisie, la connecter au compte de test, vérifier les webhooks, activer uniquement le mode test et confirmer l’absence de toute passerelle live.

### Phase 4 — validation unique

Après nouvel accord explicite : exécuter le protocole ci-dessus avec une seule commande, un seul paiement sandbox et rollback complet.

### Phase 5 — préparation du live

Après validation : sauvegarde fraîche, bascule contrôlée du prestataire vers le live, test de configuration sans transaction, publication des pages légales, configuration finale taxes/e-mails/comptes/téléchargements.

### Phase 6 — lancement

Après accord explicite de lancement : publier le produit, établir la liaison durable track-produit, vérifier le CTA desktop/mobile, sortir du mode Coming Soon, contrôler produit, panier, checkout et passerelle sans passer de commande réelle.

### Phase 7 — surveillance et rollback

Contrôler erreurs, webhooks, e-mails, commandes, permissions et téléchargements. Au premier incident critique : Coming Soon `yes`, produit `draft` / `hidden`, liaison CTA retirée, passerelle live désactivée si nécessaire, puis restauration depuis la sauvegarde appropriée.

## 12. Liste exhaustive des futures modifications de production

Toutes les opérations ci-dessous sont **non autorisées par ce préflight** et demanderont un accord explicite avant exécution :

1. créer une sauvegarde SQL et des sauvegardes de fichiers ;
2. créer/importer la vraie track et ses médias ;
3. corriger ou compléter les métadonnées de la track ;
4. uploader la preview, le master, les stems, archives et contrats ;
5. créer le nouveau produit variable en brouillon/masqué ;
6. créer ses attributs et variations ;
7. définir titres, slug, descriptions, images, catégories et tags ;
8. définir SKU, prix, prix promo éventuels, stock et vente individuelle ;
9. marquer les variations virtuelles/téléchargeables ;
10. associer les bons fichiers et libellés à chaque variation ;
11. définir limites et expiration de téléchargement ;
12. définir statut et classe fiscale, pays et zones de vente ;
13. configurer les taxes après validation professionnelle ;
14. créer/publier CGV, mentions légales, confidentialité, contact et remboursement ;
15. configurer les pages de conditions et confidentialité dans WooCommerce ;
16. ajouter les consentements checkout relatifs au contenu numérique et leur preuve ;
17. configurer création de compte, achat invité et espace téléchargements ;
18. configurer l’expéditeur et le contenu des e-mails WooCommerce ;
19. installer l’extension de paiement choisie ;
20. connecter un compte prestataire test puis, plus tard, live ;
21. configurer webhooks, journaux et mode test ;
22. activer/désactiver une passerelle ;
23. modifier temporairement puis restaurer Coming Soon ;
24. publier temporairement puis remettre en brouillon le produit pour le test ;
25. lier temporairement puis délier la track et le produit ;
26. créer une commande sandbox unique ;
27. envoyer les e-mails associés au test ;
28. créer, utiliser puis révoquer si décidé les permissions de téléchargement de test ;
29. créer ou utiliser un compte client de test ;
30. modifier, annuler, conserver ou supprimer la commande de test selon décision séparée ;
31. basculer la passerelle du test vers le live ;
32. publier définitivement le produit ;
33. établir la liaison durable `_zydka_track_product_id` ;
34. sortir la boutique du mode Coming Soon ;
35. dépublier ou modifier les anciens produits/tracks de test dans un jalon distinct ;
36. restaurer options, données ou fichiers pendant un rollback.

## 13. État final de ce préflight

- aucune modification de production ;
- aucune installation ;
- aucune connexion de compte ;
- aucune activation de passerelle ;
- aucune option WooCommerce modifiée ;
- aucun produit, track, fichier, commande ou permission modifié ;
- aucune commande créée ;
- aucun paiement effectué ;
- documentation Git uniquement.
