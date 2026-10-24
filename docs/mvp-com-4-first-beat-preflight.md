# MVP-COM-4 — Préflight du premier beat à vendre

Date : 2026-10-24

Statut : **préflight terminé, proposition par défaut prête à valider. Aucun fichier modifié, aucune action en production.**

Source analysée : `C:\Users\zinga\Music\Zydka Music` (lecture seule).

## Proposition par défaut (à valider ou ajuster)

| Élément | Proposition |
|---|---|
| Beat | `instru_52_Dmaj_98bpm` (WAV + MP3, mai 2023) |
| Titre commercial | **Plein Jour** (alternatives : *Ligne Claire*, *Rive Droite*) |
| Fiche | « Plein Jour — Prod. Louis94 · 98 BPM · Ré majeur » |
| Licences | **Basic MP3 29 €**, **Premium WAV 59 €**, **Trackout 149 €** ; exclusivité sur demande uniquement, à partir de 600 €, hors boutique |
| Lancement | **mardi 1er décembre 2026**, repli au 15 décembre si la relecture juridique ou fiscale n'est pas terminée |
| Produit WooCommerce | nouveau produit variable en `draft` / `hidden`, distinct du produit test 120, créé seulement après ton accord |

Avant toute mise en vente, il faut ta confirmation que `instru_52` est entièrement de toi : aucun sample, aucun co-producteur, aucune boucle soumise à conditions (section 3).

## 1. Méthode

- Lecture seule : aucun fichier déplacé, renommé, modifié ou supprimé. Les empreintes SHA-256 des fichiers retenus ont été relevées avant l'analyse et vérifiées à la fin (section 10).
- Outils : environnement Python isolé dans le dossier temporaire de la session (`soundfile`, `mutagen`, `librosa`, `pyloudnorm`, `scipy`), installé depuis PyPI. Rien n'est installé dans le dépôt ni dans le système.
- Mesures :
  - format, fréquence, résolution, durée, tags ID3 et blocs RIFF ;
  - doublons exacts par SHA-256 ;
  - loudness intégrée (LUFS) et true peak (suréchantillonnage ×4) ;
  - écrêtage, silences de tête et de fin ;
  - tempo (autocorrélation des attaques) et tonalité (profils de Krumhansl sur le chroma) ;
  - recherche du tag `tag zydka 01` ;
  - ressemblance harmonique avec les enregistrements tiers du dossier.
- Limites :
  - l'analyse ne remplace pas l'écoute ;
  - la tonalité automatique est indicative ;
  - la détection automatique du tag n'est pas fiable ;
  - le test de ressemblance harmonique n'est **pas discriminant** (scores 0,86–0,97 pour tous les couples), il ne prouve donc ni la présence ni l'absence d'un sample ;
  - les projets Ableton (`.als`) ne sont pas dans ce dossier : seuls les fichiers d'analyse `.asd` y sont.

## 2. Inventaire

276 fichiers, 4,4 Go, un sous-dossier (`Zoodiak system`).

| Type | Nombre | Remarque |
|---|---:|---|
| WAV | 122 | 16 bits sauf l'acapella Kimani (24 bits) |
| MP3 | 60 | 320 kbps pour les instrus 44,1 kHz |
| FLAC | 10 | enregistrements commerciaux de tiers |
| `.asd` | 83 | fichiers d'analyse Ableton Live, pas de l'audio |
| DOCX | 1 | `Code ISRC.docx` : note sur l'ISRC (SCPP, distributeurs) |
| Images | 0 | aucune pochette dans le dossier ; seules des pochettes intégrées aux MP3 Suno et au MP3 Jcole |
| Projets / stems de tes beats | 0 | aucun `.als`, aucun trackout d'instru Louis94 |

22 fichiers sont des copies exactes d'un autre (17 groupes, par exemple `Zydka Baby (1).wav` = `Zydka Baby.wav`, sept copies de `Pour Sauver Gaza PSG BoyZedit 2025`).

### 2.1 Classement par origine

