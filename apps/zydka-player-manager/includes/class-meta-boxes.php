<?php
/**
 * Admin meta boxes and save handlers.
 *
 * @package ZydkaPlayerManager
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class Zydka_Player_Manager_Meta_Boxes {
	private const TRACK_NONCE_ACTION   = 'zydka_player_manager_save_track';
	private const TRACK_NONCE_NAME     = 'zydka_player_manager_track_nonce';
	private const CATALOG_NONCE_ACTION = 'zydka_player_manager_save_catalog';
	private const CATALOG_NONCE_NAME   = 'zydka_player_manager_catalog_nonce';

	/**
	 * Register hooks.
	 */
	public static function init(): void {
		add_action( 'add_meta_boxes', [ __CLASS__, 'add_meta_boxes' ] );
		add_action( 'save_post_zydka_track', [ __CLASS__, 'save_track' ], 10, 2 );
		add_action( 'save_post_zydka_catalog', [ __CLASS__, 'save_catalog' ], 10, 2 );
	}

	/**
	 * Add plugin meta boxes.
	 */
	public static function add_meta_boxes(): void {
		add_meta_box(
			'zydka-track-details',
			__( 'Details audio', 'zydka-player-manager' ),
			[ __CLASS__, 'render_track_details' ],
			'zydka_track',
			'normal',
			'high'
		);

		add_meta_box(
			'zydka-catalog-tracks',
			__( 'Tracks de la playlist', 'zydka-player-manager' ),
			[ __CLASS__, 'render_catalog_tracks' ],
			'zydka_catalog',
			'normal',
			'high'
		);

		add_meta_box(
			'zydka-catalog-shortcode',
			__( 'Shortcode et contenu', 'zydka-player-manager' ),
			[ __CLASS__, 'render_catalog_shortcode' ],
			'zydka_catalog',
			'side',
			'high'
		);
	}

	/**
	 * Render track metadata fields.
	 *
	 * @param WP_Post $post Current post.
	 */
	public static function render_track_details( WP_Post $post ): void {
		wp_nonce_field( self::TRACK_NONCE_ACTION, self::TRACK_NONCE_NAME );

		echo '<div class="zydka-manager-grid">';

		self::render_select(
			$post->ID,
			'_zydka_track_type',
			__( 'Type', 'zydka-player-manager' ),
			Zydka_Player_Manager_Post_Types::get_track_types()
		);
		self::render_text_input( $post->ID, '_zydka_track_artist', __( 'Artiste', 'zydka-player-manager' ) );
		self::render_text_input( $post->ID, '_zydka_track_album', __( 'Album / Projet', 'zydka-player-manager' ) );
		self::render_url_input( $post->ID, '_zydka_track_audio_url', __( 'Audio preview URL', 'zydka-player-manager' ) );
		self::render_url_input( $post->ID, '_zydka_track_cover_url', __( 'Cover URL', 'zydka-player-manager' ) );
		self::render_number_input( $post->ID, '_zydka_track_bpm', __( 'BPM', 'zydka-player-manager' ) );
		self::render_text_input( $post->ID, '_zydka_track_key', __( 'Tonalite', 'zydka-player-manager' ) );
		self::render_text_input( $post->ID, '_zydka_track_mood', __( 'Mood', 'zydka-player-manager' ) );
		self::render_text_input( $post->ID, '_zydka_track_style', __( 'Style', 'zydka-player-manager' ) );
		self::render_url_input( $post->ID, '_zydka_track_download_url', __( 'Download URL optionnel', 'zydka-player-manager' ) );
		self::render_number_input( $post->ID, '_zydka_track_product_id', __( 'Produit WooCommerce associe ID optionnel', 'zydka-player-manager' ) );
		self::render_select(
			$post->ID,
			'_zydka_track_commercial_status',
			__( 'Statut commercial', 'zydka-player-manager' ),
			Zydka_Player_Manager_Post_Types::get_commercial_statuses()
		);

		echo '</div>';
	}

	/**
	 * Render catalog track selector.
	 *
	 * @param WP_Post $post Current post.
	 */
	public static function render_catalog_tracks( WP_Post $post ): void {
		wp_nonce_field( self::CATALOG_NONCE_ACTION, self::CATALOG_NONCE_NAME );

		$selected_ids = self::get_catalog_track_ids( $post->ID );
		$tracks       = get_posts(
			[
				'post_type'      => 'zydka_track',
				'post_status'    => [ 'publish', 'draft', 'private' ],
				'posts_per_page' => -1,
				'orderby'        => 'title',
				'order'          => 'ASC',
				'fields'         => 'ids',
			]
		);

		if ( ! $tracks ) {
			echo '<p>' . esc_html__( 'Aucune track disponible pour le moment.', 'zydka-player-manager' ) . '</p>';
			return;
		}

		echo '<div class="zydka-catalog-checklist">';
		foreach ( $tracks as $track_id ) {
			$type      = (string) get_post_meta( $track_id, '_zydka_track_type', true );
			$bpm       = absint( get_post_meta( $track_id, '_zydka_track_bpm', true ) );
			$audio_url = (string) get_post_meta( $track_id, '_zydka_track_audio_url', true );
			$summary   = sprintf(
				'%1$s - %2$s - %3$s - %4$s',
				get_the_title( $track_id ),
				Zydka_Player_Manager_Post_Types::get_track_type_label( $type ),
				$bpm ? sprintf( __( '%d BPM', 'zydka-player-manager' ), $bpm ) : __( 'BPM absent', 'zydka-player-manager' ),
				$audio_url ? __( 'Audio OK', 'zydka-player-manager' ) : __( 'Audio absent', 'zydka-player-manager' )
			);

			printf(
				'<label class="zydka-catalog-track-option"><input type="checkbox" name="_zydka_catalog_track_ids[]" value="%1$d" %2$s> <span>%3$s</span></label>',
				absint( $track_id ),
				checked( in_array( $track_id, $selected_ids, true ), true, false ),
				esc_html( $summary )
			);
		}
		echo '</div>';
	}

	/**
	 * Render catalog shortcode and selected track summary.
	 *
	 * @param WP_Post $post Current post.
	 */
	public static function render_catalog_shortcode( WP_Post $post ): void {
		$track_ids = self::get_catalog_track_ids( $post->ID );
		$is_public = (bool) get_post_meta( $post->ID, '_zydka_catalog_public_display', true );

		wp_nonce_field( self::CATALOG_NONCE_ACTION, self::CATALOG_NONCE_NAME );

		printf(
			'<p><label><input type="checkbox" name="_zydka_catalog_public_display" value="1" %s> %s</label></p>',
			checked( $is_public, true, false ),
			esc_html__( 'Autoriser l affichage public', 'zydka-player-manager' )
		);

		if ( $post->ID ) {
			$shortcode = sprintf( '[zydka_playlist id="%d"]', absint( $post->ID ) );
			echo '<p><strong>' . esc_html__( 'Shortcode', 'zydka-player-manager' ) . '</strong></p>';
			printf( '<p><code class="zydka-copy-source">%s</code></p>', esc_html( $shortcode ) );
			printf(
				'<button type="button" class="button zydka-copy-button" data-zydka-copy="%1$s">%2$s</button>',
				esc_attr( $shortcode ),
				esc_html__( 'Copier le shortcode', 'zydka-player-manager' )
			);
			echo '<p class="description">' . esc_html__( 'Ce shortcode peut etre colle dans une page WordPress pour afficher cette playlist.', 'zydka-player-manager' ) . '</p>';
		}

		printf(
			'<p><strong>%1$s</strong> %2$d</p>',
			esc_html__( 'Tracks incluses :', 'zydka-player-manager' ),
			count( $track_ids )
		);

		if ( $track_ids ) {
			echo '<ul class="zydka-included-track-list">';
			foreach ( $track_ids as $track_id ) {
				printf( '<li>%s</li>', esc_html( get_the_title( $track_id ) ) );
			}
			echo '</ul>';
		}
	}

	/**
	 * Save track metadata.
	 *
	 * @param int     $post_id Post ID.
	 * @param WP_Post $post Post object.
	 */
	public static function save_track( int $post_id, WP_Post $post ): void {
		if ( ! self::can_save( $post_id, $post, self::TRACK_NONCE_NAME, self::TRACK_NONCE_ACTION ) ) {
			return;
		}

		$text_fields = [
			'_zydka_track_artist',
			'_zydka_track_album',
			'_zydka_track_key',
			'_zydka_track_mood',
			'_zydka_track_style',
		];

		foreach ( $text_fields as $meta_key ) {
			self::update_meta( $post_id, $meta_key, sanitize_text_field( wp_unslash( $_POST[ $meta_key ] ?? '' ) ) );
		}

		$type = sanitize_key( wp_unslash( $_POST['_zydka_track_type'] ?? '' ) );
		if ( ! array_key_exists( $type, Zydka_Player_Manager_Post_Types::get_track_types() ) ) {
			$type = 'morceau';
		}

		$commercial_status = sanitize_key( wp_unslash( $_POST['_zydka_track_commercial_status'] ?? '' ) );
		if ( ! array_key_exists( $commercial_status, Zydka_Player_Manager_Post_Types::get_commercial_statuses() ) ) {
			$commercial_status = 'listen_only';
		}

		self::update_meta( $post_id, '_zydka_track_type', $type );
		self::update_meta( $post_id, '_zydka_track_commercial_status', $commercial_status );
		self::update_meta( $post_id, '_zydka_track_bpm', absint( wp_unslash( $_POST['_zydka_track_bpm'] ?? 0 ) ) );
		self::update_meta( $post_id, '_zydka_track_product_id', absint( wp_unslash( $_POST['_zydka_track_product_id'] ?? 0 ) ) );
		self::update_meta( $post_id, '_zydka_track_audio_url', esc_url_raw( wp_unslash( $_POST['_zydka_track_audio_url'] ?? '' ) ) );
		self::update_meta( $post_id, '_zydka_track_cover_url', esc_url_raw( wp_unslash( $_POST['_zydka_track_cover_url'] ?? '' ) ) );
		self::update_meta( $post_id, '_zydka_track_download_url', esc_url_raw( wp_unslash( $_POST['_zydka_track_download_url'] ?? '' ) ) );
	}

	/**
	 * Save catalog metadata.
	 *
	 * @param int     $post_id Post ID.
	 * @param WP_Post $post Post object.
	 */
	public static function save_catalog( int $post_id, WP_Post $post ): void {
		if ( ! self::can_save( $post_id, $post, self::CATALOG_NONCE_NAME, self::CATALOG_NONCE_ACTION ) ) {
			return;
		}

		$raw_track_ids = $_POST['_zydka_catalog_track_ids'] ?? [];
		$track_ids     = is_array( $raw_track_ids ) ? array_map( 'absint', wp_unslash( $raw_track_ids ) ) : [];
		$track_ids     = array_values(
			array_filter(
				array_unique( $track_ids ),
				static function ( int $track_id ): bool {
					return $track_id > 0 && 'zydka_track' === get_post_type( $track_id );
				}
			)
		);

		update_post_meta( $post_id, '_zydka_catalog_track_ids', $track_ids );
		update_post_meta( $post_id, '_zydka_catalog_public_display', isset( $_POST['_zydka_catalog_public_display'] ) ? '1' : '0' );
	}

	/**
	 * Get clean catalog track IDs.
	 *
	 * @param int $post_id Catalog ID.
	 * @return array<int>
	 */
	public static function get_catalog_track_ids( int $post_id ): array {
		$ids = get_post_meta( $post_id, '_zydka_catalog_track_ids', true );

		if ( ! is_array( $ids ) ) {
			return [];
		}

		return array_values( array_filter( array_map( 'absint', $ids ) ) );
	}

	/**
	 * Check whether a track has a usable cover source.
	 */
	public static function track_has_cover( int $track_id ): bool {
		return '' !== (string) get_post_meta( $track_id, '_zydka_track_cover_url', true ) || has_post_thumbnail( $track_id );
	}

	/**
	 * Get cover URL from V0.2 meta, falling back to the featured image.
	 */
	public static function get_track_cover_url( int $track_id ): string {
		$cover_url = (string) get_post_meta( $track_id, '_zydka_track_cover_url', true );

		if ( '' !== $cover_url ) {
			return esc_url_raw( $cover_url );
		}

		return get_the_post_thumbnail_url( $track_id, 'full' ) ?: '';
	}

	/**
	 * Render text field.
	 */
	private static function render_text_input( int $post_id, string $meta_key, string $label ): void {
		printf(
			'<p><label for="%1$s">%2$s</label><input id="%1$s" class="widefat" type="text" name="%1$s" value="%3$s"></p>',
			esc_attr( $meta_key ),
			esc_html( $label ),
			esc_attr( get_post_meta( $post_id, $meta_key, true ) )
		);
	}

	/**
	 * Render number field.
	 */
	private static function render_number_input( int $post_id, string $meta_key, string $label ): void {
		printf(
			'<p><label for="%1$s">%2$s</label><input id="%1$s" class="widefat" type="number" min="0" step="1" name="%1$s" value="%3$d"></p>',
			esc_attr( $meta_key ),
			esc_html( $label ),
			absint( get_post_meta( $post_id, $meta_key, true ) )
		);
	}

	/**
	 * Render URL field.
	 */
	private static function render_url_input( int $post_id, string $meta_key, string $label ): void {
		printf(
			'<p><label for="%1$s">%2$s</label><input id="%1$s" class="widefat" type="url" name="%1$s" value="%3$s"></p>',
			esc_attr( $meta_key ),
			esc_html( $label ),
			esc_url( get_post_meta( $post_id, $meta_key, true ) )
		);
	}

	/**
	 * Render select field.
	 *
	 * @param array<string,string> $options Select options.
	 */
	private static function render_select( int $post_id, string $meta_key, string $label, array $options ): void {
		$current = (string) get_post_meta( $post_id, $meta_key, true );

		echo '<p>';
		printf( '<label for="%1$s">%2$s</label>', esc_attr( $meta_key ), esc_html( $label ) );
		printf( '<select id="%1$s" name="%1$s" class="widefat">', esc_attr( $meta_key ) );

		foreach ( $options as $value => $option_label ) {
			printf(
				'<option value="%1$s" %2$s>%3$s</option>',
				esc_attr( $value ),
				selected( $current, $value, false ),
				esc_html( $option_label )
			);
		}

		echo '</select></p>';
	}

	/**
	 * Shared save guard.
	 */
	private static function can_save( int $post_id, WP_Post $post, string $nonce_name, string $nonce_action ): bool {
		if ( wp_is_post_autosave( $post_id ) || wp_is_post_revision( $post_id ) ) {
			return false;
		}

		if ( ! isset( $_POST[ $nonce_name ] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST[ $nonce_name ] ) ), $nonce_action ) ) {
			return false;
		}

		return current_user_can( 'edit_post', $post->ID );
	}

	/**
	 * Update or delete empty meta.
	 *
	 * @param mixed $value Clean value.
	 */
	private static function update_meta( int $post_id, string $meta_key, $value ): void {
		if ( '' === $value || 0 === $value ) {
			delete_post_meta( $post_id, $meta_key );
			return;
		}

		update_post_meta( $post_id, $meta_key, $value );
	}
}
