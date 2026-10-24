# T0 — Contrôle de production en lecture seule

Date : 2026-10-24, vers 16:35 (Europe/Paris)

Statut : **terminé. Aucune écriture en production.** Contrôle fait par le navigateur intégré de l'app desktop, en visiteur non connecté, avec des requêtes GET uniquement. Aucune lecture audio, aucun événement envoyé.

## Constats

### 1. Musique de tiers diffusée publiquement (P0 juridique)

`/demo-track/` (page 83) répond en visiteur anonyme, sans mode Coming Soon. Elle affiche la playlist Manager 97 (`data-source="manager-playlist"`), avec trois titres d'Anderson .Paak :

| Track | Fichier audio |
|---|---|
| 90 | `10-anderson_.paak-get_em_up-ftd.mp3` |
| 88 | `15-anderson_.paak-right_there-ftd.mp3` |
| 92 | `07-anderson_.paak-already_ft._sir-ftd.mp3` |

`/wp-json/zydka-player-manager/v1/playlist/97` répond 200 au public.

Aucune preuve de droits n'est documentée (voir MVP-COM-3). À retirer du public avant toute communication sur le site.

### 2. Aucune mesure d'écoute depuis le player actuel

- Le plugin Zydka Analytics est actif : la route `POST /zydka/v1/streams/event` est déclarée, et `window.zydkaPlayerAnalyticsEndpoint` est injecté dans la page.
- Le JS du player servi en production (`zydka-player.js?ver=0.4.0`, 171 206 octets) ne contient ni `streams/event`, ni `sendBeacon`, ni `zydkaPlayerAnalytics`.
- Conclusion : le player en production n'envoie aucun événement. Les Louis94 Verified Plays n'augmentent plus. Le relevé de juin (76 événements, 11 écoutes validées) date d'une version antérieure. La date du dernier événement reçu reste à lire dans l'admin Zydka Analytics.

### 3. Versions servies

| Composant | Version servie |
|---|---|
| Zydka Player | 0.4.0 (JS et CSS) |
| Zydka Player Manager | 0.6.0 (`front.css`) |
| Thème | `louis94-theme`, `louis94.css?ver=0.1.0` |

Le thème n'est versionné dans aucun dépôt accessible.

### 4. Pages publiques

L'API REST publique ne liste que ces pages : `my-account`, `checkout`, `cart`, `shop`, `testoss` (101), `demo-track` (83), `test-zydka-player` (12), `sample-page` (2).

Ces adresses répondent 404 : `/beats/`, `/kits/`, `/collaborer/`, `/contact/`, `/licences/`, `/cgv/`, `/mentions-legales/`, `/politique-de-confidentialite/`.

L'accueil répond 200 et n'est pas en Coming Soon. Les pages commerciales et légales du MVP restent à créer.

## Actions recommandées (propriétaire, avec accord)

1. Passer la page 83 `demo-track` en brouillon ou privée.
2. Passer les tracks 88, 90 et 92 en brouillon. Leurs fichiers MP3 restent accessibles par URL directe tant qu'ils sont dans la médiathèque : décider de leur suppression.
3. Passer en brouillon les pages de test `testoss` (101) et `sample-page` (2). `test-zydka-player` (12) peut rester si elle sert aux tests de non-régression, en privé de préférence.
4. Remplacer la playlist de démonstration par des previews taguées Louis94 dont les droits sont confirmés.
5. Ticket T1 : client analytics dans le player.