| Groupe | Fichiers | Indices | Exploitable comme beat à vendre ? |
|---|---|---|---|
| **A. Instrus Louis94 2020–2023** | environ 65 fichiers en 44,1 kHz : `instru_XX_<tonalité>_<bpm>`, `Instru_XX`, `smoothXX`, `Zoodiak system/01–12`, `kaytra`, `jazzy_01`, `leuleu`, `soul one`, `bossa g#min`, `dance`, `hit rock`, `bigfeat`, `amapiano`, `ouwah`, `Aliya Bm`, `Bouquet de fleur.B`… | nommage de beatmaker, fichiers d'analyse Ableton, aucune signature d'IA | **oui, sous réserve de ta confirmation** (samples, co-producteurs) |
| **B. Chansons générées par Suno (2026)** | 17 WAV + 17 MP3 datés des 2 et 8 octobre 2026 : `Dans l'air`, `Doucement`, `Mauvais chemin`, `Pas Pareil`, `À ma façon`, `Wesh 9-4`… | tag `made with suno`, lien `suno.com/song/…`, manifeste C2PA, artiste `louvizi`, paroles intégrées | **non** : ce sont des chansons avec voix, pas des instrus, et elles relèvent des conditions Suno |
| **C. Titres 48 kHz de 2025 sans métadonnées** | environ 80 WAV : `Brume à la pistache`, `Grande Venus`, `Zydka Baby`, `Régime Illégal` et ses pistes séparées, `Toulouse la Nuit (Remastered)`, `williams voice's (Cover)`, `recording-… (Remix)`… | même format que les exports Suno (48 kHz / 16 bits) ; suffixes `(Remix)`, `(Edit)`, `(Cover)`, `(Remastered)` et pistes `(Bass)`, `(Drums)`, `(Vocals)` nommés comme les fonctions Suno ; nombreux doublons | **non pour le premier lancement** : origine probablement générée, à confirmer |
| **D. Enregistrements de tiers** | Diane Tell (×5), Marie Laforêt (×2), Quarteto Em Cy, `Une belle histoire`, `¿Porqué te vas`, acapella `Kimani - Bad Situation` | œuvres commerciales publiées | **non**. Ce sont probablement des sources de samples, et tout beat qui les utilise demande une autorisation |
| **E. Collaborations** | `Jcole & Louis94 - Unknow project`, `V4-ZydkaYoom-95BPM`, `zydkayoom_Bm_95_bpm`, `N°2-ZYDKA-YOOM-mix2` (fichier **silencieux**), `Instru_14_G_100bpm_youm_version` | noms de co-auteurs | seulement avec l'accord écrit du co-auteur |
| **F. Autres** | `Beatmaker's book.wav`, `Influence et Manipulation.wav` (voix parlée 24 kHz mono, 7–8 min), `tag zydka 01.mp3` (tag producteur, 5,5 s), `WhatsApp-Video-…`, `Pour Sauver Gaza…` | narration, tag, extraits | le tag est réutilisable pour les previews |

**Cas particulier : `freedom.wav`** (instru, 2021). Le fichier porte l'ISRC `FR9W12100927`, écrit par Sonoris ISRC Editor. Il a donc été préparé pour une distribution. S'il est sorti chez un distributeur, il peut être enregistré dans Content ID ; le vendre en licence non exclusive provoquerait des réclamations contre tes acheteurs. **À écarter tant que son statut de distribution n'est pas connu.**

## 3. Candidats et recommandation

### 3.1 Critères

Origine Louis94 probable, WAV disponible, morceau complet (pas une boucle de 60 s), aucun nom de tiers, aucun co-auteur, BPM et tonalité cohérents, qualité technique récupérable.

### 3.2 Comparatif des finalistes

