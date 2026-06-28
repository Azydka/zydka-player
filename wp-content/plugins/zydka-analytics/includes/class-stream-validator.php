<?php
/**
 * Minimal stream validation for Zydka Analytics.
 *
 * @package Zydka_Analytics
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class Zydka_Analytics_Stream_Validator {
	/**
	 * Validate a stream from a normalized analytics event.
	 *
	 * @param array<string,mixed> $event Normalized event data.
	 * @return bool True when a validation row was inserted.
	 */
	public static function maybe_validate( array $event ): bool {
		if ( 'play_30s_checkpoint' !== ( $event['event_type'] ?? '' ) ) {
			return false;
		}

		$session_id       = absint( $event['session_id'] ?? 0 );
		$track_id         = (string) ( $event['track_id'] ?? '' );
		$playhead_seconds = absint( $event['playhead_seconds'] ?? 0 );
		$duration_seconds = absint( $event['duration_seconds'] ?? 0 );

		if ( ! $session_id || '' === $track_id ) {
			return false;
		}

		$eligible = true;

		if ( $duration_seconds > 0 && $duration_seconds < 60 ) {
			$eligible = $playhead_seconds >= (int) ceil( $duration_seconds * 0.5 );
		}

		if ( ! $eligible ) {
			return false;
		}

		global $wpdb;

		$validated_table = $wpdb->prefix . 'zydka_validated_streams';

		$exists = (int) $wpdb->get_var(
			$wpdb->prepare(
				"SELECT id FROM {$validated_table} WHERE session_id = %d AND track_id = %s LIMIT 1",
				$session_id,
				$track_id
			)
		);

		if ( $exists ) {
			return false;
		}

		$now                   = current_time( 'mysql' );
		$anonymous_listener_id = (string) ( $event['anonymous_listener_id'] ?? '' );
		$validation_rule       = ( $duration_seconds > 0 && $duration_seconds < 60 ) ? 'short_track_half_duration' : 'play_30s_checkpoint';

		$inserted = $wpdb->insert(
			$validated_table,
			[
				'session_id'            => $session_id,
				'track_id'              => $track_id,
				'anonymous_listener_id' => $anonymous_listener_id,
				'validated_at'          => $now,
				'listen_seconds'        => $playhead_seconds,
				'validation_rule'       => $validation_rule,
				'source'                => 'louis94.com',
				'confidence_score'      => 1.00,
				'created_at'            => $now,
			],
			[
				'%d',
				'%s',
				'%s',
				'%s',
				'%d',
				'%s',
				'%s',
				'%f',
				'%s',
			]
		);

		if ( false === $inserted ) {
			return false;
		}

		$sessions_table = $wpdb->prefix . 'zydka_stream_sessions';

		$wpdb->update(
			$sessions_table,
			[
				'status'       => 'validated',
				'validated_at' => $now,
				'updated_at'   => $now,
			],
			[
				'id'       => $session_id,
				'track_id' => $track_id,
			],
			[
				'%s',
				'%s',
				'%s',
			],
			[
				'%d',
				'%s',
			]
		);

		return true;
	}
}
