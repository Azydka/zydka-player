# Zydka Analytics

Zydka Analytics V0.7.1 is a minimal WordPress receiver for proprietary listening analytics emitted by Zydka Player V0.6 on `louis94.com`.

The plugin receives player events, stores normalized raw events, creates or reuses a stream session, and validates one proprietary stream when a valid checkpoint is received.

## REST endpoint

```text
POST /wp-json/zydka/v1/streams/event
```

The endpoint is public and write-only so browser `sendBeacon` or `fetch` calls can post events without a WordPress login. The plugin does not expose a public statistics read endpoint.

## Accepted events

```text
play_started
play_30s_checkpoint
play_completed
play_stopped
license_cta_clicked
download_cta_clicked
```

Unknown event types are rejected with:

```json
{
  "success": false,
  "error": "invalid_event_type"
}
```

## Payload

Primary V0.6 test payload:

```json
{
  "event": "zydka_player_event",
  "event_type": "play_started",
  "schema_version": "1.1",
  "source": "zydka-player",
  "site": "louis94.com",
  "track_id": "test-track-v07",
  "track_title": "Test Track V0.7",
  "position_seconds": 0,
  "duration_seconds": 120,
  "page_url": "https://www.louis94.com/test-zydka-player/",
  "referrer": "",
  "session_token": "test-session-v07"
}
```

The receiver accepts both `position_seconds` and `playhead_seconds`, then stores the normalized value as `playhead_seconds`.

Priority:

```text
position_seconds
playhead_seconds
0
```

## Success responses

```json
{
  "success": true,
  "data": {
    "received": true
  }
}
```

Checkpoint with a new validation:

```json
{
  "success": true,
  "data": {
    "received": true,
    "validated": true
  }
}
```

## Tables

Activation creates:

```text
wp_zydka_stream_sessions
wp_zydka_stream_events
wp_zydka_validated_streams
```

The actual prefix follows the WordPress `$wpdb->prefix` value.

`track_id` is stored as `varchar(191)` so player track slugs such as `new-york-shit`, `lifes-a-bitch-arsenal-mix`, and `test-track-v07` are accepted.

`wp_zydka_stream_sessions` stores one server-side listening session per track/listener token where possible. It stores hashes for IP, User-Agent, and session token.

`wp_zydka_stream_events` stores normalized event rows and non-private metadata JSON.

`wp_zydka_validated_streams` stores one validation per `session_id + track_id` through:

```sql
UNIQUE KEY session_track_unique (session_id, track_id)
```

## Validation rule V0.7

A stream is validated when:

```text
event_type = play_30s_checkpoint
track_id exists
session_id exists
no validation already exists for session_id + track_id
```

For tracks shorter than 60 seconds, the server accepts validation when `playhead_seconds` is at least 50 percent of `duration_seconds`.

## Front endpoint injection

The plugin exposes both front-end compatibility globals:

```js
window.zydkaPlayerAnalyticsEndpoint = "/wp-json/zydka/v1/streams/event";
window.zydkaPlayerAnalytics = window.zydkaPlayerAnalytics || {};
window.zydkaPlayerAnalytics.endpoint = window.zydkaPlayerAnalyticsEndpoint;
```

This injection is non-blocking and does not require `zydka-player` to be active.

## Privacy

The plugin never stores raw IP addresses. IP addresses, User-Agent values, and session tokens are hashed with WordPress salts before storage.

The plugin does not store WooCommerce customer data, payment data, DSP data, SACEM data, Spotify data, Apple Music data, Deezer data, YouTube data, or public counters.

## Server installation and tests

### 1. Aller dans WordPress

```bash
cd /home/zivi5632/louis94.com
```

### 2. Verifier les plugins

```bash
wp plugin list | grep zydka
```

### 3. Activer le plugin

```bash
wp plugin activate zydka-analytics
```

### 4. Verifier les tables

```bash
wp db tables | grep zydka
```

Tables attendues:

```text
wp_zydka_stream_sessions
wp_zydka_stream_events
wp_zydka_validated_streams
```

### 5. Test `play_started`

```bash
curl -X POST https://www.louis94.com/wp-json/zydka/v1/streams/event \
  -H "Content-Type: application/json" \
  -d '{
    "event": "zydka_player_event",
    "event_type": "play_started",
    "schema_version": "1.1",
    "source": "zydka-player",
    "site": "louis94.com",
    "track_id": "test-track-v07",
    "track_title": "Test Track V0.7",
    "position_seconds": 0,
    "duration_seconds": 120,
    "page_url": "https://www.louis94.com/test-zydka-player/",
    "referrer": "",
    "session_token": "test-session-v07"
  }'
```

### 6. Test `play_30s_checkpoint`

```bash
curl -X POST https://www.louis94.com/wp-json/zydka/v1/streams/event \
  -H "Content-Type: application/json" \
  -d '{
    "event": "zydka_player_event",
    "event_type": "play_30s_checkpoint",
    "schema_version": "1.1",
    "source": "zydka-player",
    "site": "louis94.com",
    "track_id": "test-track-v07",
    "track_title": "Test Track V0.7",
    "position_seconds": 30,
    "duration_seconds": 120,
    "page_url": "https://www.louis94.com/test-zydka-player/",
    "referrer": "",
    "session_token": "test-session-v07"
  }'
```

### 7. Verifier les events en base

```bash
wp db query "SELECT id, track_id, event_type, playhead_seconds, received_at FROM wp_zydka_stream_events ORDER BY id DESC LIMIT 10;"
```

### 8. Verifier les validations

```bash
wp db query "SELECT id, session_id, track_id, listen_seconds, validation_rule, validated_at FROM wp_zydka_validated_streams ORDER BY id DESC LIMIT 10;"
```

### 9. Test anti-doublon

Relancer le meme `play_30s_checkpoint`, puis:

```bash
wp db query "SELECT COUNT(*) FROM wp_zydka_validated_streams WHERE track_id = 'test-track-v07';"
```

Resultat attendu:

```text
1
```

### 10. Test vrai player

Sur navigateur:

```text
https://www.louis94.com/test-zydka-player/
```

Console:

```js
window.zydkaPlayerAnalytics
```

ou:

```js
window.zydkaPlayerAnalyticsEndpoint
```

Resultat attendu:

```text
/wp-json/zydka/v1/streams/event
```

Puis lire une track, attendre 30 secondes, changer de track, et verifier:

```bash
wp db query "SELECT id, track_id, event_type, playhead_seconds, received_at FROM wp_zydka_stream_events ORDER BY id DESC LIMIT 20;"
```

## Rollback

Rollback simple:

```bash
cd /home/zivi5632/louis94.com
wp plugin deactivate zydka-analytics
```

Verifier:

```bash
wp plugin list | grep zydka
```

Les plugins suivants doivent rester actifs:

```text
zydka-player
zydka-player-manager
```

Les tables ne doivent pas etre supprimees automatiquement.

Database rollback is manual only:

```text
export SQL first
confirm deletion explicitly
drop tables manually only after backup
```

## V0.7.1 limits

This version does not provide:

```text
dashboard
charts
CSV exports
public counter
WooCommerce integration
advanced fraud detection
multi-device tracking
SACEM or DSP recognition
complete admin interface
```

Recommended commit:

```bash
git add wp-content/plugins/zydka-analytics
git commit -m "fix(zydka-analytics): harden receiver mvp before server test"
```
