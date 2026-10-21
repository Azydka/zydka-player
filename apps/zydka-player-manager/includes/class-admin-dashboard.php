<?php
/**
 * Visual admin dashboard.
 *
 * @package ZydkaPlayerManager
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class Zydka_Player_Manager_Admin_Dashboard {
	/**
	 * Register hooks.
	 */
	public static function init(): void {
		add_action( 'admin_menu', [ __CLASS__, 'register_menu' ], 9 );
	}

	/**
	 * Register parent menu and dashboard submenu.
	 */
	public static function register_menu(): void {
		add_menu_page(
			__( 'Zydka Player', 'zydka-player-manager' ),
			__( 'Zydka Player', 'zydka-player-manager' ),
			'edit_posts',
			ZYDKA_PLAYER_MANAGER_MENU_SLUG,
			[ __CLASS__, 'render_dashboard' ],
			'dashicons-format-audio',
			56
		);

		add_submenu_page(
			ZYDKA_PLAYER_MANAGER_MENU_SLUG,
			__( 'Tableau de bord', 'zydka-player-manager' ),
			__( 'Tableau de bord', 'zydka-player-manager' ),
			'edit_posts',
			ZYDKA_PLAYER_MANAGER_MENU_SLUG,
			[ __CLASS__, 'render_dashboard' ]
		);
	}

	/**
	 * Render dashboard.
	 */
	public static function render_dashboard(): void {
		if ( ! current_user_can( 'edit_posts' ) ) {
			wp_die( esc_html__( 'Acces refuse.', 'zydka-player-manager' ) );
		}

		self::maybe_save_settings();

		$track_ids       = self::get_post_ids( 'zydka_track' );
		$catalog_ids     = self::get_post_ids( 'zydka_catalog' );
		$without_audio   = self::count_tracks_without_audio( $track_ids );
		$without_cover   = self::count_tracks_without_cover( $track_ids );
		$latest_track    = self::get_latest_post( 'zydka_track' );
		$latest_catalog  = self::get_latest_post( 'zydka_catalog' );
		$latest_shortcode = $latest_catalog ? sprintf( '[zydka_playlist id="%d"]', absint( $latest_catalog->ID ) ) : '';

		echo '<div class="wrap zydka-dashboard">';
		echo '<h1>' . esc_html__( 'Zydka Player - Tableau de bord', 'zydka-player-manager' ) . '</h1>';

		if ( isset( $_GET['zydka_settings_saved'] ) ) {
			echo '<div class="notice notice-success is-dismissible"><p>' . esc_html__( 'Reglages enregistres.', 'zydka-player-manager' ) . '</p></div>';
		}

		echo '<div class="zydka-dashboard-grid">';
		self::render_stat_card( __( 'Tracks', 'zydka-player-manager' ), count( $track_ids ) );
		self::render_stat_card( __( 'Playlists', 'zydka-player-manager' ), count( $catalog_ids ) );
		self::render_stat_card( __( 'Tracks sans audio', 'zydka-player-manager' ), $without_audio );
		self::render_stat_card( __( 'Tracks sans cover', 'zydka-player-manager' ), $without_cover );
		echo '</div>';

		echo '<div class="zydka-dashboard-panel zydka-dashboard-latest">';
		self::render_latest_row( __( 'Derniere track', 'zydka-player-manager' ), $latest_track );
		self::render_latest_row( __( 'Derniere playlist', 'zydka-player-manager' ), $latest_catalog );
		echo '<p><strong>' . esc_html__( 'Shortcode de la derniere playlist :', 'zydka-player-manager' ) . '</strong> ';
		if ( $latest_shortcode ) {
			printf( '<code>%s</code>', esc_html( $latest_shortcode ) );
			printf(
				' <button type="button" class="button button-small zydka-copy-button" data-zydka-copy="%1$s">%2$s</button>',
				esc_attr( $latest_shortcode ),
				esc_html__( 'Copier', 'zydka-player-manager' )
			);
		} else {
			echo '<span class="zydka-muted">' . esc_html__( 'Aucune playlist', 'zydka-player-manager' ) . '</span>';
		}
		echo '</p></div>';

		echo '<h2>' . esc_html__( 'Actions rapides', 'zydka-player-manager' ) . '</h2>';
		echo '<p class="zydka-quick-actions">';
		printf( '<a class="button button-primary" href="%1$s">%2$s</a>', esc_url( Zydka_Player_Manager_Admin_Library::get_url() ), esc_html__( 'Ouvrir la bibliotheque', 'zydka-player-manager' ) );
		printf( '<a class="button" href="%1$s">%2$s</a>', esc_url( Zydka_Player_Manager_Admin_Quick_Add::get_url( 'morceau' ) ), esc_html__( 'Ajouter rapidement un morceau', 'zydka-player-manager' ) );
		printf( '<a class="button" href="%1$s">%2$s</a>', esc_url( Zydka_Player_Manager_Admin_Quick_Add::get_url( 'beat' ) ), esc_html__( 'Ajouter rapidement un beat', 'zydka-player-manager' ) );
		printf( '<a class="button" href="%1$s">%2$s</a>', esc_url( Zydka_Player_Manager_Admin_Quick_Add::get_url( 'playlist' ) ), esc_html__( 'Creer une playlist guidee', 'zydka-player-manager' ) );
		printf( '<a class="button" href="%1$s">%2$s</a>', esc_url( menu_page_url( ZYDKA_PLAYER_MANAGER_MENU_SLUG . '-diagnostic', false ) ), esc_html__( 'Corriger les alertes', 'zydka-player-manager' ) );
		printf( '<a class="button" href="%1$s">%2$s</a>', esc_url( menu_page_url( ZYDKA_PLAYER_MANAGER_MENU_SLUG . '-shortcodes', false ) ), esc_html__( 'Voir les shortcodes', 'zydka-player-manager' ) );
		echo '</p>';

		self::render_settings();
		echo '</div>';
	}

	/**
	 * Persist dashboard settings.
	 */
	private static function maybe_save_settings(): void {
		if ( 'POST' !== $_SERVER['REQUEST_METHOD'] || ! isset( $_POST['zydka_manager_settings_nonce'] ) ) {
			return;
		}

		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( esc_html__( 'Acces refuse.', 'zydka-player-manager' ) );
		}

		check_admin_referer( 'zydka_player_manager_save_settings', 'zydka_manager_settings_nonce' );

		update_option(
			ZYDKA_PLAYER_MANAGER_DELETE_DATA_OPTION,
			isset( $_POST[ ZYDKA_PLAYER_MANAGER_DELETE_DATA_OPTION ] ) ? '1' : '0',
			false
		);

		wp_safe_redirect(
			add_query_arg(
				'zydka_settings_saved',
				'1',
				menu_page_url( ZYDKA_PLAYER_MANAGER_MENU_SLUG, false )
			)
		);
		exit;
	}

	/**
	 * Render uninstall option.
	 */
	private static function render_settings(): void {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}

		$delete_on_uninstall = (bool) get_option( ZYDKA_PLAYER_MANAGER_DELETE_DATA_OPTION, false );

		echo '<h2>' . esc_html__( 'Rollback et donnees', 'zydka-player-manager' ) . '</h2>';
		echo '<form method="post" class="zydka-settings-form">';
		wp_nonce_field( 'zydka_player_manager_save_settings', 'zydka_manager_settings_nonce' );
		printf(
			'<label><input type="checkbox" name="%1$s" value="1" %2$s> %3$s</label>',
			esc_attr( ZYDKA_PLAYER_MANAGER_DELETE_DATA_OPTION ),
			checked( $delete_on_uninstall, true, false ),
			esc_html__( 'Supprimer les tracks, playlists et options du plugin lors de la desinstallation.', 'zydka-player-manager' )
		);
		echo '<p class="description">' . esc_html__( 'Laisser decoche pour conserver les donnees lors d une desactivation, d un rollback ou d une reinstallation.', 'zydka-player-manager' ) . '</p>';
		submit_button( __( 'Enregistrer', 'zydka-player-manager' ) );
		echo '</form>';
	}

	/**
	 * Get post IDs by post type.
	 *
	 * @return array<int>
	 */
	private static function get_post_ids( string $post_type ): array {
		return get_posts(
			[
				'post_type'      => $post_type,
				'post_status'    => [ 'publish', 'draft', 'private' ],
				'posts_per_page' => -1,
				'fields'         => 'ids',
			]
		);
	}

	/**
	 * Count tracks without audio URL.
	 *
	 * @param array<int> $track_ids Track IDs.
	 */
	private static function count_tracks_without_audio( array $track_ids ): int {
		$count = 0;

		foreach ( $track_ids as $track_id ) {
			if ( '' === (string) get_post_meta( $track_id, '_zydka_track_audio_url', true ) ) {
				++$count;
			}
		}

		return $count;
	}

	/**
	 * Count tracks without cover URL or featured image.
	 *
	 * @param array<int> $track_ids Track IDs.
	 */
	private static function count_tracks_without_cover( array $track_ids ): int {
		$count = 0;

		foreach ( $track_ids as $track_id ) {
			if ( ! Zydka_Player_Manager_Meta_Boxes::track_has_cover( $track_id ) ) {
				++$count;
			}
		}

		return $count;
	}

	/**
	 * Get latest post for a CPT.
	 */
	private static function get_latest_post( string $post_type ): ?WP_Post {
		$posts = get_posts(
			[
				'post_type'      => $post_type,
				'post_status'    => [ 'publish', 'draft', 'private' ],
				'posts_per_page' => 1,
				'orderby'        => 'date',
				'order'          => 'DESC',
			]
		);

		return $posts[0] ?? null;
	}

	/**
	 * Render stat card.
	 */
	private static function render_stat_card( string $label, int $value ): void {
		printf(
			'<div class="zydka-stat-card"><span class="zydka-stat-value">%1$d</span><span class="zydka-stat-label">%2$s</span></div>',
			$value,
			esc_html( $label )
		);
	}

	/**
	 * Render latest content row.
	 */
	private static function render_latest_row( string $label, ?WP_Post $post ): void {
		echo '<p><strong>' . esc_html( $label ) . ' : </strong>';

		if ( $post ) {
			printf(
				'<a href="%1$s">%2$s</a>',
				esc_url( get_edit_post_link( $post->ID, '' ) ),
				esc_html( get_the_title( $post ) )
			);
		} else {
			echo '<span class="zydka-muted">' . esc_html__( 'Aucun contenu', 'zydka-player-manager' ) . '</span>';
		}

		echo '</p>';
	}
}
