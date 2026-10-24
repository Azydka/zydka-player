# Passation — Zydka Player 0.4.0, design Zydka Premium UI

Date : 2026-10-24

Statut : **rendu validé par le propriétaire, fusionné dans `main` (merge `c3d9b5a`) et déployé en production le 2026-10-24 avec son accord.**

## Déploiement production (2026-10-24)

- Sauvegarde de la 0.3.2 : `wp-content/plugin-backups/zydka-player-0.3.2-before-v040-20261024-130103` (4 fichiers, hash identiques à l'original).
- ZIP envoyé : `wp-content/plugin-backups/zydka-player-0.4.0.zip`, SHA-256 `502130cda82d44dad35a8fb2351b37df33b96e440830afb069bd2808e704fd00`, identique au serveur.
- `wp plugin install --force` puis `wp cache flush` : `zydka-player` actif en 0.4.0.
- `/demo-track/` et `/test-zydka-player/` servent `?ver=0.4.0` ; JS, CSS et logo servis identiques au ZIP.
- Contrôle en ligne sur `/demo-track/` : rendu graphite, Z, pochette réelle, file de 3 morceaux ; lecture, seek à 0:30 et pause OK, son coupé pendant le test puis rétabli.
- Retour arrière : réinstaller le contenu de la sauvegarde ci-dessus dans `wp-content/plugins/zydka-player`, puis `wp cache flush`.

## État du dépôt

- Départ : `main = origin/main = 612de13`, dépôt propre, aucun stash.
- Worktree Codex existant `C:/Users/zinga/.codex/worktrees/ddca/Zydka player` (HEAD détachée sur `3906976`, propre) : non créé par cette tâche, non touché.
- Branche de travail : `feat/player-premium-ui`, fusionnée dans `main` avec `--no-ff`, puis supprimée.

## Travail réalisé

Référence appliquée : compétence `zydka-premium-ui` (Radio Context V1.2.4, socle v1.0), guide de migration Zydka Player.

- `apps/zydka-plugin/assets/css/zydka-player.css` réécrit : palette C (tokens `--zydka-*` scopés sur `.zydka-player-root`), châssis graphite mat avec grain, pochette dans un logement en creux, touches en relief, Lecture off-white sans halo, timeline et volume remplis en lime depuis la gauche, file d'attente en panneau bibliothèque, erreurs en `#F3A09B`, focus lime 3 px.
- `src/index.ts` : la pastille texte « Zydka Player » est remplacée par une barre haute (Z blanc + statut de lecture) ; le volume publie `--zydka-volume-percent`. Aucun autre changement de logique.
- Logo : `assets/img/zydka-original.png` copié intact depuis la compétence, cadré en CSS sur le viewBox de référence (2124 1347 823 708), filtre blanc. Ajouté aux fichiers du ZIP dans `scripts/package-zydka-plugin.ps1`.
- Version 0.4.0 (`zydka-player.php`, `package.json`), changelog dans le README.

## Vérifications

- `pnpm test` (52 tests), `typecheck`, `pnpm package:wp` : OK. ZIP contenant php, README, css, png, js.
- Page locale avec une playlist de 3 pistes WAV générées, sur fond clair type thème WordPress : lecture, pause, seek (input + change), suivant, clic dans la file, répétition, volume 40 %, mute, état d'erreur, une seule lecture à la fois.
- Tailles : 1440, 1024, 390, 360 px. Pas de défilement horizontal ; file en feuille du bas sur mobile, focus sur Fermer à l'ouverture.

## Écarts intentionnels avec la référence radio

- Volume linéaire (pas de potard) : le guide demande un volume identique et ce contrôle existe déjà avec son comportement.
- Pas de REC, de BPM ni de navigation Discovery/Explorer : fonctions absentes du player.
- Le statut à droite du Z remplace le descripteur ; aucun mot-symbole Zydka n'est affiché.

## Reste à faire / décisions

- Non testé : Safari iOS, Firefox (styles `-moz-range-*` écrits mais pas vus), écran verrouillé (aucune logique touchée), zoom 200 %.
- Le PNG du logo pèse 130 Ko (5071 × 3404) pour un affichage de 31 px. Un recadrage allégerait la page, mais la référence demande de conserver le fichier intact : à décider.