| Critère | `instru_52_Dmaj_98bpm` | `Instru_14_G_100bpm_youm_version` | `instru_81__Fmaj_113bpm` | `instru_89_Cm_118bpm` |
|---|---|---|---|---|
| Date | 2023-05-18 | 2022-02-20 | 2023-07-08 | 2023-07-07 |
| Fichiers | WAV 16 bits/44,1 kHz + MP3 320 | WAV seul | WAV + MP3 320 | WAV + MP3 320 |
| Durée | 2:03 | 3:26 | 2:16 | 1:52 |
| Tempo mesuré | **97,5 BPM** (nom : 98) | 99,4 (nom : 100) | 112,4 (nom : 113) | 117,5 (nom : 118) |
| Tonalité mesurée | **ré majeur**, comme le nom (confiance faible : 0,36) | **sol majeur**, comme le nom (0,74) | mi mineur, ≠ fa majeur du nom (0,27) | si♭ majeur, ≠ do mineur du nom (0,39) |
| Loudness | −14,4 LUFS | −18,7 LUFS | −17,6 LUFS | −7,3 LUFS |
| True peak | +0,02 dBTP, 1 échantillon écrêté | −3,36 dBTP, aucun écrêtage | +0,09 dBTP, 1 échantillon | +0,07 dBTP, **42 810 échantillons écrêtés** |
| Image stéréo | assez étroite (side −12,9 dB) | large (−3,1 dB) | large (−2,8 dB) | moyenne (−8,7 dB) |
| Risque droits | aucun indice ; samples à confirmer | **co-auteur probable (« youm »)** | aucun indice ; tonalité incohérente avec le nom | aucun indice |
| Verdict | **recommandé** | meilleur techniquement, bloqué par la collaboration | alternative | écarté (master écrêté) |

### 3.3 Recommandation : `instru_52_Dmaj_98bpm`

Raisons :

1. C'est l'un des beats Louis94 les plus récents. Il existe en WAV et en MP3 320 kbps, et le MP3 a la même durée que le WAV.
2. Le tempo (97,5 BPM, arrondi à 98) et la tonalité (ré majeur) mesurés confirment le nom du fichier : les métadonnées commerciales sont fiables.
3. Aucun nom de tiers ou de co-auteur.
4. Le master est presque propre : un seul échantillon atteint 0 dBFS. Un simple limiteur à −1 dBTP suffit.
5. Une instru lumineuse en majeur à 98 BPM correspond à des usages larges (pop urbaine, R&B, afro, rap mélodique), ce qui est utile pour un premier titre non exclusif.

Points faibles assumés : 2:03, c'est court (une structure de 2:30 à 3:00 est plus confortable pour un artiste), et aucun stem n'existe dans le dossier.

Alternative : `Instru_14_G_100bpm_youm_version` si « Youm » (ou ZydkaYoom) confirme par écrit n'avoir aucun droit dessus, ou t'en cède l'exploitation. C'est le fichier le plus propre techniquement (3:26, marge de 3,4 dB, aucun écrêtage).

### 3.4 Vérifications de droits indispensables (non présumées)

Pour le beat retenu, tu dois confirmer :

- qu'il ne contient **aucun sample** d'enregistrement tiers : le dossier contient des disques de Diane Tell, Marie Laforêt, Quarteto Em Cy, etc., ce qui montre que tu échantillonnes ; l'analyse automatique ne peut pas l'exclure ;
- l'origine des **boucles, presets et kits** utilisés : banques libres de droits ou non, et leurs conditions (certaines boucles interdisent la revente dans un beat non exclusif ou dans Content ID) ;
- qu'**aucun co-producteur** ni musicien n'y a participé ;
- qu'il n'a **jamais été vendu en exclusivité**, ni distribué sous ton nom avec un ISRC ou dans Content ID ;
- qu'il n'a pas été déposé à la Sacem avec d'autres ayants droit.

Pour les groupes B et C (Suno) : les conditions Suno accordent les droits d'usage commercial aux titres **téléchargés pendant un abonnement payant**, pas aux téléchargements d'essai, et Suno ne garantit pas qu'un droit d'auteur naisse sur ces créations. Les vendre en licence exclusive serait donc risqué. Ces fichiers ne sont pas proposés pour ce lancement.

## 4. Titre commercial

`instru_52_Dmaj_98bpm` est un nom de travail. Proposition : **Plein Jour**.

- C'est court et en français, et cela évoque le caractère lumineux du ré majeur.
- Le titre n'entre pas en conflit avec les titres existants du dossier ni avec les produits WooCommerce (115, 120).
- Alternatives : *Ligne Claire*, *Rive Droite*.
- Libellé : « Plein Jour — Prod. Louis94 », SKU proposé `L94-PLEINJOUR-<LICENCE>`, slug `plein-jour-prod-louis94`.

Le titre reste à confirmer à l'écoute : je n'ai pas écouté le morceau, j'en ai mesuré les caractéristiques.

## 5. Ce qui existe et ce qu'il reste à produire

