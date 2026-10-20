<?php
/**
 * Visual music library and playlist manager.
 *
 * @package ZydkaPlayerManager
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class Zydka_Player_Manager_Admin_Library {
	private const MENU_SLUG    = 'zydka-player-manager-library';
	private const NONCE_ACTION = 'zydka_player_manager_library';

	/**
	 * Register hooks.
	 */
	public static function init(): void {
		add_action( 'admin_menu', [ __CLASS__, 'register_menu' ], 9 );
		add_action( 'admin_enqueue_scripts', [ __CLASS__, 'enqueue_assets' ], 20 );
		add_action( 'wp_ajax_zydka_library_add_track', [ __CLASS__, 'ajax_add_track' ] );
		add_action( 'wp_ajax_zydka_library_reorder_playlist', [ __CLASS__, 'ajax_reorder_playlist' ] );
		add_action( 'wp_ajax_zydka_library_remove_track', [ __CLASS__, 'ajax_remove_track' ] );
		add_action( 'wp_ajax_zydka_library_update_cover', [ __CLASS__, 'ajax_update_cover' ] );
		add_action( 'wp_ajax_zydka_library_update_audio', [ __CLASS__, 'ajax_update_audio' ] );
		add_action( 'wp_ajax_zydka_library_create_playlist', [ __CLASS__, 'ajax_create_playlist' ] );
	}

	/**
	 * Register library submenu.
	 */
	public static function register_menu(): void {
		add_submenu_page(
			ZYDKA_PLAYER_MANAGER_MENU_SLUG,
			__( 'Bibliotheque', 'zydka-player-manager' ),
			__( 'Bibliotheque', 'zydka-player-manager' ),
			'edit_posts',
			self::MENU_SLUG,
			[ __CLASS__, 'render_page' ]
		);
	}

	/**
	 * Get admin library URL.
	 */
	public static function get_url(): string {
		return menu_page_url( self::MENU_SLUG, false );
	}

	/**
	 * Enqueue media frame and localized admin data on the library page.
	 */
	public static function enqueue_assets( string $hook ): void {
		if ( false === strpos( $hook, self::MENU_SLUG ) ) {
			return;
		}

		wp_enqueue_media();
		wp_localize_script(
			'zydka-player-manager-admin',
			'zydkaPlayerManagerAdmin',
			[
				'ajaxUrl' => admin_url( 'admin-ajax.php' ),
				'nonce'   => wp_create_nonce( self::NONCE_ACTION ),
				'i18n'    => [
					'genericError'      => __( 'Action impossible. Merci de reessayer.', 'zydka-player-manager' ),
					'creatingPlaylist'  => __( 'Creation de la playlist...', 'zydka-player-manager' ),
					'coverFrameTitle'   => __( 'Choisir une cover', 'zydka-player-manager' ),
					'audioFrameTitle'   => __( 'Choisir un audio', 'zydka-player-manager' ),
					'useCover'          => __( 'Utiliser cette cover', 'zydka-player-manager' ),
					'useAudio'          => __( 'Utiliser cet audio', 'zydka-player-manager' ),
					'playlistNameEmpty' => __( 'Donne un nom a la playlist.', 'zydka-player-manager' ),
				],
			]
		);
	}

	/**
	 * Render library page.
	 */
	public static function render_page(): void {
		if ( ! current_user_can( 'edit_posts' ) ) {
			wp_die( esc_html__( 'Acces refuse.', 'zydka-player-manager' ) );
		}

		$track_ids    = self::get_track_ids();
		$playlist_ids = self::get_playlist_ids();
		$first_id     = $playlist_ids[0] ?? 0;

		echo '<div class="wrap zydka-library-page">';
		echo '<h1>' . esc_html__( 'Zydka Player - Bibliotheque', 'zydka-player-manager' ) . '</h1>';
		echo '<div id="zydka-library-message" class="zydka-library-message" aria-live="polite"></div>';

		self::render_create_playlist_panel();

		echo '<div class="zydka-library-layout">';
		echo '<section class="zydka-library-panel zydka-library-tracks-panel">';
		printf( '<h2>%s <span class="zydka-count">%d</span></h2>', esc_html__( 'Tracks disponibles', 'zydka-player-manager' ), count( $track_ids ) );

		if ( $track_ids ) {
			echo '<div class="zydka-track-card-grid">';
			foreach ( $track_ids as $track_id ) {
				self::render_track_card( $track_id );
			}
			echo '</div>';
		} else {
			echo '<p class="zydka-muted">' . esc_html__( 'Aucune track disponible pour le moment.', 'zydka-player-manager' ) . '</p>';
		}

		echo '</section>';

		echo '<section class="zydka-library-panel zydka-library-playlists-panel">';
		printf( '<h2>%s <span class="zydka-count" id="zydka-playlist-count">%d</span></h2>', esc_html__( 'Playlists', 'zydka-player-manager' ), count( $playlist_ids ) );
		echo '<div id="zydka-playlist-grid" class="zydka-playlist-grid">';

		foreach ( $playlist_ids as $playlist_id ) {
			self::render_playlist_card( $playlist_id );
		}

		echo '</div>';
		echo '</section>';

		echo '<aside class="zydka-library-panel zydka-library-preview-panel">';
		echo '<h2>' . esc_html__( 'Previsualisation', 'zydka-player-manager' ) . '</h2>';
		echo '<div id="zydka-library-preview">';
		if ( $first_id > 0 ) {
			self::render_preview_panel( $first_id );
		} else {
			echo '<p class="zydka-muted">' . esc_html__( 'Selectionne une playlist pour previsualiser le lecteur.', 'zydka-player-manager' ) . '</p>';
		}
		echo '</div>';
		echo '</aside>';
		echo '</div></div>';
	}

	/**
	 * Add a track to a playlist.
	 */
	public static function ajax_add_track(): void {
		self::verify_ajax();

		$playlist_id = self::get_request_id( 'playlist_id' );
		$track_id    = self::get_request_id( 'track_id' );
		self::assert_playlist( $playlist_id );
		self::assert_track( $track_id );

		$track_ids = Zydka_Player_Manager_Meta_Boxes::get_catalog_track_ids( $playlist_id );
		$already   = in_array( $track_id, $track_ids, true );

		if ( ! $already ) {
			$track_ids[] = $track_id;
			update_post_meta( $playlist_id, '_zydka_catalog_track_ids', array_values( array_unique( array_map( 'absint', $track_ids ) ) ) );
		}

		$message = $already
			? sprintf( __( 'Cette track est deja dans la playlist "%s".', 'zydka-player-manager' ), get_the_title( $playlist_id ) )
			: sprintf( __( 'Track ajoutee a la playlist "%s".', 'zydka-player-manager' ), get_the_title( $playlist_id ) );

		wp_send_json_success(
			[
				'message'      => $message,
				'playlistId'   => $playlist_id,
				'playlistHtml' => self::get_playlist_card_html( $playlist_id ),
				'previewHtml'  => self::get_preview_panel_html( $playlist_id ),
			]
		);
	}

	/**
	 * Persist a playlist order.
	 */
	public static function ajax_reorder_playlist(): void {
		self::verify_ajax();

		$playlist_id = self::get_request_id( 'playlist_id' );
		self::assert_playlist( $playlist_id );

		$current_ids = Zydka_Player_Manager_Meta_Boxes::get_catalog_track_ids( $playlist_id );
		$new_ids     = self::sanitize_track_ids( $_POST['track_ids'] ?? [] );

		sort( $current_ids );
		$sorted_new = $new_ids;
		sort( $sorted_new );

		if ( $current_ids !== $sorted_new ) {
			wp_send_json_error( [ 'message' => __( 'La liste envoyee est incomplete. Aucune track n a ete supprimee.', 'zydka-player-manager' ) ], 400 );
		}

		update_post_meta( $playlist_id, '_zydka_catalog_track_ids', $new_ids );

		wp_send_json_success(
			[
				'message'      => __( 'Ordre de la playlist mis a jour.', 'zydka-player-manager' ),
				'playlistId'   => $playlist_id,
				'playlistHtml' => self::get_playlist_card_html( $playlist_id ),
				'previewHtml'  => self::get_preview_panel_html( $playlist_id ),
			]
		);
	}

	/**
	 * Remove one track from a playlist.
	 */
	public static function ajax_remove_track(): void {
		self::verify_ajax();

		$playlist_id = self::get_request_id( 'playlist_id' );
		$track_id    = self::get_request_id( 'track_id' );
		self::assert_playlist( $playlist_id );
		self::assert_track( $track_id );

		$track_ids = array_values(
			array_filter(
				Zydka_Player_Manager_Meta_Boxes::get_catalog_track_ids( $playlist_id ),
				static function ( int $included_id ) use ( $track_id ): bool {
					return $included_id !== $track_id;
				}
			)
		);

		update_post_meta( $playlist_id, '_zydka_catalog_track_ids', $track_ids );

		wp_send_json_success(
			[
				'message'      => __( 'Track retiree de la playlist.', 'zydka-player-manager' ),
				'playlistId'   => $playlist_id,
				'playlistHtml' => self::get_playlist_card_html( $playlist_id ),
				'previewHtml'  => self::get_preview_panel_html( $playlist_id ),
			]
		);
	}

	/**
	 * Update track cover URL from a media attachment.
	 */
	public static function ajax_update_cover(): void {
		self::verify_ajax();

		$track_id      = self::get_request_id( 'track_id' );
		$attachment_id = self::get_request_id( 'attachment_id' );
		self::assert_track( $track_id );

		if ( ! $attachment_id || ! wp_attachment_is_image( $attachment_id ) ) {
			wp_send_json_error( [ 'message' => __( 'Merci de choisir une image dans la mediatheque.', 'zydka-player-manager' ) ], 400 );
		}

		$url = wp_get_attachment_url( $attachment_id );
		if ( ! $url ) {
			wp_send_json_error( [ 'message' => __( 'URL de cover introuvable.', 'zydka-player-manager' ) ], 400 );
		}

		update_post_meta( $track_id, '_zydka_track_cover_url', esc_url_raw( $url ) );

		wp_send_json_success(
			[
				'message'   => __( 'Cover mise a jour.', 'zydka-player-manager' ),
				'trackId'   => $track_id,
				'coverUrl'  => esc_url_raw( $url ),
				'trackHtml' => self::get_track_card_html( $track_id ),
			]
		);
	}

	/**
	 * Update track audio URL from a media attachment.
	 */
	public static function ajax_update_audio(): void {
		self::verify_ajax();

		$track_id      = self::get_request_id( 'track_id' );
		$attachment_id = self::get_request_id( 'attachment_id' );
		self::assert_track( $track_id );

		$mime          = $attachment_id ? get_post_mime_type( $attachment_id ) : '';
		$allowed_mimes = [ 'audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/mp4', 'audio/aac', 'audio/ogg' ];

		if ( ! $attachment_id || ! in_array( $mime, $allowed_mimes, true ) ) {
			wp_send_json_error( [ 'message' => __( 'Merci de choisir un fichier audio compatible.', 'zydka-player-manager' ) ], 400 );
		}

		$url = wp_get_attachment_url( $attachment_id );
		if ( ! $url ) {
			wp_send_json_error( [ 'message' => __( 'URL audio introuvable.', 'zydka-player-manager' ) ], 400 );
		}

		update_post_meta( $track_id, '_zydka_track_audio_url', esc_url_raw( $url ) );

		wp_send_json_success(
			[
				'message'   => __( 'Audio mis a jour.', 'zydka-player-manager' ),
				'trackId'   => $track_id,
				'audioUrl'  => esc_url_raw( $url ),
				'trackHtml' => self::get_track_card_html( $track_id ),
			]
		);
	}

	/**
	 * Create a new playlist from the library.
	 */
	public static function ajax_create_playlist(): void {
		self::verify_ajax();

		$title = sanitize_text_field( wp_unslash( $_POST['title'] ?? '' ) );
		if ( '' === $title ) {
			wp_send_json_error( [ 'message' => __( 'Le nom de la playlist est obligatoire.', 'zydka-player-manager' ) ], 400 );
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
			wp_send_json_error( [ 'message' => $post_id->get_error_message() ], 400 );
		}

		update_post_meta( $post_id, '_zydka_catalog_public_display', '1' );
		update_post_meta( $post_id, '_zydka_catalog_track_ids', [] );

		wp_send_json_success(
			[
				'message'      => sprintf( __( 'Playlist "%s" creee.', 'zydka-player-manager' ), get_the_title( $post_id ) ),
				'playlistId'   => absint( $post_id ),
				'playlistHtml' => self::get_playlist_card_html( absint( $post_id ) ),
				'previewHtml'  => self::get_preview_panel_html( absint( $post_id ) ),
			]
		);
	}

	/**
	 * Render new playlist panel.
	 */
	private static function render_create_playlist_panel(): void {
		echo '<div class="zydka-library-create">';
		echo '<form id="zydka-create-playlist-form">';
		printf( '<label for="zydka-new-playlist-title">%s</label>', esc_html__( 'Nouvelle playlist', 'zydka-player-manager' ) );
		printf( '<input id="zydka-new-playlist-title" type="text" name="title" class="regular-text" placeholder="%s">', esc_attr__( 'Nom de la playlist', 'zydka-player-manager' ) );
		printf( '<button type="submit" class="button button-primary">%s</button>', esc_html__( '+ Nouvelle playlist', 'zydka-player-manager' ) );
		echo '</form></div>';
	}

	/**
	 * Render one track card.
	 */
	private static function render_track_card( int $track_id ): void {
		$artist    = (string) get_post_meta( $track_id, '_zydka_track_artist', true );
		$type      = (string) get_post_meta( $track_id, '_zydka_track_type', true );
		$bpm       = absint( get_post_meta( $track_id, '_zydka_track_bpm', true ) );
		$mood      = (string) get_post_meta( $track_id, '_zydka_track_mood', true );
		$style     = (string) get_post_meta( $track_id, '_zydka_track_style', true );
		$audio_url = esc_url_raw( (string) get_post_meta( $track_id, '_zydka_track_audio_url', true ) );
		$cover_url = Zydka_Player_Manager_Meta_Boxes::get_track_cover_url( $track_id );
		$title     = get_the_title( $track_id );

		printf(
			'<article class="zydka-track-card" draggable="true" data-track-id="%1$d" data-track-title="%2$s">',
			absint( $track_id ),
			esc_attr( $title )
		);

		echo '<div class="zydka-track-cover">';
		if ( $cover_url ) {
			printf( '<img src="%1$s" alt="%2$s">', esc_url( $cover_url ), esc_attr( $title ) );
		} else {
			echo '<span>' . esc_html__( 'Cover absente', 'zydka-player-manager' ) . '</span>';
		}
		echo '</div>';

		printf( '<h3>%s</h3>', esc_html( $title ) );
		printf(
			'<p class="zydka-track-subtitle">%1$s%2$s</p>',
			esc_html( Zydka_Player_Manager_Post_Types::get_track_type_label( $type ) ),
			$artist ? ' - ' . esc_html( $artist ) : ''
		);

		$details = array_filter(
			[
				$bpm ? sprintf( __( '%d BPM', 'zydka-player-manager' ), $bpm ) : '',
				$style,
				$mood,
			]
		);
		printf( '<p class="zydka-track-meta">%s</p>', esc_html( implode( ' - ', $details ) ) );

		self::render_status_row( __( 'Audio', 'zydka-player-manager' ), '' !== $audio_url );
		self::render_status_row( __( 'Cover', 'zydka-player-manager' ), '' !== $cover_url );

		echo '<div class="zydka-track-actions">';
		printf( '<a class="button button-small" href="%1$s">%2$s</a>', esc_url( get_edit_post_link( $track_id, '' ) ), esc_html__( 'Modifier', 'zydka-player-manager' ) );
		printf(
			'<button type="button" class="button button-small zydka-media-button" data-media-kind="cover" data-track-id="%1$d">%2$s</button>',
			absint( $track_id ),
			esc_html( $cover_url ? __( 'Remplacer la cover', 'zydka-player-manager' ) : __( 'Ajouter une cover', 'zydka-player-manager' ) )
		);
		printf(
			'<button type="button" class="button button-small zydka-media-button" data-media-kind="audio" data-track-id="%1$d">%2$s</button>',
			absint( $track_id ),
			esc_html( $audio_url ? __( 'Remplacer audio', 'zydka-player-manager' ) : __( 'Ajouter audio', 'zydka-player-manager' ) )
		);
		echo '</div>';

		if ( $audio_url ) {
			printf( '<audio class="zydka-track-audio" controls preload="none" src="%s"></audio>', esc_url( $audio_url ) );
		}

		echo '</article>';
	}

	/**
	 * Render one playlist card.
	 */
	private static function render_playlist_card( int $playlist_id ): void {
		$title      = get_the_title( $playlist_id );
		$track_ids  = Zydka_Player_Manager_Meta_Boxes::get_catalog_track_ids( $playlist_id );
		$shortcode  = self::get_shortcode( $playlist_id );
		$is_public  = (bool) get_post_meta( $playlist_id, '_zydka_catalog_public_display', true );
		$edit_url   = get_edit_post_link( $playlist_id, '' );

		printf(
			'<article class="zydka-playlist-card" data-playlist-id="%1$d" data-playlist-title="%2$s" data-shortcode="%3$s">',
			absint( $playlist_id ),
			esc_attr( $title ),
			esc_attr( $shortcode )
		);
		echo '<header class="zydka-playlist-header">';
		printf( '<h3>%s</h3>', esc_html( $title ) );
		printf( '<span class="zydka-badge zydka-badge-%1$s">%2$s</span>', $is_public ? 'ok' : 'attention', esc_html( $is_public ? __( 'Publique', 'zydka-player-manager' ) : __( 'Privee', 'zydka-player-manager' ) ) );
		echo '</header>';
		printf( '<p class="zydka-playlist-count" data-count="%1$d">%1$d %2$s</p>', count( $track_ids ), esc_html__( 'tracks', 'zydka-player-manager' ) );
		echo '<div class="zydka-playlist-actions">';
		printf( '<button type="button" class="button button-primary zydka-preview-playlist">%s</button>', esc_html__( 'Previsualiser le lecteur', 'zydka-player-manager' ) );
		self::render_copy_button( $shortcode, __( 'Copier shortcode', 'zydka-player-manager' ) );
		if ( $edit_url ) {
			printf( '<a class="button" href="%1$s">%2$s</a>', esc_url( $edit_url ), esc_html__( 'Modifier', 'zydka-player-manager' ) );
		}
		echo '</div>';
		echo '<div class="zydka-playlist-dropzone">' . esc_html__( 'Deposer une track ici', 'zydka-player-manager' ) . '</div>';
		echo '<ul class="zydka-playlist-track-list" data-playlist-tracks>';

		foreach ( $track_ids as $track_id ) {
			self::render_playlist_track_item( $playlist_id, $track_id );
		}

		echo '</ul>';
		echo '<div class="zydka-integration-options">';
		echo '<strong>' . esc_html__( 'Options d integration', 'zydka-player-manager' ) . '</strong>';
		printf( '<p>%1$s <code>%2$s</code></p>', esc_html__( 'Shortcode :', 'zydka-player-manager' ), esc_html( $shortcode ) );
		echo '</div>';
		echo '</article>';
	}

	/**
	 * Render one included track.
	 */
	private static function render_playlist_track_item( int $playlist_id, int $track_id ): void {
		$track = get_post( $track_id );
		if ( ! $track || 'zydka_track' !== $track->post_type ) {
			return;
		}

		$audio_url = esc_url_raw( (string) get_post_meta( $track_id, '_zydka_track_audio_url', true ) );

		printf(
			'<li class="zydka-playlist-track" draggable="true" data-track-id="%1$d" data-track-title="%2$s" data-audio-url="%3$s">',
			absint( $track_id ),
			esc_attr( get_the_title( $track_id ) ),
			esc_attr( $audio_url )
		);
		echo '<span class="zydka-drag-handle" aria-hidden="true">::</span>';
		printf( '<span class="zydka-playlist-track-title">%s</span>', esc_html( get_the_title( $track_id ) ) );
		printf(
			'<button type="button" class="button-link-delete zydka-remove-track" data-playlist-id="%1$d" data-track-id="%2$d">%3$s</button>',
			absint( $playlist_id ),
			absint( $track_id ),
			esc_html__( 'Retirer', 'zydka-player-manager' )
		);
		echo '</li>';
	}

	/**
	 * Render preview panel.
	 */
	private static function render_preview_panel( int $playlist_id ): void {
		$title     = get_the_title( $playlist_id );
		$track_ids = Zydka_Player_Manager_Meta_Boxes::get_catalog_track_ids( $playlist_id );
		$shortcode = self::get_shortcode( $playlist_id );

		printf( '<div class="zydka-preview-content" data-preview-playlist-id="%d">', absint( $playlist_id ) );
		printf( '<h3>%s</h3>', esc_html( $title ) );
		printf( '<p class="zydka-muted">%d %s</p>', count( $track_ids ), esc_html__( 'tracks dans cette playlist', 'zydka-player-manager' ) );
		echo '<ol class="zydka-preview-track-list">';

		foreach ( $track_ids as $track_id ) {
			$audio_url = esc_url_raw( (string) get_post_meta( $track_id, '_zydka_track_audio_url', true ) );
			echo '<li>';
			printf( '<strong>%s</strong>', esc_html( get_the_title( $track_id ) ) );
			if ( $audio_url ) {
				printf( '<audio controls preload="none" src="%s"></audio>', esc_url( $audio_url ) );
			} else {
				echo '<span class="zydka-muted">' . esc_html__( 'Audio absent', 'zydka-player-manager' ) . '</span>';
			}
			echo '</li>';
		}

		echo '</ol>';
		echo '<div class="zydka-integration-options">';
		echo '<strong>' . esc_html__( 'Options d integration', 'zydka-player-manager' ) . '</strong>';
		printf( '<p>%1$s <code>%2$s</code></p>', esc_html__( 'Shortcode :', 'zydka-player-manager' ), esc_html( $shortcode ) );
		self::render_copy_button( $shortcode, __( 'Copier shortcode', 'zydka-player-manager' ) );
		printf( ' <a class="button" href="%1$s" target="_blank" rel="noopener noreferrer">%2$s</a>', esc_url( home_url( '/?p=' . absint( $playlist_id ) ) ), esc_html__( 'Previsualiser sur le site', 'zydka-player-manager' ) );
		echo '</div></div>';
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
	 * Render an OK/absent status row.
	 */
	private static function render_status_row( string $label, bool $ok ): void {
		printf(
			'<p class="zydka-status-row"><span>%1$s :</span> <span class="zydka-badge zydka-badge-%2$s">%3$s</span></p>',
			esc_html( $label ),
			$ok ? 'ok' : 'missing',
			esc_html( $ok ? __( 'OK', 'zydka-player-manager' ) : __( 'Absent', 'zydka-player-manager' ) )
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
	 * Get playlist IDs.
	 *
	 * @return array<int>
	 */
	private static function get_playlist_ids(): array {
		return get_posts(
			[
				'post_type'      => 'zydka_catalog',
				'post_status'    => [ 'publish', 'draft', 'private' ],
				'posts_per_page' => -1,
				'orderby'        => 'title',
				'order'          => 'ASC',
				'fields'         => 'ids',
			]
		);
	}

	/**
	 * Validate AJAX nonce and capability.
	 */
	private static function verify_ajax(): void {
		if ( ! check_ajax_referer( self::NONCE_ACTION, 'nonce', false ) ) {
			wp_send_json_error( [ 'message' => __( 'Session expiree. Recharge la page.', 'zydka-player-manager' ) ], 403 );
		}

		if ( ! current_user_can( 'edit_posts' ) ) {
			wp_send_json_error( [ 'message' => __( 'Acces refuse.', 'zydka-player-manager' ) ], 403 );
		}
	}

	/**
	 * Read one positive integer from request.
	 */
	private static function get_request_id( string $key ): int {
		return absint( wp_unslash( $_POST[ $key ] ?? 0 ) );
	}

	/**
	 * Assert playlist post exists and can be edited.
	 */
	private static function assert_playlist( int $playlist_id ): void {
		$post = get_post( $playlist_id );

		if ( ! $post || 'zydka_catalog' !== $post->post_type || ! current_user_can( 'edit_post', $playlist_id ) ) {
			wp_send_json_error( [ 'message' => __( 'Playlist introuvable ou non autorisee.', 'zydka-player-manager' ) ], 404 );
		}
	}

	/**
	 * Assert track post exists and can be edited.
	 */
	private static function assert_track( int $track_id ): void {
		$post = get_post( $track_id );

		if ( ! $post || 'zydka_track' !== $post->post_type || ! current_user_can( 'edit_post', $track_id ) ) {
			wp_send_json_error( [ 'message' => __( 'Track introuvable ou non autorisee.', 'zydka-player-manager' ) ], 404 );
		}
	}

	/**
	 * Sanitize a list of track IDs.
	 *
	 * @param mixed $value Raw request value.
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
	 * Build shortcode.
	 */
	private static function get_shortcode( int $playlist_id ): string {
		return sprintf( '[zydka_playlist id="%d"]', absint( $playlist_id ) );
	}

	/**
	 * Render a track card to a string.
	 */
	private static function get_track_card_html( int $track_id ): string {
		ob_start();
		self::render_track_card( $track_id );
		return (string) ob_get_clean();
	}

	/**
	 * Render a playlist card to a string.
	 */
	private static function get_playlist_card_html( int $playlist_id ): string {
		ob_start();
		self::render_playlist_card( $playlist_id );
		return (string) ob_get_clean();
	}

	/**
	 * Render preview panel to a string.
	 */
	private static function get_preview_panel_html( int $playlist_id ): string {
		ob_start();
		self::render_preview_panel( $playlist_id );
		return (string) ob_get_clean();
	}
}
