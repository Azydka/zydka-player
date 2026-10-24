# Passation — MVP-COM-4 premier beat à vendre

Date : 2026-10-24

Statut : **préflight terminé, proposition par défaut en attente de validation du propriétaire. Production inchangée.**

## État du dépôt

- Départ : `main = origin/main = 3906976`, dépôt propre, aucun stash.
- Un worktree Codex existe : `C:/Users/zinga/.codex/worktrees/ddca/Zydka player`, en HEAD détachée sur `3906976`, sans modification. Il n'a pas été créé par cette tâche et n'a pas été touché.
- Branche de travail : `docs/mvp-com-4-first-beat-preflight`, fusionnée dans `main` avec `--no-ff`, puis supprimée.

## Travail réalisé

- Inventaire en lecture seule de `C:\Users\zinga\Music\Zydka Music` : 276 fichiers, 192 fichiers audio, 22 copies exactes.
- Classement par origine : instrus Louis94 2020–2023 ; chansons Suno 2026 (tag `made with suno` et C2PA) ; titres 48 kHz de 2025, probablement générés ; enregistrements de tiers ; collaborations.
- Analyse technique de 56 instrus (tempo, tonalité, loudness, pic), puis analyse approfondie de 4 finalistes.
- Recherche de marché : tarifs, paliers, Content ID, conditions Suno, partage Sacem, TVA.
- Rédaction de `docs/mvp-com-4-first-beat-preflight.md` : recommandation, titre, livrables, trois licences, date, checklist, décisions.

## Proposition par défaut

- Beat `instru_52_Dmaj_98bpm` (98 BPM mesuré 97,5, ré majeur, 2:03, WAV + MP3 320), titre **Plein Jour**.
- Licences : Basic MP3 29 €, Premium WAV 59 €, Trackout 149 € ; exclusivité hors boutique à partir de 600 €.
- Lancement le 1er décembre 2026, repli au 15 décembre.
- Alternative : `Instru_14_G_100bpm_youm_version`, si le co-auteur « Youm » donne son accord écrit.

## Points d'attention

- Aucun beat n'est présumé libre de droits : samples, boucles et co-producteurs restent à confirmer par le propriétaire.
- `freedom.wav` porte un ISRC (`FR9W12100927`) : à écarter tant que son statut de distribution n'est pas connu.
- Les fichiers Suno (groupes B et C) ne sont pas proposés à la vente de beats.
- Il manque : stems, pochette, preview tagué, métadonnées, textes de licence, ZIP, remaster à −1 dBTP.
- `N°2-ZYDKA-YOOM-mix2.wav` est entièrement silencieux.

## Outils

Environnement Python isolé dans le dossier temporaire de la session (`librosa`, `soundfile`, `mutagen`, `pyloudnorm`, `scipy`). Rien n'a été installé dans le dépôt. Le test de ressemblance harmonique avec les enregistrements tiers n'est pas discriminant et ne doit pas être présenté comme une preuve d'absence de sample.

## Production

Aucune lecture ni écriture en production. Aucun produit, aucune track, aucune option créés ou modifiés.

## Validation du propriétaire (2026-10-24)

Le propriétaire a répondu « ok » à la proposition par défaut, après avoir d'abord annoncé un ajustement sans le préciser. Sont donc retenus :

- beat `instru_52_Dmaj_98bpm`, titre **Plein Jour** ;
- Basic 29 €, Premium 59 €, Trackout 149 € ; exclusivité hors boutique à partir de 600 € ; partage Sacem 50/50 par défaut, à faire valider ;
- lancement le 1er décembre 2026, repli au 15 décembre ;
- Stripe en mode test d'abord.

Restent ouverts :

- la **confirmation écrite des droits** sur `instru_52` : aucun sample, aucune boucle soumise à conditions, aucun co-producteur, jamais vendu en exclusivité ni distribué. Le « ok » général ne vaut pas cette confirmation, qui reste un préalable à toute mise en vente ;
- le choix de la pochette (création maison ou graphiste) ;
- chaque écriture en production, qui demande un accord explicite séparé.

Contexte intervenu pendant cette tâche : Codex a fusionné Player 0.4.0 (Premium UI, déployé) et 0.5.0 (favoris, non déployé). `main` est passé de `612de13` à `8e337e5`. Après `pnpm package:wp`, le ZIP de référence à remettre est désormais `dist/zydka-player-0.5.0.zip` (SHA-256 `b69009f0…e11d`), et non plus la 0.3.2.

## Décisions complémentaires du propriétaire (2026-10-24, 16:28)

- **Droits sur `instru_52` confirmés par écrit dans la conversation** : le propriétaire déclare en être l'auteur et a répondu « oui » aux quatre points : aucun sample de tiers ; aucune boucle ou kit dont la licence interdit la revente ou Content ID ; aucun co-producteur ; jamais vendu en exclusivité, jamais distribué avec un ISRC ni enregistré dans Content ID. Le dépôt Sacem éventuel avec d'autres ayants droit n'a pas été posé explicitement : à confirmer à l'occasion.
- **Grille tarifaire relevée (positionnement premium, risque accepté)** : Basic MP3 49 €, Premium WAV 99 €, Trackout 249 €, exclusivité hors boutique dès 1 500 €. Plafonds de streams 100 000 / 500 000 / illimités. Détail et garde-fou (revue à 60 jours) : `docs/mvp-com-4-first-beat-preflight.md`, section 6.2. Remplace la grille 29 / 59 / 149 € et 600 €.
- Restent ouverts : la pochette, le statut fiscal, la validation juridique des licences, et chaque écriture en production.

## Prochaine action

1. Propriétaire : retrouver le projet Ableton d'`instru_52`, exporter les stems (WAV 24 bits / 44,1 kHz, même longueur) et choisir la pochette.
2. Assistant, hors production : contrôle technique des stems et du remaster, preview tagué, brouillons des trois licences PDF et des textes juridiques.
3. Puis, avec un accord explicite : produit « Plein Jour » en `draft` / `hidden`.
