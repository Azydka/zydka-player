<?php
/**
 * Admin shortcode listing.
 *
 * @package ZydkaPlayerManager
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class Zydka_Player_Manager_Admin_Shortcodes {
	/**
	 * Register hooks.
	 */
	public static function init(): void {
		add_action( 'admin_menu', [ __CLASS__, 'register_menu' ], 20 );
	}

	/**
	 * Register submenu.
	 */
	public static function register_menu(): void {
		add_submenu_page(
			ZYDKA_PLAYER_MANAGER_MENU_SLUG,
			__( 'Shortcodes', 'zydka-player-manager' ),
			__( 'Shortcodes', 'zydka-player-manager' ),
			'edit_posts',
			ZYDKA_PLAYER_MANAGER_MENU_SLUG . '-shortcodes',
			[ __CLASS__, 'render_page' ]
		);
	}

	/**
	 * Render page.
	 */
	public static function render_page(): void {
		if ( ! current_user_can( 'edit_posts' ) ) {
			wp_die( esc_html__( 'Acces refuse.', 'zydka-player-manager' ) );
		}

		$catalogs = get_posts(
			[
				'post_type'      => 'zydka_catalog',
				'post_status'    => [ 'publish', 'draft', 'private' ],
				'posts_per_page' => -1,
				'orderby'        => 'title',
				'order'          => 'ASC',
			]
		);

		echo '<div class="wrap zydka-shortcodes-page">';
		echo '<h1>' . esc_html__( 'Zydka Player - Shortcodes', 'zydka-player-manager' ) . '</h1>';

		if ( ! $catalogs ) {
			echo '<p>' . esc_html__( 'Aucune playlist disponible.', 'zydka-player-manager' ) . '</p>';
			printf(
				'<p><a class="button button-primary" href="%1$s">%2$s</a></p>',
				esc_url( admin_url( 'post-new.php?post_type=zydka_catalog' ) ),
				esc_html__( 'Creer une playlist', 'zydka-player-manager' )
			);
			echo '</div>';
			return;
		}

		echo '<table class="widefat striped zydka-shortcode-table">';
		echo '<thead><tr>';
		echo '<th>' . esc_html__( 'Titre', 'zydka-player-manager' ) . '</th>';
		echo '<th>' . esc_html__( 'ID', 'zydka-player-manager' ) . '</th>';
		echo '<th>' . esc_html__( 'Shortcode', 'zydka-player-manager' ) . '</th>';
		echo '<th>' . esc_html__( 'Action', 'zydka-player-manager' ) . '</th>';
		echo '</tr></thead><tbody>';

		foreach ( $catalogs as $catalog ) {
			$shortcode = sprintf( '[zydka_playlist id="%d"]', absint( $catalog->ID ) );

			echo '<tr>';
			printf(
				'<td><a href="%1$s">%2$s</a></td>',
				esc_url( get_edit_post_link( $catalog->ID, '' ) ),
				esc_html( get_the_title( $catalog ) )
			);
			printf( '<td>%d</td>', absint( $catalog->ID ) );
			printf( '<td><code>%s</code></td>', esc_html( $shortcode ) );
			printf(
				'<td><button type="button" class="button zydka-copy-button" data-zydka-copy="%1$s">%2$s</button></td>',
				esc_attr( $shortcode ),
				esc_html__( 'Copier', 'zydka-player-manager' )
			);
			echo '</tr>';
		}

		echo '</tbody></table>';
		echo '</div>';
	}
}
