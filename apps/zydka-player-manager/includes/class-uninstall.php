<?php
/**
 * Uninstall handling.
 *
 * @package ZydkaPlayerManager
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class Zydka_Player_Manager_Uninstall {
	/**
	 * Remove plugin data only when the explicit option is enabled.
	 */
	public static function run(): void {
		if ( ! (bool) get_option( 'zydka_player_manager_delete_data_on_uninstall', false ) ) {
			return;
		}

		self::delete_posts_by_type( 'zydka_track' );
		self::delete_posts_by_type( 'zydka_catalog' );

		delete_option( 'zydka_player_manager_delete_data_on_uninstall' );
	}

	/**
	 * Delete all posts of a CPT. Media attachments and WooCommerce data stay untouched.
	 */
	private static function delete_posts_by_type( string $post_type ): void {
		$post_ids = get_posts(
			[
				'post_type'      => $post_type,
				'post_status'    => 'any',
				'posts_per_page' => -1,
				'fields'         => 'ids',
			]
		);

		foreach ( $post_ids as $post_id ) {
			wp_delete_post( absint( $post_id ), true );
		}
	}
}
