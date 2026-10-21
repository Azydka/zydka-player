<?php
/**
 * Custom post types for Zydka Player Manager.
 *
 * @package ZydkaPlayerManager
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class Zydka_Player_Manager_Post_Types {
	/**
	 * Register hooks.
	 */
	public static function init(): void {
		add_action( 'init', [ __CLASS__, 'register_post_types' ] );
		add_action( 'init', [ __CLASS__, 'register_meta' ] );
	}

	/**
	 * Track types allowed in V0.2.
	 *
	 * @return array<string,string>
	 */
	public static function get_track_types(): array {
		$types = [
			'morceau'     => __( 'Morceau', 'zydka-player-manager' ),
			'beat'        => __( 'Beat', 'zydka-player-manager' ),
			'kit_preview' => __( 'Kit preview', 'zydka-player-manager' ),
			'demo'        => __( 'Demo', 'zydka-player-manager' ),
			'archive'     => __( 'Archive', 'zydka-player-manager' ),
		];

		return apply_filters( 'zydka_player_manager_allowed_track_types', $types );
	}

	/**
	 * Commercial statuses allowed in V0.2.
	 *
	 * @return array<string,string>
	 */
	public static function get_commercial_statuses(): array {
		$statuses = [
			'listen_only'     => __( 'Ecoute seule', 'zydka-player-manager' ),
			'free'            => __( 'Gratuit', 'zydka-player-manager' ),
			'license_request' => __( 'Licence sur demande', 'zydka-player-manager' ),
			'linked_product'  => __( 'Produit associe', 'zydka-player-manager' ),
			'archived'        => __( 'Archive', 'zydka-player-manager' ),
		];

		return apply_filters( 'zydka_player_manager_allowed_commercial_statuses', $statuses );
	}

	/**
	 * Get a readable track type label, including legacy values.
	 */
	public static function get_track_type_label( string $type ): string {
		$types  = self::get_track_types();
		$legacy = [
			'loop' => __( 'Loop', 'zydka-player-manager' ),
		];

		return $types[ $type ] ?? $legacy[ $type ] ?? $type;
	}

	/**
	 * Get a readable commercial status label, including legacy values.
	 */
	public static function get_commercial_status_label( string $status ): string {
		$statuses = self::get_commercial_statuses();
		$legacy   = [
			'beat_available'         => __( 'Licence sur demande', 'zydka-player-manager' ),
			'license_available'      => __( 'Licence sur demande', 'zydka-player-manager' ),
			'exclusivity_on_request' => __( 'Licence sur demande', 'zydka-player-manager' ),
			'kit_preview'            => __( 'Ecoute seule', 'zydka-player-manager' ),
			'free_download'          => __( 'Gratuit', 'zydka-player-manager' ),
			'product_sold'           => __( 'Produit associe', 'zydka-player-manager' ),
		];

		return $statuses[ $status ] ?? $legacy[ $status ] ?? $status;
	}

	/**
	 * Register CPTs.
	 */
	public static function register_post_types(): void {
		register_post_type(
			'zydka_track',
			[
				'labels'              => [
					'name'               => __( 'Tracks', 'zydka-player-manager' ),
					'singular_name'      => __( 'Track', 'zydka-player-manager' ),
					'add_new'            => __( 'Ajouter', 'zydka-player-manager' ),
					'add_new_item'       => __( 'Ajouter une track', 'zydka-player-manager' ),
					'edit_item'          => __( 'Modifier la track', 'zydka-player-manager' ),
					'new_item'           => __( 'Nouvelle track', 'zydka-player-manager' ),
					'view_item'          => __( 'Voir la track', 'zydka-player-manager' ),
					'search_items'       => __( 'Rechercher des tracks', 'zydka-player-manager' ),
					'not_found'          => __( 'Aucune track trouvee', 'zydka-player-manager' ),
					'not_found_in_trash' => __( 'Aucune track dans la corbeille', 'zydka-player-manager' ),
					'menu_name'          => __( 'Tracks', 'zydka-player-manager' ),
				],
				'public'              => false,
				'show_ui'             => true,
				'show_in_menu'        => ZYDKA_PLAYER_MANAGER_MENU_SLUG,
				'exclude_from_search' => true,
				'show_in_rest'        => true,
				'supports'            => [ 'title', 'editor', 'thumbnail' ],
				'capability_type'     => 'post',
				'has_archive'         => false,
				'rewrite'             => false,
			]
		);

		register_post_type(
			'zydka_catalog',
			[
				'labels'              => [
					'name'               => __( 'Playlists', 'zydka-player-manager' ),
					'singular_name'      => __( 'Playlist', 'zydka-player-manager' ),
					'add_new'            => __( 'Ajouter', 'zydka-player-manager' ),
					'add_new_item'       => __( 'Ajouter une playlist', 'zydka-player-manager' ),
					'edit_item'          => __( 'Modifier la playlist', 'zydka-player-manager' ),
					'new_item'           => __( 'Nouvelle playlist', 'zydka-player-manager' ),
					'view_item'          => __( 'Voir la playlist', 'zydka-player-manager' ),
					'search_items'       => __( 'Rechercher des playlists', 'zydka-player-manager' ),
					'not_found'          => __( 'Aucune playlist trouvee', 'zydka-player-manager' ),
					'not_found_in_trash' => __( 'Aucune playlist dans la corbeille', 'zydka-player-manager' ),
					'menu_name'          => __( 'Playlists', 'zydka-player-manager' ),
				],
				'public'              => false,
				'show_ui'             => true,
				'show_in_menu'        => ZYDKA_PLAYER_MANAGER_MENU_SLUG,
				'exclude_from_search' => true,
				'show_in_rest'        => true,
				'supports'            => [ 'title', 'editor' ],
				'capability_type'     => 'post',
				'has_archive'         => false,
				'rewrite'             => false,
			]
		);
	}

	/**
	 * Register known post meta for REST/editor consistency.
	 */
	public static function register_meta(): void {
		$track_string_meta = [
			'_zydka_track_artist',
			'_zydka_track_album',
			'_zydka_track_type',
			'_zydka_track_key',
			'_zydka_track_mood',
			'_zydka_track_style',
			'_zydka_track_isrc',
			'_zydka_track_commercial_status',
		];

		foreach ( $track_string_meta as $meta_key ) {
			register_post_meta(
				'zydka_track',
				$meta_key,
				[
					'type'              => 'string',
					'single'            => true,
					'show_in_rest'      => true,
					'sanitize_callback' => 'sanitize_text_field',
					'auth_callback'     => [ __CLASS__, 'can_edit_meta' ],
				]
			);
		}

		foreach ( [ '_zydka_track_audio_url', '_zydka_track_cover_url', '_zydka_track_download_url' ] as $meta_key ) {
			register_post_meta(
				'zydka_track',
				$meta_key,
				[
					'type'              => 'string',
					'single'            => true,
					'show_in_rest'      => true,
					'sanitize_callback' => 'esc_url_raw',
					'auth_callback'     => [ __CLASS__, 'can_edit_meta' ],
				]
			);
		}

		register_post_meta(
			'zydka_track',
			'_zydka_track_bpm',
			[
				'type'              => 'integer',
				'single'            => true,
				'show_in_rest'      => true,
				'sanitize_callback' => 'absint',
				'auth_callback'     => [ __CLASS__, 'can_edit_meta' ],
			]
		);

		register_post_meta(
			'zydka_track',
			'_zydka_track_product_id',
			[
				'type'              => 'integer',
				'single'            => true,
				'show_in_rest'      => true,
				'sanitize_callback' => 'absint',
				'auth_callback'     => [ __CLASS__, 'can_edit_meta' ],
			]
		);

		register_post_meta(
			'zydka_catalog',
			'_zydka_catalog_track_ids',
			[
				'type'              => 'array',
				'single'            => true,
				'show_in_rest'      => [
					'schema' => [
						'type'  => 'array',
						'items' => [ 'type' => 'integer' ],
					],
				],
				'sanitize_callback' => [ __CLASS__, 'sanitize_id_array' ],
				'auth_callback'     => [ __CLASS__, 'can_edit_meta' ],
			]
		);

		register_post_meta(
			'zydka_catalog',
			'_zydka_catalog_public_display',
			[
				'type'              => 'boolean',
				'single'            => true,
				'show_in_rest'      => true,
				'sanitize_callback' => [ __CLASS__, 'sanitize_bool' ],
				'auth_callback'     => [ __CLASS__, 'can_edit_meta' ],
			]
		);
	}

	/**
	 * Check edit permission for registered meta.
	 *
	 * @param bool   $allowed Whether access is allowed.
	 * @param string $meta_key Meta key.
	 * @param int    $post_id Post ID.
	 */
	public static function can_edit_meta( bool $allowed, string $meta_key, int $post_id ): bool {
		unset( $allowed, $meta_key );

		return current_user_can( 'edit_post', $post_id );
	}

	/**
	 * Sanitize arrays of post IDs.
	 *
	 * @param mixed $value Raw value.
	 * @return array<int>
	 */
	public static function sanitize_id_array( $value ): array {
		if ( ! is_array( $value ) ) {
			return [];
		}

		return array_values( array_unique( array_filter( array_map( 'absint', $value ) ) ) );
	}

	/**
	 * Sanitize boolean-like values.
	 *
	 * @param mixed $value Raw value.
	 */
	public static function sanitize_bool( $value ): bool {
		return (bool) $value;
	}
}
