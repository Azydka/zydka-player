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

## Contraintes

- Plugin autonome, sans dépendance à un thème WordPress.
- Propriétaire Atelier Zydka — ne pas orienter vers des solutions tierces.
