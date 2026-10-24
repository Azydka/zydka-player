# @zydka/zydka-plugin

Plugin WordPress officiel du lecteur audio propriétaire **Atelier Zydka**.

Ce plugin est le pont entre WordPress et le moteur audio Zydka Player.  
Il ne dépend d'aucun thème WordPress tiers et fonctionne de manière autonome.

## Fonctionnement

Le plugin expose le shortcode `[zydka_player]` qui insère le conteneur HTML nécessaire au montage du lecteur JavaScript.

```
[zydka_player]
```

Ce shortcode produit :

```html
<div id="zydka-player-root" class="zydka-player-root" data-source="shortcode"></div>
```

Le lecteur JavaScript (`assets/js/zydka-player.js`) est compilé depuis `src/index.ts` et s'initialise sur cet élément.

## Architecture

```
apps/zydka-plugin/
├── zydka-player.php       # Fichier principal WordPress (header, constants, hooks)
├── src/
│   └── index.ts           # Bootstrap TypeScript → compilé vers assets/js/
├── assets/
│   ├── js/
│   │   └── zydka-player.js  # Généré par le build
│   └── css/
│       └── zydka-player.css # Styles du lecteur
└── package.json           # Config monorepo PNPM
```

## Intégration future

L'intégration complète avec `@zydka/wordpress-bridge` sera ajoutée dans les prochaines étapes.  
Le bridge est responsable de la communication entre WordPress (PHP/REST API) et le moteur audio (`@zydka/audio-engine`).

## Validation production

Date : 23/06/2026  
Site : louis94.com  
Etat : validation reussie

Points valides :

- Plugin installe et active sur WordPress.
- Shortcode `[zydka_player]` fonctionnel sur une page publique.
- Interface minimale visible dans `#zydka-player-root`.
- Boutons Play / Pause fonctionnels.
- Etat synchronise avec `window.ZydkaPlayer.state()`.
- Bridge WordPress initialise cote navigateur.
- Moteur audio proprietaire operationnel en environnement WordPress reel.

Commandes console utilisees :

```js
typeof window.ZydkaPlayer
```

Resultat attendu :

```js
"object"
```

```js
window.ZydkaPlayer.state()
```

Resultat initial attendu :

```js
{
  currentTrack: null,
  status: "idle",
  isPlaying: false,
  error: null
}
```

```js
window.ZydkaPlayer.play({
  id: "demo-track",
  title: "Demo Track",
  artist: "Atelier Zydka",
  src: "https://www.louis94.com/wp-content/uploads/2026/06/04.-New-York-Shit-feat.-Swizz-Beatz.mp3"
})
```

Resultat attendu apres lecture : `status: "playing"`, `isPlaying: true`, `error: null`.

```js
window.ZydkaPlayer.pause()
```

Resultat attendu : lecture mise en pause et statut mis a jour.

Note : l'interface actuelle est une interface minimale de test. Elle ne represente pas le lecteur final.

Prochaine etape recommandee : remplacer le morceau de test code en dur par des attributs de shortcode, par exemple :

```text
[zydka_player title="New York Shit" artist="Louis94" src="https://...mp3"]
```

### 23/06/2026 - louis94.com - Navigation multi-tracks

Validation réussie de la navigation multi-tracks du Zydka Player sur louis94.com.

Résultat :

- Queue interne fonctionnelle.
- Boutons Previous / Next opérationnels.
- État synchronisé avec `window.ZydkaPlayer.state()`.
- Progression conservée.
- `window.ZydkaPlayer.getQueue()` fonctionnel.
- `window.ZydkaPlayer.getCurrentIndex()` fonctionnel.
- Lecture, pause, progression et seek toujours opérationnels.

### 23/06/2026 — louis94.com — Shortcode playlist

Validation réussie du shortcode playlist du Zydka Player sur louis94.com.

Résultat :

- `[zydka_playlist]` fonctionnel.
- `[zydka_track]` fonctionnel.
- Queue alimentée depuis le contenu WordPress.
- Navigation Previous / Next opérationnelle entre deux vraies tracks de shortcode.
- Lecture, pause, progression, durée et seek toujours opérationnels.
- `window.ZydkaPlayer.getQueue()` retourne bien les tracks déclarées dans le shortcode.
- Le shortcode single-track `[zydka_player]` reste fonctionnel.
- Point d’attention validé : ne pas utiliser `[zydka_player]` au-dessus d’une playlist ; utiliser uniquement `[zydka_playlist] ... [/zydka_playlist]` pour une playlist.

Exemple validé :

```text
[zydka_playlist]
[zydka_track id="new-york-shit" title="New York Shit" artist="Louis94" src="https://www.louis94.com/wp-content/uploads/2026/06/04.-New-York-Shit-feat.-Swizz-Beatz.mp3"]
[zydka_track id="lifes-a-bitch-arsenal-mix" title="Life's a Bitch — Arsenal Mix" artist="Louis94" src="https://www.louis94.com/wp-content/uploads/2026/06/2-06-Lifes-a-Bitch-feat.-AZ-Arsenal-Mix.m4a"]
[/zydka_playlist]
```

