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

## Prochaine action

Le propriétaire valide ou ajuste les décisions de la section 9 du préflight, et confirme les droits sur le beat retenu. Ensuite : export des stems et remaster, puis, avec un accord explicite, création du produit en `draft` / `hidden`.
