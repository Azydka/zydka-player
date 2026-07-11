<?php
/**
 * REST receiver for Zydka Player analytics events.
 *
 * @package Zydka_Analytics
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class Zydka_Analytics_REST_API {
	private const MAX_METADATA_BYTES = 20000;

	/**
	 * Register REST hooks.
	 */
	public static function init(): void {
		add_action( 'rest_api_init', [ __CLASS__, 'register_routes' ] );
	}

	/**
	 * Register the public write-only receiver endpoint.
	 */
	public static function register_routes(): void {
		register_rest_route(
			ZYDKA_ANALYTICS_REST_NAMESPACE,
			'/streams/event',
			[
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => [ __CLASS__, 'handle_event' ],
				'permission_callback' => '__return_true',
			]
		);
	}

	/**
	 * Receive, sanitize, store and maybe validate a player event.
	 *
	 * @param WP_REST_Request $request REST request.
	 * @return WP_REST_Response
	 */
	public static function handle_event( WP_REST_Request $request ): WP_REST_Response {
		$payload    = self::get_payload( $request );
		$event_type = self::sanitize_limited_text( $payload['event_type'] ?? '', 80 );

		if ( ! in_array( $event_type, self::allowed_event_types(), true ) ) {
			return self::error_response( 'invalid_event_type', 400 );
		}

		$track_id = self::sanitize_limited_text( $payload['track_id'] ?? '', 191 );

		if ( '' === $track_id ) {
			return self::error_response( 'missing_track_id', 400 );
		}

		$normalized = self::normalize_payload( $payload, $event_type, $track_id, $request );
		$session_id = self::find_or_create_session( $normalized );

		if ( ! $session_id ) {
			return self::error_response( 'session_write_failed', 500 );
		}

		$normalized['session_id'] = $session_id;
		$event_id                 = self::insert_event( $normalized );

		if ( ! $event_id ) {
			return self::error_response( 'event_write_failed', 500 );
		}

		$validated = Zydka_Analytics_Stream_Validator::maybe_validate( $normalized );

		$data = [
			'received' => true,
		];

		if ( $validated ) {
			$data['validated'] = true;
		}

		return new WP_REST_Response(
			[
				'success' => true,
				'data'    => $data,
			],
			200
		);
	}

	/**
	 * Accepted event types for V0.7.
	 *
	 * @return string[]
	 */
	private static function allowed_event_types(): array {
		return [
			'play_started',
			'play_30s_checkpoint',
			'play_completed',
			'play_stopped',
			'license_cta_clicked',
			'download_cta_clicked',
		];
	}

	/**
	 * Read and unslash request payload data.
	 *
	 * @param WP_REST_Request $request REST request.
	 * @return array<string,mixed>
	 */
	private static function get_payload( WP_REST_Request $request ): array {
		$params = $request->get_json_params();

		if ( ! is_array( $params ) ) {
			$params = $request->get_body_params();
		}

		if ( ! is_array( $params ) ) {
			return [];
		}

		return map_deep( $params, 'wp_unslash' );
	}

	/**
	 * Build normalized event data for storage.
	 *
	 * @param array<string,mixed> $payload Raw request payload.
	 * @param string              $event_type Accepted event type.
	 * @param string              $track_id Sanitized track ID.
	 * @param WP_REST_Request     $request REST request.
	 * @return array<string,mixed>
	 */
	private static function normalize_payload( array $payload, string $event_type, string $track_id, WP_REST_Request $request ): array {
		$playhead_seconds = self::unsigned_int( $payload['position_seconds'] ?? ( $payload['playhead_seconds'] ?? 0 ) );
		$duration_seconds = self::unsigned_int( $payload['duration_seconds'] ?? 0 );
		$session_token    = self::sanitize_limited_text( $payload['session_token'] ?? '', 191 );
		$ip_hash          = self::hash_value( self::get_client_ip() );
		$user_agent_hash  = self::hash_value( self::get_user_agent( $request ) );

		$anonymous_listener_seed = '' !== $session_token ? $session_token : $ip_hash . '|' . $user_agent_hash;
		$anonymous_listener_id   = self::hash_value( $anonymous_listener_seed );
		$session_hash_seed       = '' !== $session_token ? $session_token : $anonymous_listener_seed;

		$event_at = self::sanitize_event_datetime( $payload['timestamp'] ?? '' );
		$metadata = self::build_metadata( $payload );

		return [
			'event_type'            => $event_type,
			'track_id'              => $track_id,
			'anonymous_listener_id' => $anonymous_listener_id,
			'session_token_hash'    => self::hash_value( $session_hash_seed ),
			'ip_hash'               => $ip_hash,
			'user_agent_hash'       => $user_agent_hash,
			'playhead_seconds'      => $playhead_seconds,
			'duration_seconds'      => $duration_seconds,
			'page_url'              => self::sanitize_limited_url( $payload['page_url'] ?? '', 2000 ),
			'referrer'              => self::sanitize_limited_url( $payload['referrer'] ?? '', 2000 ),
			'event_at'              => $event_at,
			'metadata_json'         => $metadata,
			'event_hash'            => self::hash_value( $track_id . '|' . $event_type . '|' . $anonymous_listener_id . '|' . $event_at . '|' . $playhead_seconds ),
		];
	}

	/**
	 * Find or create a stream session for this listener/track pair.
	 *
	 * @param array<string,mixed> $event Normalized event data.
	 * @return int Session ID, or 0 on failure.
	 */
	private static function find_or_create_session( array $event ): int {
		global $wpdb;

		$sessions_table = $wpdb->prefix . 'zydka_stream_sessions';
		$session_hash   = (string) $event['session_token_hash'];
		$track_id       = (string) $event['track_id'];
		$now            = current_time( 'mysql' );

		$session_id = (int) $wpdb->get_var(
			$wpdb->prepare(
				"SELECT id FROM {$sessions_table} WHERE session_token_hash = %s AND track_id = %s ORDER BY id DESC LIMIT 1",
				$session_hash,
				$track_id
			)
		);

		if ( $session_id ) {
			self::update_session_status( $session_id, (string) $event['event_type'] );
			return $session_id;
		}

		$status = self::status_for_event( (string) $event['event_type'] );

		$inserted = $wpdb->insert(
			$sessions_table,
			[
				'track_id'              => $track_id,
				'anonymous_listener_id' => (string) $event['anonymous_listener_id'],
				'session_token_hash'    => $session_hash,
				'ip_hash'               => (string) $event['ip_hash'],
				'user_agent_hash'       => (string) $event['user_agent_hash'],
				'started_at'            => $now,
				'ended_at'              => in_array( $status, [ 'completed', 'stopped' ], true ) ? $now : null,
				'status'                => $status,
				'validated_at'          => null,
				'created_at'            => $now,
				'updated_at'            => $now,
			],
			[
				'%s',
				'%s',
				'%s',
				'%s',
				'%s',
				'%s',
				'%s',
				'%s',
				'%s',
				'%s',
				'%s',
			]
		);

		if ( false === $inserted ) {
			return 0;
		}

		return (int) $wpdb->insert_id;
	}

	/**
	 * Update session lifecycle fields after a new event.
	 *
	 * @param int    $session_id Session ID.
	 * @param string $event_type Event type.
	 */
	private static function update_session_status( int $session_id, string $event_type ): void {
		global $wpdb;

		$status = self::status_for_event( $event_type );
		$now    = current_time( 'mysql' );

		$current_status = (string) $wpdb->get_var(
			$wpdb->prepare(
				"SELECT status FROM {$wpdb->prefix}zydka_stream_sessions WHERE id = %d LIMIT 1",
				$session_id
			)
		);

		if ( 'validated' === $current_status && ! in_array( $status, [ 'completed', 'stopped' ], true ) ) {
			$status = 'validated';
		}

		if ( 'started' === $status && '' !== $current_status && 'started' !== $current_status ) {
			$status = $current_status;
		}

		$data   = [
			'status'     => $status,
			'updated_at' => $now,
		];
		$format = [
			'%s',
			'%s',
		];

		if ( in_array( $status, [ 'completed', 'stopped' ], true ) ) {
			$data['ended_at'] = $now;
			$format[]         = '%s';
		}

		$wpdb->update(
			$wpdb->prefix . 'zydka_stream_sessions',
			$data,
			[ 'id' => $session_id ],
			$format,
			[ '%d' ]
		);
	}

	/**
	 * Insert the raw normalized event.
	 *
	 * @param array<string,mixed> $event Normalized event data.
	 * @return int Event ID, or 0 on failure.
	 */
	private static function insert_event( array $event ): int {
		global $wpdb;

		$now      = current_time( 'mysql' );
		$inserted = $wpdb->insert(
			$wpdb->prefix . 'zydka_stream_events',
			[
				'session_id'       => absint( $event['session_id'] ),
				'track_id'         => (string) $event['track_id'],
				'event_type'       => (string) $event['event_type'],
				'playhead_seconds' => absint( $event['playhead_seconds'] ),
				'duration_seconds' => absint( $event['duration_seconds'] ),
				'page_url'         => (string) $event['page_url'],
				'referrer'         => (string) $event['referrer'],
				'event_at'         => $event['event_at'] ? (string) $event['event_at'] : null,
				'received_at'      => $now,
				'metadata_json'    => (string) $event['metadata_json'],
				'event_hash'       => (string) $event['event_hash'],
				'created_at'       => $now,
			],
			[
				'%d',
				'%s',
				'%s',
				'%d',
				'%d',
				'%s',
				'%s',
				'%s',
				'%s',
				'%s',
				'%s',
				'%s',
			]
		);

		if ( false === $inserted ) {
			return 0;
		}

		return (int) $wpdb->insert_id;
	}

	/**
	 * Map player events to coarse session statuses.
	 *
	 * @param string $event_type Event type.
	 * @return string
	 */
	private static function status_for_event( string $event_type ): string {
		switch ( $event_type ) {
			case 'play_30s_checkpoint':
				return 'checkpoint_reached';
			case 'play_completed':
				return 'completed';
			case 'play_stopped':
				return 'stopped';
			default:
				return 'started';
		}
	}

	/**
	 * Create safe JSON metadata from non-private payload fields.
	 *
	 * @param array<string,mixed> $payload Raw request payload.
	 * @return string
	 */
	private static function build_metadata( array $payload ): string {
		$metadata = [
			'event'            => self::sanitize_limited_text( $payload['event'] ?? '', 80 ),
			'schema_version'   => self::sanitize_limited_text( $payload['schema_version'] ?? '', 20 ),
			'source'           => self::sanitize_limited_text( $payload['source'] ?? '', 80 ),
			'site'             => self::sanitize_limited_text( $payload['site'] ?? '', 191 ),
			'track_title'      => self::sanitize_limited_text( $payload['track_title'] ?? '', 255 ),
			'artist'           => self::sanitize_limited_text( $payload['artist'] ?? '', 191 ),
			'album'            => self::sanitize_limited_text( $payload['album'] ?? '', 191 ),
			'track_type'       => self::sanitize_limited_text( $payload['track_type'] ?? '', 80 ),
			'progress_percent' => self::bounded_float( $payload['progress_percent'] ?? 0, 0, 100 ),
			'queue_length'     => self::unsigned_int( $payload['queue_length'] ?? 0 ),
			'queue_index'      => self::unsigned_int( $payload['queue_index'] ?? 0 ),
		];

		$json = wp_json_encode( $metadata );

		if ( ! is_string( $json ) ) {
			return '';
		}

		if ( strlen( $json ) > self::MAX_METADATA_BYTES ) {
			return substr( $json, 0, self::MAX_METADATA_BYTES );
		}

		return $json;
	}

	/**
	 * Sanitize text and enforce a maximum character length.
	 *
	 * @param mixed $value Input value.
	 * @param int   $max_length Maximum length.
	 * @return string
	 */
	private static function sanitize_limited_text( $value, int $max_length ): string {
		if ( is_array( $value ) || is_object( $value ) ) {
			return '';
		}

		$value = sanitize_text_field( (string) $value );

		if ( function_exists( 'mb_substr' ) ) {
			return mb_substr( $value, 0, $max_length );
		}

		return substr( $value, 0, $max_length );
	}

	/**
	 * Sanitize URL and enforce a maximum length.
	 *
	 * @param mixed $value Input value.
	 * @param int   $max_length Maximum length.
	 * @return string
	 */
	private static function sanitize_limited_url( $value, int $max_length ): string {
		if ( is_array( $value ) || is_object( $value ) ) {
			return '';
		}

		$value = esc_url_raw( (string) $value );

		if ( function_exists( 'mb_substr' ) ) {
			return mb_substr( $value, 0, $max_length );
		}

		return substr( $value, 0, $max_length );
	}

	/**
	 * Convert a value to a non-negative integer.
	 *
	 * @param mixed $value Input value.
	 * @return int
	 */
	private static function unsigned_int( $value ): int {
		if ( is_array( $value ) || is_object( $value ) ) {
			return 0;
		}

		return max( 0, absint( $value ) );
	}

	/**
	 * Convert a value to a bounded float.
	 *
	 * @param mixed $value Input value.
	 * @param float $min Minimum allowed.
	 * @param float $max Maximum allowed.
	 * @return float
	 */
	private static function bounded_float( $value, float $min, float $max ): float {
		if ( is_array( $value ) || is_object( $value ) ) {
			return $min;
		}

		return min( $max, max( $min, (float) $value ) );
	}

	/**
	 * Convert an ISO timestamp to MySQL datetime when possible.
	 *
	 * @param mixed $value Timestamp value.
	 * @return string|null
	 */
	private static function sanitize_event_datetime( $value ): ?string {
		$value = self::sanitize_limited_text( $value, 80 );

		if ( '' === $value ) {
			return null;
		}

		$timestamp = strtotime( $value );

		if ( false === $timestamp ) {
			return null;
		}

		return gmdate( 'Y-m-d H:i:s', $timestamp );
	}

	/**
	 * Hash sensitive values with WordPress salts.
	 *
	 * @param string $value Value to hash.
	 * @return string
	 */
	private static function hash_value( string $value ): string {
		if ( '' === $value ) {
			return '';
		}

		return hash_hmac( 'sha256', $value, wp_salt( 'auth' ) );
	}

	/**
	 * Best-effort client IP extraction. The raw value is never stored.
	 *
	 * @return string
	 */
	private static function get_client_ip(): string {
		$candidates = [
			'HTTP_CF_CONNECTING_IP',
			'HTTP_X_FORWARDED_FOR',
			'REMOTE_ADDR',
		];

		foreach ( $candidates as $key ) {
			if ( empty( $_SERVER[ $key ] ) ) {
				continue;
			}

			$value = sanitize_text_field( wp_unslash( $_SERVER[ $key ] ) );
			$parts = explode( ',', $value );
			$ip    = trim( (string) $parts[0] );

			if ( filter_var( $ip, FILTER_VALIDATE_IP ) ) {
				return $ip;
			}
		}

		return '';
	}

	/**
	 * Read the User-Agent from the REST request/server.
	 *
	 * @param WP_REST_Request $request REST request.
	 * @return string
	 */
	private static function get_user_agent( WP_REST_Request $request ): string {
		$user_agent = $request->get_header( 'user-agent' );

		if ( empty( $user_agent ) && ! empty( $_SERVER['HTTP_USER_AGENT'] ) ) {
			$user_agent = sanitize_text_field( wp_unslash( $_SERVER['HTTP_USER_AGENT'] ) );
		}

		return self::sanitize_limited_text( $user_agent, 500 );
	}

	/**
	 * Standard JSON error response.
	 *
	 * @param string $error Error code.
	 * @param int    $status HTTP status.
	 * @return WP_REST_Response
	 */
	private static function error_response( string $error, int $status ): WP_REST_Response {
		return new WP_REST_Response(
			[
				'success' => false,
				'error'   => $error,
			],
			$status
		);
	}
}