| Livrable | État | À faire |
|---|---|---|
| WAV master | existe : 16 bits / 44,1 kHz, 2:03, SHA-256 `1ba427a6…cef21d` | remaster léger : true peak ≤ −1 dBTP, loudness autour de −10 à −12 LUFS selon le style, vérification à l'écoute ; export WAV 24 bits si le projet est disponible |
| MP3 320 kbps | existe, SHA-256 `bc2a85b4…5baecb` | le régénérer depuis le nouveau master |
| Version taguée (preview) | **manque** | MP3 192 kbps avec le tag `tag zydka 01` toutes les 20 à 30 s, pour le Player du site |
| Version non taguée | WAV et MP3 actuels | à livrer seulement après paiement |
| Stems / trackouts | **manquent** (aucun `.als` ni stem dans le dossier) | ouvrir le projet Ableton d'`instru_52`, exporter chaque piste en WAV 24 bits / 44,1 kHz, même longueur, avec le BPM dans le nom |
| BPM | 98 (mesuré 97,5) | à reporter dans les tags et sur la fiche |
| Tonalité | ré majeur (mesurée, confiance moyenne) | à confirmer depuis le projet |
| Arrangement | 2:03 | optionnel : version 2:30–3:00 avec un second couplet |
| Pochette | **manque** | visuel original 3000×3000 px (JPG/PNG), droits documentés ; aucune pochette Suno ni photo de tiers |
| Métadonnées | **manquent** (aucun tag ID3 sur ces fichiers) | titre, artiste « Louis94 », BPM, tonalité, `© 2026 Louis94`, URL de la boutique, sans ISRC (un beat vendu en licence n'est pas un enregistrement publié) |
| Textes de licence | **manquent** | un PDF par licence, numéroté, en français (section 6) |
| ZIP par licence | **manquent** | `Plein-Jour_Basic.zip`, `Plein-Jour_Premium.zip`, `Plein-Jour_Trackout.zip` contenant audio, licence PDF et un `LISEZMOI.txt` ; empreintes SHA-256 consignées |
| Fiche produit | **manque** | description, caractéristiques, tableau des licences, mentions légales |
| Track Manager liée | **manque** | nouvelle track « Plein Jour » avec le preview tagué, liée au futur produit |

## 6. Proposition de trois licences

Principes communs, à faire valider par un juriste :

- **Non exclusives** : le beat peut être vendu à d'autres acheteurs tant qu'aucune exclusivité n'est vendue.
- **Droits d'auteur** : Louis94 reste titulaire de la composition et de l'enregistrement de l'instrumentale. L'acheteur est titulaire de ses paroles, de sa mélodie et de son enregistrement, mais **ne peut jamais exploiter l'instru seule**.
- **Sacem / gestion collective** :
  - Louis94 est déclaré compositeur de la musique ;
  - le partage de la nouvelle œuvre est fixé par écrit avant tout dépôt ; par défaut, 50 % musique Louis94 et 50 % pour l'artiste (paroles et mélodie) ;
  - le partage par tiers de la Sacem s'applique ensuite aux droits de représentation.
- **Crédit obligatoire** : « Prod. Louis94 » dans le titre ou la description de chaque publication, et dans les crédits des plateformes qui le permettent.
- **Content ID et équivalents interdits** pour toutes les licences non exclusives (YouTube Content ID, Audible Magic, Facebook Rights Manager, etc.). C'est la pratique de marché, pour éviter les réclamations entre acheteurs.
- **Interdits** :
  - revendre, sous-licencier, céder ou redistribuer l'instru (seule ou dans un pack) ;
  - l'enregistrer comme son œuvre ;
  - l'utiliser comme jeu de données d'entraînement d'IA ;
  - l'utiliser dans un contenu illégal ou diffamatoire.
- **Durée** : 10 ans, limitée par les plafonds ; au-delà d'un plafond, passage à la licence supérieure contre la différence de prix.
- **Exclusivité ultérieure** : les licences déjà vendues restent valables jusqu'à leur terme. L'acheteur exclusif en est informé avant l'achat.
- **Synchronisation** (film, publicité, jeu vidéo, TV) : exclue de toutes les licences, contrat séparé.
- **Contenu numérique** : la livraison commence immédiatement après paiement. Il faut le consentement exprès à l'exécution immédiate et la reconnaissance de la perte du droit de rétractation (consommateurs), voir MVP-COM-3.

| | **Basic** | **Premium** | **Trackout** |
|---|---|---|---|
| Prix conseillé | **29 €** | **59 €** | **149 €** |
| Fichiers | MP3 320 kbps non tagué | WAV 24 bits non tagué + MP3 320 | WAV + MP3 + stems WAV 24 bits |
| Titres | 1 | 1 | 1 |
| Streams audio cumulés | 50 000 | 250 000 | 1 000 000 |
| Ventes / téléchargements payants | 1 000 | 5 000 | 20 000 |
| Vidéos | 1 clip, non monétisé | 1 clip monétisé | 3 clips monétisés |
| Radio | non | 2 stations | illimitée |
| Concerts | sans but lucratif | rémunérés | rémunérés |
| Crédit « Prod. Louis94 » | obligatoire | obligatoire | obligatoire |
| Content ID | interdit | interdit | interdit |
| Revente / redistribution | interdite | interdite | interdite |
| Exclusivité | non | non | non |
| Synchronisation | exclue | exclue | exclue |
| Évolution | vers Premium : +30 € | vers Trackout : +90 € | — |

**Exclusivité** : non vendue en ligne pour le premier lancement. Sur demande, à partir de 600 €, avec un contrat de cession écrit et validé juridiquement. Elle comprend tous les fichiers et l'enregistrement Content ID par l'acheteur, et entraîne le retrait du beat de la boutique.

### 6.1 Justification des prix

- Relevé de marché : licence MP3 la plus fréquente à 25 $, WAV à 50 $, trackout à 100 $, exclusivité entre 150 et 250 $ ([Hip Hop Makers](https://hiphopmakers.com/how-to-price-beats-to-sell-beats-online)). Guide 2026 : MP3 20–35 $, WAV 50–75 $, exclusivité 300–1 000 $ et plus ([Chartlex](https://www.chartlex.com/blog/money/how-to-sell-beats-online-producers-guide-2026)).
- 29 € / 59 € / 149 € placent Louis94 dans le haut de la fourchette basse : crédible pour un producteur sans catalogue public, avec une marge pour des promotions de lancement.
- Les fourchettes de streams (50 000 à 1 000 000) suivent les plafonds observés chez des vendeurs ([exemple de 100 000 streams](https://payhip.com/b/CIcnP), [exemple jusqu'à 500 000](https://arkatechbeatz.com/blogs/news/standard-vs-premium-vs-exclusive-beat-license-whats-the-difference)).
- Le produit test 120 (29 / 99 / 299 €) n'est pas une référence tarifaire : c'est une fixture technique.

## 7. Sources consultées

Aucun contenu protégé n'a été téléchargé ni réutilisé. Les liens servent de référence.

- Suno, mise à jour des conditions (10 août 2026) : [suno.com/blog/suno-updates-tos](https://suno.com/blog/suno-updates-tos) ; [base de connaissances Suno, droits et propriété](https://help.suno.com/en/categories/550145).
- Tarifs et paliers : [Hip Hop Makers](https://hiphopmakers.com/how-to-price-beats-to-sell-beats-online) ; [Chartlex 2026](https://www.chartlex.com/blog/money/how-to-sell-beats-online-producers-guide-2026) ; [Arkatech Beatz](https://arkatechbeatz.com/blogs/news/standard-vs-premium-vs-exclusive-beat-license-whats-the-difference) ; [Violet Recording](https://violetrecording.com/what-is-a-beat-lease/).
- Content ID et licences non exclusives : [Ditto Music](https://support.dittomusic.com/en/articles/7041257-is-my-music-eligible-for-youtube-content-id) ; [RecordJet](https://faq.recordjet.com/en/articles/6890842-exclusive-rights-and-beat-licenses-what-do-you-need-to-consider) ; [Foxi Music](https://www.foximusic.com/blog/content-id-for-beats-guide-producers-artists/).
- Édition et partage des droits : [Songtrust](https://blog.songtrust.com/music-publishing-tips-beat-selling-and-music-publishing) ; Sacem, [répartition](https://www.sacem.lu/fr/createurs/repartition) et [dépôt d'œuvre](https://www.sacem.lu/download/757/comment-deposer-une-oeuvre-a-la-sacem-.pdf).
- TVA :
  - seuil européen de 10 000 € et guichet unique : [Sovos](https://sovos.com/fr/blog/tva/paquet-tva-sur-le-commerce-electronique-le-guichet-unique-oss/) ;
  - franchise en base, 37 500 € pour les services : [Legalplace](https://www.legalplace.fr/guides/tva-non-applicable-art-293-b-du-cgi/) ;
  - recodification annoncée de l'article 293 B au 1er septembre 2026 : [EuroCompta](https://eurocompta.eu/fr/guides/franchise-en-base-tva-seuils-2026/), à vérifier sur Légifrance ou le BOFiP.

Ces sources sont des repères de marché et de méthode, pas un avis juridique ni fiscal.

## 8. Date de lancement et checklist

Date cible : **mardi 1er décembre 2026**, repli au **mardi 15 décembre 2026**. Elle suppose environ une semaine par bloc et une réponse rapide du juriste ou du comptable.

| Semaine | Étapes | Responsable |
|---|---|---|
| 26 oct. – 1er nov. | 1. Valider beat, titre, licences et prix (ce document). 2. Confirmer les droits (section 3.4). 3. Retrouver le projet Ableton d'`instru_52`. | toi |
| 2 – 8 nov. | 4. Exporter les stems. 5. Remaster à −1 dBTP, WAV 24 bits et MP3 320. 6. Créer le preview tagué. 7. Commander ou créer la pochette 3000×3000. | toi, puis assistant pour le contrôle technique |
| 9 – 15 nov. | 8. Rédiger les trois licences PDF et le contrat d'exclusivité type. 9. Rédiger CGV, mentions légales, confidentialité et remboursement. 10. Choisir le statut fiscal (franchise ou TVA, pays de vente). | assistant (brouillons), juriste et comptable (validation) |
| 16 – 22 nov. | 11. Avec ton accord : créer le produit variable « Plein Jour » en `draft` / `hidden`, ses trois variations et les ZIP. 12. Installer Stripe en **mode test**. 13. Créer la track Manager avec le preview. | assistant, accord explicite à chaque écriture en production |
| 23 – 29 nov. | 14. Parcours de test complet pour chaque licence : CTA, panier, consentements, paiement test, e-mail, téléchargement, hash du fichier, limites. 15. Corrections. 16. Rollback testé. | assistant, toi pour la validation |
| 1er déc. | 17. Avec ton accord : passer Stripe en production, publier le produit, lier la track, sortir du mode Coming Soon, faire un achat réel de contrôle remboursé. | toi et assistant |

Conditions bloquantes, sans lesquelles la date glisse : droits confirmés, textes juridiques validés, statut fiscal décidé, paiement testé de bout en bout.

## 9. Décisions qui demandent ton accord

1. **Le beat** : `instru_52_Dmaj_98bpm`, et ta confirmation qu'il ne contient aucun sample, aucune boucle soumise à conditions et aucune contribution de tiers.
2. **Le titre** : *Plein Jour*, ou une autre proposition.
3. **Les licences et prix** : Basic 29 €, Premium 59 €, Trackout 149 €, exclusivité hors boutique à partir de 600 €, et le partage Sacem par défaut 50/50.
4. **La date** : 1er décembre 2026, repli au 15 décembre.
5. **Le paiement** : Stripe en mode test d'abord (recommandé dans MVP-COM-3).
6. **La pochette** : création maison ou commande à un graphiste.
7. **Plus tard, séparément** : chaque écriture en production (produit `draft` / `hidden`, extension de paiement, track).

## 10. État final

- Dossier musique : lecture seule. Après l'analyse, les 192 fichiers audio ont été recalculés : SHA-256, taille et date de modification sont identiques à l'inventaire initial, et le dossier compte toujours 276 fichiers. Empreintes de référence : `instru_52` WAV `1ba427a66bfc270c851e2d861018f2765fd9bc2ae4e8d2cb1c6dd0fa85cef21d`, MP3 `bc2a85b4eef4d1df44aaa616381f1e55c6571b83d71fe515d7c3c5b5315baecb`, tag `daf567e06794eeac9989fb4cb4ec3c4d8826c8c515cb55c41e5ef5f9a6212e8f`.
- Production : aucune lecture ni écriture ; aucun produit, aucune track, aucune option modifiés.
- Dépôt : documentation uniquement.