### CTA par track

Les shortcodes `[zydka_player]` et `[zydka_track]` acceptent les attributs `buy_url` et `buy_label`.

Si `buy_url` est fourni, le player affiche un bouton CTA pour la track active. Si `buy_label` est vide, le label par défaut est `Voir le projet`.

Single player :

```text
[zydka_player id="new-york-shit" title="New York Shit" artist="Louis94" src="https://www.louis94.com/wp-content/uploads/2026/06/04.-New-York-Shit-feat.-Swizz-Beatz.mp3" buy_url="https://www.louis94.com/" buy_label="Voir le projet"]
```

Playlist :

```text
[zydka_playlist]
[zydka_track id="new-york-shit" title="New York Shit" artist="Louis94" src="https://www.louis94.com/wp-content/uploads/2026/06/04.-New-York-Shit-feat.-Swizz-Beatz.mp3" cover="https://www.louis94.com/wp-content/uploads/2026/06/cover.jpg" buy_url="https://www.louis94.com/" buy_label="Voir le projet"]
[zydka_track id="lifes-a-bitch-arsenal-mix" title="Life's a Bitch — Arsenal Mix" artist="Louis94" src="https://www.louis94.com/wp-content/uploads/2026/06/2-06-Lifes-a-Bitch-feat.-AZ-Arsenal-Mix.m4a"]
[/zydka_playlist]
```

### 24/06/2026 - louis94.com - CTA par track / buy link

Validation production réussie après installation et test du ZIP généré sur louis94.com.

Branche : `feature/zydka-player-buy-link`  
Feature : CTA par track via `buy_url` et `buy_label`

Résultat :

- Bouton CTA affiché quand `buy_url` est présent.
- Bouton masqué quand `buy_url` est absent.
- `buy_label` personnalisé OK.
- Label par défaut `Voir le projet` OK si `buy_label` est absent.
- Ouverture en nouvel onglet OK.
- Mise à jour du CTA sur Previous / Next OK.
- Mise à jour du CTA via Queue OK.
- Play/Pause OK.
- Progression/seek OK.
- Volume/mute OK.
- Covers OK.
- Extraction cover MP3 ID3/APIC toujours OK.
- Fallback OK.

### 23/06/2026 - louis94.com - Covers embarquées MP3

Validation production réussie après installation du ZIP généré.

Branche : `feature/zydka-player-embedded-cover`  
Commit fonctionnel : `875d48e feat(zydka-plugin): extract embedded audio covers`

Résultat :

- Cover explicite via shortcode OK.
- Cover principale affichée.
- Mini-covers dans Queue OK.
- Extraction automatique de cover embarquée MP3 ID3/APIC OK.
- Fallback propre si aucune cover ou format non supporté.
- M4A/MP4 `covr` non supporté à ce stade.
- Play/Pause OK.
- Previous/Next OK.
- Queue OK.
- Progression/seek OK.
- Volume/mute OK.
- Mobile à vérifier/OK selon test.

## Changelog

### 0.5.1 - iPhone : volume et répétition

- Volume : sur les appareils où une page ne peut pas régler le volume (iPhone et iPad, tous navigateurs), le curseur et le pourcentage sont masqués. Seul le bouton muet reste, et les boutons du téléphone règlent le son. La détection écrit un volume puis le relit, sans lire le user agent. Ailleurs, rien ne change.
- Répétition : chaque appui affiche brièvement le mode actif (« Répétition : toute la playlist », « Répétition : ce morceau », « Répétition désactivée ») dans la zone d'annonce existante (`aria-live`). Sur mobile, le libellé au survol n'était jamais visible. Le libellé du mode file devient « Répéter la playlist ».

### 0.5.0 - favoris locaux

- Bouton cœur à côté du partage : ajoute ou retire le morceau affiché des favoris (`aria-pressed`, libellés « Ajouter aux favoris » / « Retirer des favoris »). Actif : cœur plein, touche enfoncée et point lime.
- Favoris propres au navigateur, sans compte ni serveur : `localStorage`, clé `zydka-player:favorites:v1`, tableau JSON de clés `id:<id>` (ou `url:<audioUrl>` si la track n'a pas d'id). Le titre n'est jamais utilisé.
- Le cœur suit la track active (Previous, Next, file, lien `#track-…`) et retrouve son état au rechargement.
- Stockage absent, illisible ou refusant l'écriture : ensemble vide au départ, favoris conservés pour la visite, aucune erreur affichée, lecture inchangée.
- Pas encore de liste ni de filtre des favoris. Logique pure dans `src/favorites.ts`, couverte par `tests/favorites.test.ts`.

