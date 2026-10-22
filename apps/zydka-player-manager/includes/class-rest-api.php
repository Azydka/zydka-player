<?php
/**
 * REST API for Zydka Player Manager.
 *
 * @package ZydkaPlayerManager
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class Zydka_Player_Manager_REST_API {
	public const NAMESPACE = 'zydka-player-manager/v1';

	/**
	 * Register hooks.
	 */
	public static function init(): void {
		add_action( 'rest_api_init', [ __CLASS__, 'register_routes' ] );
	}

	/**
	 * Register REST routes.
	 */
	public static function register_routes(): void {
		register_rest_route(
			self::NAMESPACE,
			'/playlist/(?P<id>\d+)',
			[
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => [ __CLASS__, 'get_playlist' ],
				'permission_callback' => '__return_true',
				'args'                => [
					'id' => [
						'type'              => 'integer',
						'required'          => true,
						'sanitize_callback' => 'absint',
					],
				],
			]
		);
	}

	/**
	 * REST callback.
	 *
	 * @param WP_REST_Request $request REST request.
	 * @return WP_REST_Response|WP_Error
	 */
	public static function get_playlist( WP_REST_Request $request ) {
		$playlist_id = absint( $request['id'] );
		$payload     = self::get_playlist_payload( $playlist_id );

		if ( is_wp_error( $payload ) ) {
			return $payload;
		}

		return rest_ensure_response( $payload );
	}

	/**
	 * Build a clean playlist payload.
	 *
	 * @param int  $playlist_id Playlist/catalog ID.
	 * @param bool $include_private_tracks Include non-published tracks for editors.
	 * @return array<string,mixed>|WP_Error
	 */
	public static function get_playlist_payload( int $playlist_id, bool $include_private_tracks = false ) {
		$post = get_post( $playlist_id );

		if ( ! $post || 'zydka_catalog' !== $post->post_type ) {
			return new WP_Error(
				'zydka_playlist_not_found',
				__( 'Playlist introuvable.', 'zydka-player-manager' ),
				[ 'status' => 404 ]
			);
		}

		if ( ! self::can_view_playlist( $playlist_id ) ) {
			return new WP_Error(
				'zydka_playlist_forbidden',
				__( 'Playlist non publique.', 'zydka-player-manager' ),
				[ 'status' => 403 ]
			);
		}

		$can_edit   = current_user_can( 'edit_post', $playlist_id );
		$track_ids  = Zydka_Player_Manager_Meta_Boxes::get_catalog_track_ids( $playlist_id );
		$tracks     = [];

		foreach ( $track_ids as $track_id ) {
			$track = get_post( $track_id );

			if ( ! $track || 'zydka_track' !== $track->post_type ) {
				continue;
			}

			if ( ! $include_private_tracks && ! $can_edit && 'publish' !== $track->post_status ) {
				continue;
			}

			$tracks[] = self::get_track_payload( $track_id );
		}

		$payload = [
			'id'     => $playlist_id,
			'title'  => get_the_title( $playlist_id ),
			'tracks' => $tracks,
		];

		return apply_filters( 'zydka_player_manager_playlist_payload', $payload, $playlist_id );
	}

	/**
	 * Build a clean track payload.
	 *
	 * @return array<string,mixed>
	 */
	public static function get_track_payload( int $track_id ): array {
		$product_id = absint( get_post_meta( $track_id, '_zydka_track_product_id', true ) );
		$buy_url    = self::get_product_buy_url( $product_id );

		$payload = [
			'id'               => $track_id,
			'title'            => get_the_title( $track_id ),
			'artist'           => (string) get_post_meta( $track_id, '_zydka_track_artist', true ),
			'album'            => (string) get_post_meta( $track_id, '_zydka_track_album', true ),
			'type'             => (string) get_post_meta( $track_id, '_zydka_track_type', true ),
			'bpm'              => absint( get_post_meta( $track_id, '_zydka_track_bpm', true ) ),
			'key'              => (string) get_post_meta( $track_id, '_zydka_track_key', true ),
			'mood'             => (string) get_post_meta( $track_id, '_zydka_track_mood', true ),
			'style'            => (string) get_post_meta( $track_id, '_zydka_track_style', true ),
			'audioUrl'         => esc_url_raw( (string) get_post_meta( $track_id, '_zydka_track_audio_url', true ) ),
			'downloadUrl'      => esc_url_raw( (string) get_post_meta( $track_id, '_zydka_track_download_url', true ) ),
			'cover'            => Zydka_Player_Manager_Meta_Boxes::get_track_cover_url( $track_id ),
			'productId'        => $product_id,
			'buyUrl'           => $buy_url,
			'buyLabel'         => '' !== $buy_url ? __( 'Voir les licences', 'zydka-player-manager' ) : '',
			'commercialStatus' => (string) get_post_meta( $track_id, '_zydka_track_commercial_status', true ),
		];

		return apply_filters( 'zydka_player_manager_track_payload', $payload, $track_id );
	}

	/**
	 * Return the permalink of a published WooCommerce product, or '' when no CTA should be shown.
	 *
	 * Catalog visibility is ignored on purpose: a hidden product keeps a valid direct link.
	 */
	public static function get_product_buy_url( int $product_id ): string {
		if ( $product_id <= 0 || ! function_exists( 'wc_get_product' ) || 'product' !== get_post_type( $product_id ) ) {
			return '';
		}

		$product = wc_get_product( $product_id );
		if ( ! $product || ! is_a( $product, 'WC_Product' ) || 'publish' !== $product->get_status() ) {
			return '';
		}

		return esc_url_raw( (string) $product->get_permalink(), [ 'http', 'https' ] );
	}

	/**
	 * Determine whether the current requester may view a playlist.
	 */
	public static function can_view_playlist( int $playlist_id ): bool {
		$post = get_post( $playlist_id );

		if ( ! $post || 'zydka_catalog' !== $post->post_type ) {
			return false;
		}

		if ( current_user_can( 'edit_post', $playlist_id ) ) {
			return true;
		}

		return 'publish' === $post->post_status && (bool) get_post_meta( $playlist_id, '_zydka_catalog_public_display', true );
	}
}
