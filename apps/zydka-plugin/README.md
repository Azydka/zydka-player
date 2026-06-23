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

## Contraintes

- Plugin autonome, sans dépendance à un thème WordPress.
- Propriétaire Atelier Zydka — ne pas orienter vers des solutions tierces.