### 0.4.0 - design Zydka Premium UI

- Interface reprise dans le langage Zydka Premium UI v1.0 : châssis graphite mat, pochette dans un logement en creux, touches en relief, bouton Lecture off-white sans halo.
- Z blanc seul en haut à gauche (fichier original `assets/img/zydka-original.png`, cadré sans être redessiné) et statut de lecture (Prêt, Chargement, En lecture, En pause, Terminé, Indisponible).
- Timeline et volume remplis en lime depuis la gauche ; le volume affiche la valeur réglée, atténuée quand le son est coupé.
- File d'attente en panneau bibliothèque (desktop) ou feuille du bas (mobile), piste en cours signalée par un point lime.
- Focus clavier lime, cibles tactiles de 44 px minimum, pochette en tête sur téléphone.
- Aucun changement de moteur, de file, de seek, de Media Session ni de partage.

### 0.3.2 - correctif seek en pause

- Un seek fait pendant la pause (écran verrouillé ou page) est mémorisé et appliqué par Howler au moment de la reprise, au lieu de déplacer l'élément audio en pause.
- Corrige la lecture qui ne reprenait plus sur Android (Chrome, Xiaomi 13T) après pause, déplacement du curseur puis lecture : Howler attendait un `canplaythrough` que Chrome n'émet pas pour un média en pause écran verrouillé.
- La position affichée (page et écran verrouillé) reste sur la cible pendant la pause.

### 0.3.1 - correctif seek écran verrouillé

- Le déplacement dans un morceau depuis l'écran verrouillé conserve désormais le flux audio actif au lieu de le mettre en pause puis de tenter de le relancer.
- Évite la coupure du son et l'état d'erreur qui pouvaient suivre un seek sur iPhone lorsque l'écran était verrouillé.
- Deux tests de non-régression couvrent le seek direct et son repli Howler (51 tests au total).

### 0.3.0 - consolidation

- Enchaînement automatique : avec la répétition désactivée, le morceau suivant démarre à la fin du précédent et la lecture s'arrête après le dernier (auparavant, elle s'arrêtait après chaque morceau).
- Shuffle : aucun morceau n'est rejoué avant que toute la file ait été écoutée ; ensuite arrêt (répétition désactivée) ou nouveau cycle (répétition de la file).
- Fin de morceau gérée depuis l'événement audio `ended` (exposé en `window.ZydkaPlayer.onEnded`), et non plus par le rafraîchissement de l'interface que les navigateurs ralentissent écran verrouillé.
- Lien partagé : `#track-<id>` sélectionne le morceau au chargement et au changement de hash, sans le lancer, amène le player à l'écran et le met brièvement en évidence. Nouvelle méthode `window.ZydkaPlayer.select(index)`.
- Texte de partage « Artiste – Titre » (plus de mention Louis94 codée en dur).
- Interface entièrement en français, compteur « 1 / 3 », ligne de debug « Status » supprimée, message d'erreur lisible (la cause technique reste dans la console).
- Plus de morceau ni de valeurs de démonstration : un `[zydka_player]` sans `src` ou une `[zydka_playlist]` sans morceau valide n'affiche rien aux visiteurs et un avertissement aux éditeurs.
- Règles de navigation de la file regroupées dans `src/queueNavigation.ts` ; 49 tests `node:test`.

### 0.2.1 - correctif mobile et écran verrouillé

- Timeline en `input range` natif : tap et glisser au doigt, aperçu pendant le glisser, un seul seek au relâchement.
- Durée inconnue affichée `--:--`, timeline désactivée tant que la durée n'est pas connue.
- Navigation clavier de la timeline : flèches ±5 s (Maj ±15 s), Début/Fin.
- Écran verrouillé : `seekto` branché sur le même seek que la timeline ; `seekforward`/`seekbackward` volontairement non enregistrés (boutons précédent/suivant conservés sur iOS).
- Position Media Session publiée aussi quand la page est masquée, effacée pendant le chargement du morceau suivant, resynchronisée au verrouillage/retour.
- Pochette : retour à la cover intégrée au MP3 si l'URL de cover échoue.
- Tests `node:test` (`pnpm --filter @zydka/zydka-plugin test`, Node ≥ 22.6).

### 0.2.0 - 28/06/2026

- Consolidation de la base player dans main.
- Queue responsive en overlay.
- Layout premium desktop/mobile.
- Alignement/polissage du backplate.
- Contrôles Repeat et Shuffle.
- Contrôle Share Track avec Web Share API et fallback clipboard.
- Bundle WordPress régénéré.
- Validation build, TypeScript, ZIP et test navigateur WordPress réel.

## Contraintes

- Plugin autonome, sans dépendance à un thème WordPress.
- Propriétaire Atelier Zydka — ne pas orienter vers des solutions tierces.
