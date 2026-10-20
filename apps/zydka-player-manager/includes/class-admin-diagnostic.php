<?php
/**
 * Admin diagnostic page.
 *
 * @package ZydkaPlayerManager
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class Zydka_Player_Manager_Admin_Diagnostic {
	/**
	 * Register hooks.
	 */
	public static function init(): void {
		add_action( 'admin_menu', [ __CLASS__, 'register_menu' ], 21 );
	}

	/**
	 * Register submenu.
	 */
	public static function register_menu(): void {
		add_submenu_page(
			ZYDKA_PLAYER_MANAGER_MENU_SLUG,
			__( 'Diagnostic', 'zydka-player-manager' ),
			__( 'Diagnostic', 'zydka-player-manager' ),
			'edit_posts',
			ZYDKA_PLAYER_MANAGER_MENU_SLUG . '-diagnostic',
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

		$track_ids           = self::get_post_ids( 'zydka_track' );
		$catalog_ids         = self::get_post_ids( 'zydka_catalog' );
		$tracks_no_audio     = self::get_tracks_without_audio( $track_ids );
		$tracks_no_cover     = self::get_tracks_without_cover( $track_ids );
		$empty_catalogs      = self::get_empty_catalogs( $catalog_ids );
		$diagnostic_rows     = [
			[
				'label'   => __( 'Plugin actif', 'zydka-player-manager' ),
				'status'  => 'ok',
				'message' => __( 'Zydka Player Manager est charge.', 'zydka-player-manager' ),
			],
			[
				'label'   => __( 'CPT Track enregistre', 'zydka-player-manager' ),
				'status'  => post_type_exists( 'zydka_track' ) ? 'ok' : 'error',
				'message' => post_type_exists( 'zydka_track' ) ? __( 'zydka_track disponible.', 'zydka-player-manager' ) : __( 'zydka_track introuvable.', 'zydka-player-manager' ),
			],
			[
				'label'   => __( 'CPT Playlist enregistre', 'zydka-player-manager' ),
				'status'  => post_type_exists( 'zydka_catalog' ) ? 'ok' : 'error',
				'message' => post_type_exists( 'zydka_catalog' ) ? __( 'zydka_catalog disponible.', 'zydka-player-manager' ) : __( 'zydka_catalog introuvable.', 'zydka-player-manager' ),
			],
			[
				'label'   => __( 'Shortcode zydka_playlist enregistre', 'zydka-player-manager' ),
				'status'  => shortcode_exists( 'zydka_playlist' ) ? 'ok' : 'error',
				'message' => shortcode_exists( 'zydka_playlist' ) ? __( 'Shortcode disponible.', 'zydka-player-manager' ) : __( 'Shortcode introuvable.', 'zydka-player-manager' ),
			],
			[
				'label'   => __( 'Endpoint REST playlist enregistre', 'zydka-player-manager' ),
				'status'  => self::rest_route_exists() ? 'ok' : 'error',
				'message' => self::rest_route_exists() ? __( 'Route REST disponible.', 'zydka-player-manager' ) : __( 'Route REST introuvable.', 'zydka-player-manager' ),
			],
			[
				'label'   => __( 'Nombre de tracks', 'zydka-player-manager' ),
				'status'  => count( $track_ids ) > 0 ? 'ok' : 'attention',
				'message' => sprintf( __( '%d track(s).', 'zydka-player-manager' ), count( $track_ids ) ),
			],
			[
				'label'   => __( 'Nombre de playlists', 'zydka-player-manager' ),
				'status'  => count( $catalog_ids ) > 0 ? 'ok' : 'attention',
				'message' => sprintf( __( '%d playlist(s).', 'zydka-player-manager' ), count( $catalog_ids ) ),
			],
			[
				'label'   => __( 'Tracks sans audio', 'zydka-player-manager' ),
				'status'  => count( $tracks_no_audio ) > 0 ? 'attention' : 'ok',
				'message' => self::format_id_count_message( $tracks_no_audio, __( 'track(s) sans audio.', 'zydka-player-manager' ) ),
			],
			[
				'label'   => __( 'Tracks sans cover', 'zydka-player-manager' ),
				'status'  => count( $tracks_no_cover ) > 0 ? 'attention' : 'ok',
				'message' => self::format_id_count_message( $tracks_no_cover, __( 'track(s) sans cover.', 'zydka-player-manager' ) ),
			],
			[
				'label'   => __( 'Playlists vides', 'zydka-player-manager' ),
				'status'  => count( $empty_catalogs ) > 0 ? 'attention' : 'ok',
				'message' => self::format_id_count_message( $empty_catalogs, __( 'playlist(s) vide(s).', 'zydka-player-manager' ) ),
			],
		];

		echo '<div class="wrap zydka-diagnostic-page">';
		echo '<h1>' . esc_html__( 'Zydka Player - Diagnostic', 'zydka-player-manager' ) . '</h1>';
		echo '<table class="widefat striped zydka-diagnostic-table">';
		echo '<thead><tr>';
		echo '<th>' . esc_html__( 'Test', 'zydka-player-manager' ) . '</th>';
		echo '<th>' . esc_html__( 'Statut', 'zydka-player-manager' ) . '</th>';
		echo '<th>' . esc_html__( 'Detail', 'zydka-player-manager' ) . '</th>';
		echo '</tr></thead><tbody>';

		foreach ( $diagnostic_rows as $row ) {
			echo '<tr>';
			printf( '<td>%s</td>', esc_html( $row['label'] ) );
			printf( '<td>%s</td>', wp_kses_post( self::render_status_badge( $row['status'] ) ) );
			printf( '<td>%s</td>', esc_html( $row['message'] ) );
			echo '</tr>';
		}

		echo '</tbody></table>';
		self::render_action_items( $tracks_no_audio, $tracks_no_cover, $empty_catalogs );
		echo '</div>';
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
	 * Check REST route registration.
	 */
	private static function rest_route_exists(): bool {
		$routes = rest_get_server()->get_routes();

		return isset( $routes['/' . Zydka_Player_Manager_REST_API::NAMESPACE . '/playlist/(?P<id>\\d+)'] );
	}

	/**
	 * Get track IDs without audio.
	 *
	 * @param array<int> $track_ids Track IDs.
	 * @return array<int>
	 */
	private static function get_tracks_without_audio( array $track_ids ): array {
		return array_values(
			array_filter(
				$track_ids,
				static function ( int $track_id ): bool {
					return '' === (string) get_post_meta( $track_id, '_zydka_track_audio_url', true );
				}
			)
		);
	}

	/**
	 * Get track IDs without cover.
	 *
	 * @param array<int> $track_ids Track IDs.
	 * @return array<int>
	 */
	private static function get_tracks_without_cover( array $track_ids ): array {
		return array_values(
			array_filter(
				$track_ids,
				static function ( int $track_id ): bool {
					return ! Zydka_Player_Manager_Meta_Boxes::track_has_cover( $track_id );
				}
			)
		);
	}

	/**
	 * Get empty catalog IDs.
	 *
	 * @param array<int> $catalog_ids Catalog IDs.
	 * @return array<int>
	 */
	private static function get_empty_catalogs( array $catalog_ids ): array {
		return array_values(
			array_filter(
				$catalog_ids,
				static function ( int $catalog_id ): bool {
					return 0 === count( Zydka_Player_Manager_Meta_Boxes::get_catalog_track_ids( $catalog_id ) );
				}
			)
		);
	}

	/**
	 * Format count and IDs.
	 *
	 * @param array<int> $ids Post IDs.
	 */
	private static function format_id_count_message( array $ids, string $label ): string {
		if ( ! $ids ) {
			return sprintf( '0 %s', $label );
		}

		return sprintf(
			'%1$d %2$s IDs: %3$s',
			count( $ids ),
			$label,
			implode( ', ', array_map( 'absint', array_slice( $ids, 0, 20 ) ) )
		);
	}

	/**
	 * Render status badge.
	 */
	private static function render_status_badge( string $status ): string {
		$labels = [
			'ok'        => __( 'OK', 'zydka-player-manager' ),
			'attention' => __( 'Attention', 'zydka-player-manager' ),
			'error'     => __( 'Erreur', 'zydka-player-manager' ),
		];

		return sprintf(
			'<span class="zydka-badge zydka-badge-%1$s">%2$s</span>',
			esc_attr( $status ),
			esc_html( $labels[ $status ] ?? $status )
		);
	}

	/**
	 * Render direct action links for current alerts.
	 *
	 * @param array<int> $tracks_no_audio Track IDs.
	 * @param array<int> $tracks_no_cover Track IDs.
	 * @param array<int> $empty_catalogs Catalog IDs.
	 */
	private static function render_action_items( array $tracks_no_audio, array $tracks_no_cover, array $empty_catalogs ): void {
		if ( ! $tracks_no_audio && ! $tracks_no_cover && ! $empty_catalogs ) {
			echo '<div class="zydka-dashboard-panel zydka-diagnostic-actions">';
			echo '<h2>' . esc_html__( 'Actions recommandees', 'zydka-player-manager' ) . '</h2>';
			echo '<p>' . esc_html__( 'Aucune action corrective necessaire.', 'zydka-player-manager' ) . '</p>';
			echo '</div>';
			return;
		}

		echo '<div class="zydka-dashboard-panel zydka-diagnostic-actions">';
		echo '<h2>' . esc_html__( 'Actions recommandees', 'zydka-player-manager' ) . '</h2>';

		foreach ( $tracks_no_audio as $track_id ) {
			printf(
				'<div class="zydka-diagnostic-action"><strong>%1$s</strong> ID %2$d <a class="button button-small" href="%3$s">%4$s</a> <a class="button button-small" href="%3$s#zydka-track-details">%5$s</a></div>',
				esc_html__( 'Track sans audio :', 'zydka-player-manager' ),
				absint( $track_id ),
				esc_url( get_edit_post_link( $track_id, '' ) ),
				esc_html__( 'Modifier la track', 'zydka-player-manager' ),
				esc_html__( 'Ajouter un audio', 'zydka-player-manager' )
			);
		}

		foreach ( $tracks_no_cover as $track_id ) {
			printf(
				'<div class="zydka-diagnostic-action"><strong>%1$s</strong> ID %2$d <a class="button button-small" href="%3$s">%4$s</a> <a class="button button-small" href="%3$s#zydka-track-details">%5$s</a></div>',
				esc_html__( 'Track sans cover :', 'zydka-player-manager' ),
				absint( $track_id ),
				esc_url( get_edit_post_link( $track_id, '' ) ),
				esc_html__( 'Modifier la track', 'zydka-player-manager' ),
				esc_html__( 'Ajouter une cover', 'zydka-player-manager' )
			);
		}

		foreach ( $empty_catalogs as $catalog_id ) {
			printf(
				'<div class="zydka-diagnostic-action"><strong>%1$s</strong> ID %2$d <a class="button button-small" href="%3$s">%4$s</a> <a class="button button-small" href="%3$s#zydka-catalog-tracks">%5$s</a> <a class="button button-small" href="%6$s">%7$s</a></div>',
				esc_html__( 'Playlist vide :', 'zydka-player-manager' ),
				absint( $catalog_id ),
				esc_url( get_edit_post_link( $catalog_id, '' ) ),
				esc_html__( 'Modifier la playlist', 'zydka-player-manager' ),
				esc_html__( 'Remplir la playlist', 'zydka-player-manager' ),
				esc_url( menu_page_url( ZYDKA_PLAYER_MANAGER_MENU_SLUG . '-shortcodes', false ) ),
				esc_html__( 'Voir les shortcodes', 'zydka-player-manager' )
			);
		}

		echo '</div>';
	}
}
