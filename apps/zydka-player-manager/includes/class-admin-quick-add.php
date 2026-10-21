<?php
/**
 * Guided creation workflow for Zydka Player Manager.
 *
 * @package ZydkaPlayerManager
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class Zydka_Player_Manager_Admin_Quick_Add {
	private const MENU_SLUG = 'zydka-player-manager-quick-add';

	/**
	 * Register hooks.
	 */
	public static function init(): void {
		add_action( 'admin_menu', [ __CLASS__, 'register_menu' ], 10 );
	}

	/**
	 * Register submenu.
	 */
	public static function register_menu(): void {
		add_submenu_page(
			ZYDKA_PLAYER_MANAGER_MENU_SLUG,
			__( 'Ajouter rapidement', 'zydka-player-manager' ),
			__( 'Ajouter rapidement', 'zydka-player-manager' ),
			'edit_posts',
			self::MENU_SLUG,
			[ __CLASS__, 'render_page' ]
		);
	}

	/**
	 * Get quick add page URL with an optional section anchor.
	 */
	public static function get_url( string $section = '' ): string {
		$url = menu_page_url( self::MENU_SLUG, false );

		if ( '' !== $section ) {
			$url .= '#' . sanitize_key( $section );
		}

		return $url;
	}

	/**
	 * Render page.
	 */
	public static function render_page(): void {
		if ( ! current_user_can( 'edit_posts' ) ) {
			wp_die( esc_html__( 'Acces refuse.', 'zydka-player-manager' ) );
		}

		$result = self::maybe_handle_submission();

		echo '<div class="wrap zydka-quick-add-page">';
		echo '<h1>' . esc_html__( 'Zydka Player - Ajouter rapidement', 'zydka-player-manager' ) . '</h1>';

		if ( is_wp_error( $result ) ) {
			printf(
				'<div class="notice notice-error"><p>%s</p></div>',
				esc_html( $result->get_error_message() )
			);
		} elseif ( is_array( $result ) ) {
			self::render_confirmation( $result );
		}

		self::render_action_cards();
		self::render_song_form();
		self::render_beat_form();
		self::render_playlist_form();

		echo '</div>';
	}

	/**
	 * Handle quick form submission.
	 *
	 * @return array<string,mixed>|WP_Error|null
	 */
	private static function maybe_handle_submission() {
		if ( 'POST' !== $_SERVER['REQUEST_METHOD'] || empty( $_POST['zydka_quick_action'] ) ) {
			return null;
		}

		if ( ! current_user_can( 'edit_posts' ) ) {
			return new WP_Error( 'zydka_quick_forbidden', __( 'Vous n avez pas les droits necessaires.', 'zydka-player-manager' ) );
		}

		$action = sanitize_key( wp_unslash( $_POST['zydka_quick_action'] ) );

		if ( ! in_array( $action, [ 'create_song', 'create_beat', 'create_playlist' ], true ) ) {
			return new WP_Error( 'zydka_quick_invalid_action', __( 'Action invalide.', 'zydka-player-manager' ) );
		}

		check_admin_referer( 'zydka_quick_' . $action, 'zydka_quick_nonce' );

		if ( 'create_playlist' === $action ) {
			return self::handle_playlist_submission();
		}

		return self::handle_track_submission( 'create_beat' === $action ? 'beat' : 'morceau' );
	}

	/**
	 * Create a track from quick form data.
	 *
	 * @return array<string,mixed>|WP_Error
	 */
	private static function handle_track_submission( string $track_type ) {
		$title = sanitize_text_field( wp_unslash( $_POST['zydka_quick_title'] ?? '' ) );

		if ( '' === $title ) {
			return new WP_Error( 'zydka_quick_missing_title', __( 'Le titre est obligatoire.', 'zydka-player-manager' ) );
		}

		$post_id = wp_insert_post(
			[
				'post_type'   => 'zydka_track',
				'post_status' => 'publish',
				'post_title'  => $title,
			],
			true
		);

		if ( is_wp_error( $post_id ) ) {
			return $post_id;
		}

		$status = sanitize_key( wp_unslash( $_POST['zydka_quick_commercial_status'] ?? '' ) );
		if ( ! array_key_exists( $status, Zydka_Player_Manager_Post_Types::get_commercial_statuses() ) ) {
			$status = 'beat' === $track_type ? 'license_request' : 'listen_only';
		}

		$meta = [
			'_zydka_track_type'              => $track_type,
			'_zydka_track_artist'            => sanitize_text_field( wp_unslash( $_POST['zydka_quick_artist'] ?? '' ) ),
			'_zydka_track_album'             => sanitize_text_field( wp_unslash( $_POST['zydka_quick_album'] ?? '' ) ),
			'_zydka_track_audio_url'         => esc_url_raw( wp_unslash( $_POST['zydka_quick_audio_url'] ?? '' ) ),
			'_zydka_track_cover_url'         => esc_url_raw( wp_unslash( $_POST['zydka_quick_cover_url'] ?? '' ) ),
			'_zydka_track_bpm'               => absint( wp_unslash( $_POST['zydka_quick_bpm'] ?? 0 ) ),
			'_zydka_track_key'               => sanitize_text_field( wp_unslash( $_POST['zydka_quick_key'] ?? '' ) ),
			'_zydka_track_mood'              => sanitize_text_field( wp_unslash( $_POST['zydka_quick_mood'] ?? '' ) ),
			'_zydka_track_style'             => sanitize_text_field( wp_unslash( $_POST['zydka_quick_style'] ?? '' ) ),
			'_zydka_track_download_url'      => esc_url_raw( wp_unslash( $_POST['zydka_quick_download_url'] ?? '' ) ),
			'_zydka_track_product_id'        => absint( wp_unslash( $_POST['zydka_quick_product_id'] ?? 0 ) ),
			'_zydka_track_commercial_status' => $status,
		];

		foreach ( $meta as $meta_key => $value ) {
			self::update_meta( $post_id, $meta_key, $value );
		}

		$catalog_result = self::maybe_attach_track_to_catalog( $post_id );
		if ( is_wp_error( $catalog_result ) ) {
			return $catalog_result;
		}

		return [
			'type'       => 'track',
			'track_id'   => $post_id,
			'title'      => $title,
			'audio_ok'   => '' !== (string) $meta['_zydka_track_audio_url'],
			'cover_ok'   => '' !== (string) $meta['_zydka_track_cover_url'],
			'catalog'    => $catalog_result,
			'shortcode'  => $catalog_result ? self::get_shortcode( absint( $catalog_result['id'] ) ) : '',
			'edit_url'   => get_edit_post_link( $post_id, '' ),
		];
	}

	/**
	 * Create a playlist from quick form data.
	 *
	 * @return array<string,mixed>|WP_Error
	 */
	private static function handle_playlist_submission() {
		$title = sanitize_text_field( wp_unslash( $_POST['zydka_quick_playlist_title'] ?? '' ) );

		if ( '' === $title ) {
			return new WP_Error( 'zydka_quick_missing_playlist_title', __( 'Le nom de la playlist est obligatoire.', 'zydka-player-manager' ) );
		}

		$post_id = wp_insert_post(
			[
				'post_type'   => 'zydka_catalog',
				'post_status' => 'publish',
				'post_title'  => $title,
			],
			true
		);

		if ( is_wp_error( $post_id ) ) {
			return $post_id;
		}

		$track_ids = self::sanitize_track_ids( $_POST['zydka_quick_track_ids'] ?? [] );

		update_post_meta( $post_id, '_zydka_catalog_track_ids', $track_ids );
		update_post_meta( $post_id, '_zydka_catalog_public_display', '1' );

		return [
			'type'        => 'playlist',
			'catalog_id'  => $post_id,
			'title'       => $title,
			'track_count' => count( $track_ids ),
			'shortcode'   => self::get_shortcode( $post_id ),
			'edit_url'    => get_edit_post_link( $post_id, '' ),
		];
	}

	/**
	 * Add a track to an existing or newly created catalog.
	 *
	 * @return array<string,mixed>|WP_Error|null
	 */
	private static function maybe_attach_track_to_catalog( int $track_id ) {
		$new_catalog_title  = sanitize_text_field( wp_unslash( $_POST['zydka_quick_new_catalog_title'] ?? '' ) );
		$existing_catalog_id = absint( wp_unslash( $_POST['zydka_quick_existing_catalog_id'] ?? 0 ) );
		$catalog_id         = 0;

		if ( '' !== $new_catalog_title ) {
			$created_id = wp_insert_post(
				[
					'post_type'   => 'zydka_catalog',
					'post_status' => 'publish',
					'post_title'  => $new_catalog_title,
				],
				true
			);

			if ( is_wp_error( $created_id ) ) {
				return $created_id;
			}

			$catalog_id = absint( $created_id );
			update_post_meta( $catalog_id, '_zydka_catalog_public_display', '1' );
		} elseif ( $existing_catalog_id > 0 && 'zydka_catalog' === get_post_type( $existing_catalog_id ) ) {
			$catalog_id = $existing_catalog_id;
		}

		if ( 0 === $catalog_id ) {
			return null;
		}

		$track_ids   = Zydka_Player_Manager_Meta_Boxes::get_catalog_track_ids( $catalog_id );
		$track_ids[] = $track_id;
		$track_ids   = array_values( array_unique( array_filter( array_map( 'absint', $track_ids ) ) ) );

		update_post_meta( $catalog_id, '_zydka_catalog_track_ids', $track_ids );

		return [
			'id'    => $catalog_id,
			'title' => get_the_title( $catalog_id ),
		];
	}

	/**
	 * Render main action cards.
	 */
	private static function render_action_cards(): void {
		echo '<div class="zydka-quick-cards">';
		self::render_action_card( 'morceau', __( '+ Ajouter un morceau', 'zydka-player-manager' ) );
		self::render_action_card( 'beat', __( '+ Ajouter un beat', 'zydka-player-manager' ) );
		self::render_action_card( 'playlist', __( '+ Creer une playlist', 'zydka-player-manager' ) );
		echo '</div>';
	}

	/**
	 * Render one action card.
	 */
	private static function render_action_card( string $anchor, string $label ): void {
		printf(
			'<a class="zydka-quick-card" href="#%1$s"><span>%2$s</span></a>',
			esc_attr( $anchor ),
			esc_html( $label )
		);
	}

	/**
	 * Render song form.
	 */
	private static function render_song_form(): void {
		echo '<section id="morceau" class="zydka-quick-form-panel">';
		echo '<h2>' . esc_html__( 'Ajouter un morceau', 'zydka-player-manager' ) . '</h2>';
		echo '<form method="post">';
		wp_nonce_field( 'zydka_quick_create_song', 'zydka_quick_nonce' );
		echo '<input type="hidden" name="zydka_quick_action" value="create_song">';
		echo '<input type="hidden" name="zydka_quick_commercial_status" value="listen_only">';
		echo '<div class="zydka-manager-grid">';
		self::render_text_field( 'zydka_quick_title', __( 'Titre', 'zydka-player-manager' ), true );
		self::render_text_field( 'zydka_quick_artist', __( 'Artiste', 'zydka-player-manager' ) );
		self::render_text_field( 'zydka_quick_album', __( 'Album / Projet', 'zydka-player-manager' ) );
		self::render_url_field( 'zydka_quick_audio_url', __( 'Audio preview URL', 'zydka-player-manager' ) );
		self::render_url_field( 'zydka_quick_cover_url', __( 'Cover URL', 'zydka-player-manager' ) );
		self::render_readonly_field( __( 'Type', 'zydka-player-manager' ), __( 'Morceau', 'zydka-player-manager' ) );
		self::render_readonly_field( __( 'Statut commercial', 'zydka-player-manager' ), __( 'Ecoute seule', 'zydka-player-manager' ) );
		echo '</div>';
		self::render_catalog_target_fields();
		submit_button( __( 'Creer le morceau', 'zydka-player-manager' ), 'primary', 'submit', false );
		echo '</form></section>';
	}

	/**
	 * Render beat form.
	 */
	private static function render_beat_form(): void {
		echo '<section id="beat" class="zydka-quick-form-panel">';
		echo '<h2>' . esc_html__( 'Ajouter un beat', 'zydka-player-manager' ) . '</h2>';
		echo '<form method="post">';
		wp_nonce_field( 'zydka_quick_create_beat', 'zydka_quick_nonce' );
		echo '<input type="hidden" name="zydka_quick_action" value="create_beat">';
		echo '<div class="zydka-manager-grid">';
		self::render_text_field( 'zydka_quick_title', __( 'Titre du beat', 'zydka-player-manager' ), true );
		self::render_url_field( 'zydka_quick_audio_url', __( 'Audio preview URL', 'zydka-player-manager' ) );
		self::render_url_field( 'zydka_quick_cover_url', __( 'Cover URL', 'zydka-player-manager' ) );
		self::render_number_field( 'zydka_quick_bpm', __( 'BPM', 'zydka-player-manager' ) );
		self::render_text_field( 'zydka_quick_key', __( 'Tonalite', 'zydka-player-manager' ) );
		self::render_text_field( 'zydka_quick_mood', __( 'Mood', 'zydka-player-manager' ) );
		self::render_text_field( 'zydka_quick_style', __( 'Style', 'zydka-player-manager' ) );
		self::render_url_field( 'zydka_quick_download_url', __( 'Download URL optionnel', 'zydka-player-manager' ) );
		self::render_number_field( 'zydka_quick_product_id', __( 'Produit WooCommerce associe ID optionnel', 'zydka-player-manager' ) );
		self::render_status_select( 'license_request' );
		echo '</div>';
		self::render_catalog_target_fields();
		submit_button( __( 'Creer le beat', 'zydka-player-manager' ), 'primary', 'submit', false );
		echo '</form></section>';
	}

	/**
	 * Render playlist form.
	 */
	private static function render_playlist_form(): void {
		$tracks = self::get_track_ids();

		echo '<section id="playlist" class="zydka-quick-form-panel">';
		echo '<h2>' . esc_html__( 'Creer une playlist', 'zydka-player-manager' ) . '</h2>';
		echo '<form method="post">';
		wp_nonce_field( 'zydka_quick_create_playlist', 'zydka_quick_nonce' );
		echo '<input type="hidden" name="zydka_quick_action" value="create_playlist">';
		self::render_text_field( 'zydka_quick_playlist_title', __( 'Nom de la playlist', 'zydka-player-manager' ), true );

		if ( $tracks ) {
			echo '<div class="zydka-catalog-checklist zydka-quick-track-checklist">';
			foreach ( $tracks as $track_id ) {
				printf(
					'<label class="zydka-catalog-track-option"><input type="checkbox" name="zydka_quick_track_ids[]" value="%1$d"> <span>%2$s</span></label>',
					absint( $track_id ),
					esc_html( self::get_track_summary( $track_id ) )
				);
			}
			echo '</div>';
		} else {
			echo '<p class="zydka-muted">' . esc_html__( 'Aucune track disponible pour le moment.', 'zydka-player-manager' ) . '</p>';
		}

		submit_button( __( 'Creer la playlist', 'zydka-player-manager' ), 'primary', 'submit', false );
		echo '</form></section>';
	}

	/**
	 * Render confirmation box.
	 *
	 * @param array<string,mixed> $result Result data.
	 */
	private static function render_confirmation( array $result ): void {
		echo '<div id="zydka-quick-result" class="notice notice-success zydka-quick-result">';

		if ( 'track' === $result['type'] ) {
			echo '<p><strong>' . esc_html__( 'Track creee avec succes.', 'zydka-player-manager' ) . '</strong></p>';
			printf( '<p>%1$s %2$s</p>', esc_html__( 'Audio :', 'zydka-player-manager' ), esc_html( $result['audio_ok'] ? __( 'OK', 'zydka-player-manager' ) : __( 'absent', 'zydka-player-manager' ) ) );
			printf( '<p>%1$s %2$s</p>', esc_html__( 'Cover :', 'zydka-player-manager' ), esc_html( $result['cover_ok'] ? __( 'OK', 'zydka-player-manager' ) : __( 'absent', 'zydka-player-manager' ) ) );
			printf( '<p>%1$s %2$s</p>', esc_html__( 'Ajoutee a la playlist :', 'zydka-player-manager' ), esc_html( $result['catalog'] ? __( 'Oui', 'zydka-player-manager' ) : __( 'Non', 'zydka-player-manager' ) ) );

			if ( $result['catalog'] ) {
				printf( '<p>%1$s %2$s</p>', esc_html__( 'Playlist :', 'zydka-player-manager' ), esc_html( $result['catalog']['title'] ) );
				self::render_shortcode_line( (string) $result['shortcode'] );
			}

			echo '<p class="zydka-confirm-actions">';
			if ( $result['catalog'] ) {
				printf( '<a class="button" href="#zydka-quick-preview">%s</a> ', esc_html__( 'Previsualiser la playlist', 'zydka-player-manager' ) );
			}
			printf( '<a class="button" href="%1$s">%2$s</a> ', esc_url( (string) $result['edit_url'] ), esc_html__( 'Modifier la track', 'zydka-player-manager' ) );
			if ( $result['shortcode'] ) {
				self::render_copy_button( (string) $result['shortcode'], __( 'Copier le shortcode', 'zydka-player-manager' ) );
			}
			echo '</p>';

			if ( $result['catalog'] ) {
				self::render_playlist_preview( absint( $result['catalog']['id'] ) );
			}
		} else {
			echo '<p><strong>' . esc_html__( 'Playlist creee avec succes.', 'zydka-player-manager' ) . '</strong></p>';
			printf( '<p>%1$s %2$d</p>', esc_html__( 'Tracks ajoutees :', 'zydka-player-manager' ), absint( $result['track_count'] ) );
			self::render_shortcode_line( (string) $result['shortcode'] );
			echo '<p class="zydka-confirm-actions">';
			self::render_copy_button( (string) $result['shortcode'], __( 'Copier le shortcode', 'zydka-player-manager' ) );
			printf( ' <a class="button" href="#zydka-quick-preview">%s</a> ', esc_html__( 'Previsualiser', 'zydka-player-manager' ) );
			printf( '<a class="button" href="%1$s">%2$s</a>', esc_url( (string) $result['edit_url'] ), esc_html__( 'Modifier la playlist', 'zydka-player-manager' ) );
			echo '</p>';
			self::render_playlist_preview( absint( $result['catalog_id'] ) );
		}

		echo '</div>';
	}

	/**
	 * Render shortcode line.
	 */
	private static function render_shortcode_line( string $shortcode ): void {
		printf(
			'<p>%1$s <code>%2$s</code></p>',
			esc_html__( 'Shortcode :', 'zydka-player-manager' ),
			esc_html( $shortcode )
		);
	}

	/**
	 * Render playlist preview.
	 */
	private static function render_playlist_preview( int $catalog_id ): void {
		echo '<div id="zydka-quick-preview" class="zydka-quick-preview">';
		echo '<h3>' . esc_html__( 'Previsualisation', 'zydka-player-manager' ) . '</h3>';
		echo do_shortcode( self::get_shortcode( $catalog_id ) ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo '</div>';
	}

	/**
	 * Render copy button.
	 */
	private static function render_copy_button( string $value, string $label ): void {
		printf(
			'<button type="button" class="button zydka-copy-button" data-zydka-copy="%1$s">%2$s</button>',
			esc_attr( $value ),
			esc_html( $label )
		);
	}

	/**
	 * Render existing/new catalog controls.
	 */
	private static function render_catalog_target_fields(): void {
		$catalogs = self::get_catalogs();

		echo '<div class="zydka-quick-catalog-target">';
		echo '<h3>' . esc_html__( 'Ajouter a une playlist', 'zydka-player-manager' ) . '</h3>';
		echo '<p><label for="zydka-quick-existing-catalog">' . esc_html__( 'Ajouter a une playlist existante', 'zydka-player-manager' ) . '</label>';
		echo '<select id="zydka-quick-existing-catalog" name="zydka_quick_existing_catalog_id" class="widefat">';
		echo '<option value="0">' . esc_html__( 'Ne pas ajouter maintenant', 'zydka-player-manager' ) . '</option>';

		foreach ( $catalogs as $catalog ) {
			printf(
				'<option value="%1$d">%2$s</option>',
				absint( $catalog->ID ),
				esc_html( sprintf( '#%d - %s', $catalog->ID, get_the_title( $catalog ) ) )
			);
		}

		echo '</select></p>';
		self::render_text_field( 'zydka_quick_new_catalog_title', __( 'Ou creer une nouvelle playlist', 'zydka-player-manager' ) );
		echo '</div>';
	}

	/**
	 * Render text field.
	 */
	private static function render_text_field( string $name, string $label, bool $required = false ): void {
		printf(
			'<p><label for="%1$s">%2$s</label><input id="%1$s" class="widefat" type="text" name="%1$s" value="" %3$s></p>',
			esc_attr( $name ),
			esc_html( $label ),
			$required ? 'required' : ''
		);
	}

	/**
	 * Render URL field.
	 */
	private static function render_url_field( string $name, string $label ): void {
		printf(
			'<p><label for="%1$s">%2$s</label><input id="%1$s" class="widefat" type="url" name="%1$s" value=""></p>',
			esc_attr( $name ),
			esc_html( $label )
		);
	}

	/**
	 * Render number field.
	 */
	private static function render_number_field( string $name, string $label ): void {
		printf(
			'<p><label for="%1$s">%2$s</label><input id="%1$s" class="widefat" type="number" min="0" step="1" name="%1$s" value=""></p>',
			esc_attr( $name ),
			esc_html( $label )
		);
	}

	/**
	 * Render readonly display field.
	 */
	private static function render_readonly_field( string $label, string $value ): void {
		printf(
			'<p><label>%1$s</label><input class="widefat" type="text" value="%2$s" readonly></p>',
			esc_html( $label ),
			esc_attr( $value )
		);
	}

	/**
	 * Render commercial status select.
	 */
	private static function render_status_select( string $default ): void {
		echo '<p><label for="zydka-quick-commercial-status">' . esc_html__( 'Statut commercial', 'zydka-player-manager' ) . '</label>';
		echo '<select id="zydka-quick-commercial-status" name="zydka_quick_commercial_status" class="widefat">';

		foreach ( Zydka_Player_Manager_Post_Types::get_commercial_statuses() as $value => $label ) {
			printf(
				'<option value="%1$s" %2$s>%3$s</option>',
				esc_attr( $value ),
				selected( $default, $value, false ),
				esc_html( $label )
			);
		}

		echo '</select></p>';
	}

	/**
	 * Get catalog posts.
	 *
	 * @return array<WP_Post>
	 */
	private static function get_catalogs(): array {
		return get_posts(
			[
				'post_type'      => 'zydka_catalog',
				'post_status'    => [ 'publish', 'draft', 'private' ],
				'posts_per_page' => -1,
				'orderby'        => 'title',
				'order'          => 'ASC',
			]
		);
	}

	/**
	 * Get track IDs.
	 *
	 * @return array<int>
	 */
	private static function get_track_ids(): array {
		return get_posts(
			[
				'post_type'      => 'zydka_track',
				'post_status'    => [ 'publish', 'draft', 'private' ],
				'posts_per_page' => -1,
				'orderby'        => 'title',
				'order'          => 'ASC',
				'fields'         => 'ids',
			]
		);
	}

	/**
	 * Build readable track summary.
	 */
	private static function get_track_summary( int $track_id ): string {
		$type      = (string) get_post_meta( $track_id, '_zydka_track_type', true );
		$bpm       = absint( get_post_meta( $track_id, '_zydka_track_bpm', true ) );
		$audio_url = (string) get_post_meta( $track_id, '_zydka_track_audio_url', true );

		return sprintf(
			'%1$s - %2$s - %3$s - %4$s - %5$s',
			get_the_title( $track_id ),
			Zydka_Player_Manager_Post_Types::get_track_type_label( $type ),
			$bpm ? sprintf( __( '%d BPM', 'zydka-player-manager' ), $bpm ) : __( 'BPM absent', 'zydka-player-manager' ),
			$audio_url ? __( 'Audio OK', 'zydka-player-manager' ) : __( 'Audio absent', 'zydka-player-manager' ),
			Zydka_Player_Manager_Meta_Boxes::track_has_cover( $track_id ) ? __( 'Cover OK', 'zydka-player-manager' ) : __( 'Cover absent', 'zydka-player-manager' )
		);
	}

	/**
	 * Sanitize posted track IDs.
	 *
	 * @param mixed $value Raw value.
	 * @return array<int>
	 */
	private static function sanitize_track_ids( $value ): array {
		if ( ! is_array( $value ) ) {
			return [];
		}

		$ids = array_map( 'absint', wp_unslash( $value ) );

		return array_values(
			array_filter(
				array_unique( $ids ),
				static function ( int $track_id ): bool {
					return $track_id > 0 && 'zydka_track' === get_post_type( $track_id );
				}
			)
		);
	}

	/**
	 * Build playlist shortcode.
	 */
	private static function get_shortcode( int $catalog_id ): string {
		return sprintf( '[zydka_playlist id="%d"]', absint( $catalog_id ) );
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
