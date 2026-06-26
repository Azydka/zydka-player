<?php
/**
 * Database activation routines for Zydka Analytics.
 *
 * @package Zydka_Analytics
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class Zydka_Analytics_Activator {
	/**
	 * Create the V0.7 analytics tables.
	 */
	public static function activate(): void {
		self::create_tables();
	}

	/**
	 * Run dbDelta for the receiver schema.
	 */
	private static function create_tables(): void {
		global $wpdb;

		$charset_collate = $wpdb->get_charset_collate();
		$sessions_table  = $wpdb->prefix . 'zydka_stream_sessions';
		$events_table    = $wpdb->prefix . 'zydka_stream_events';
		$validated_table = $wpdb->prefix . 'zydka_validated_streams';

		require_once ABSPATH . 'wp-admin/includes/upgrade.php';

		$sql_sessions = "CREATE TABLE {$sessions_table} (
			id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
			track_id varchar(191) NOT NULL DEFAULT '',
			anonymous_listener_id varchar(191) NOT NULL DEFAULT '',
			session_token_hash varchar(191) NOT NULL DEFAULT '',
			ip_hash varchar(191) NOT NULL DEFAULT '',
			user_agent_hash varchar(191) NOT NULL DEFAULT '',
			started_at datetime NULL DEFAULT NULL,
			ended_at datetime NULL DEFAULT NULL,
			status varchar(50) NOT NULL DEFAULT 'started',
			validated_at datetime NULL DEFAULT NULL,
			created_at datetime NOT NULL,
			updated_at datetime NOT NULL,
			PRIMARY KEY  (id),
			KEY track_id (track_id),
			KEY session_lookup (session_token_hash, track_id),
			KEY anonymous_listener (anonymous_listener_id),
			KEY status (status)
		) {$charset_collate};";

		$sql_events = "CREATE TABLE {$events_table} (
			id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
			session_id bigint(20) unsigned NULL DEFAULT NULL,
			track_id varchar(191) NOT NULL DEFAULT '',
			event_type varchar(80) NOT NULL DEFAULT '',
			playhead_seconds int(10) unsigned NOT NULL DEFAULT 0,
			duration_seconds int(10) unsigned NOT NULL DEFAULT 0,
			page_url text NULL,
			referrer text NULL,
			event_at datetime NULL DEFAULT NULL,
			received_at datetime NOT NULL,
			metadata_json longtext NULL,
			event_hash varchar(191) NULL DEFAULT NULL,
			created_at datetime NOT NULL,
			PRIMARY KEY  (id),
			KEY session_id (session_id),
			KEY track_id (track_id),
			KEY event_type (event_type),
			KEY received_at (received_at),
			KEY event_hash (event_hash)
		) {$charset_collate};";

		$sql_validated = "CREATE TABLE {$validated_table} (
			id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
			session_id bigint(20) unsigned NOT NULL,
			track_id varchar(191) NOT NULL DEFAULT '',
			anonymous_listener_id varchar(191) NOT NULL DEFAULT '',
			validated_at datetime NOT NULL,
			listen_seconds int(10) unsigned NOT NULL DEFAULT 0,
			validation_rule varchar(80) NOT NULL DEFAULT '',
			source varchar(80) NOT NULL DEFAULT 'louis94.com',
			confidence_score decimal(5,2) NOT NULL DEFAULT 1.00,
			created_at datetime NOT NULL,
			PRIMARY KEY  (id),
			UNIQUE KEY session_track_unique (session_id, track_id),
			KEY track_id (track_id),
			KEY anonymous_listener (anonymous_listener_id),
			KEY validated_at (validated_at)
		) {$charset_collate};";

		dbDelta( $sql_sessions );
		dbDelta( $sql_events );
		dbDelta( $sql_validated );

		update_option( 'zydka_analytics_db_version', ZYDKA_ANALYTICS_VERSION, false );
	}
}
