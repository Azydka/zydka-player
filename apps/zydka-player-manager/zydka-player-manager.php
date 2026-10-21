<?php
/**
 * Plugin Name: Zydka Player Manager
 * Plugin URI:  https://louis94.com
 * Description: Catalogue audio, bibliotheque visuelle, playlists drag-and-drop et workflow admin guide pour Zydka Player.
 * Version:     0.5.0
 * Author:      Atelier Zydka
 * Author URI:  https://louis94.com
 * Text Domain: zydka-player-manager
 * License:     Proprietary
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'ZYDKA_PLAYER_MANAGER_VERSION', '0.5.0' );
define( 'ZYDKA_PLAYER_MANAGER_FILE', __FILE__ );
define( 'ZYDKA_PLAYER_MANAGER_PATH', plugin_dir_path( __FILE__ ) );
define( 'ZYDKA_PLAYER_MANAGER_URL', plugin_dir_url( __FILE__ ) );
define( 'ZYDKA_PLAYER_MANAGER_MENU_SLUG', 'zydka-player-manager' );
define( 'ZYDKA_PLAYER_MANAGER_DELETE_DATA_OPTION', 'zydka_player_manager_delete_data_on_uninstall' );

require_once ZYDKA_PLAYER_MANAGER_PATH . 'includes/class-post-types.php';
require_once ZYDKA_PLAYER_MANAGER_PATH . 'includes/class-meta-boxes.php';
require_once ZYDKA_PLAYER_MANAGER_PATH . 'includes/class-admin-dashboard.php';
require_once ZYDKA_PLAYER_MANAGER_PATH . 'includes/class-admin-library.php';
require_once ZYDKA_PLAYER_MANAGER_PATH . 'includes/class-admin-quick-add.php';
require_once ZYDKA_PLAYER_MANAGER_PATH . 'includes/class-admin-shortcodes.php';
require_once ZYDKA_PLAYER_MANAGER_PATH . 'includes/class-admin-diagnostic.php';
require_once ZYDKA_PLAYER_MANAGER_PATH . 'includes/class-admin-columns.php';
require_once ZYDKA_PLAYER_MANAGER_PATH . 'includes/class-rest-api.php';
require_once ZYDKA_PLAYER_MANAGER_PATH . 'includes/class-shortcodes.php';
require_once ZYDKA_PLAYER_MANAGER_PATH . 'includes/class-uninstall.php';

final class Zydka_Player_Manager {
	/**
	 * Boot plugin hooks.
	 */
	public static function init(): void {
		Zydka_Player_Manager_Post_Types::init();
		Zydka_Player_Manager_Meta_Boxes::init();
		Zydka_Player_Manager_Admin_Dashboard::init();
		Zydka_Player_Manager_Admin_Library::init();
		Zydka_Player_Manager_Admin_Quick_Add::init();
		Zydka_Player_Manager_Admin_Shortcodes::init();
		Zydka_Player_Manager_Admin_Diagnostic::init();
		Zydka_Player_Manager_Admin_Columns::init();
		Zydka_Player_Manager_REST_API::init();
		Zydka_Player_Manager_Shortcodes::init();

		add_action( 'admin_enqueue_scripts', [ __CLASS__, 'enqueue_admin_assets' ] );
	}

	/**
	 * Load admin assets only on Zydka Manager screens.
	 *
	 * @param string $hook Current admin hook.
	 */
	public static function enqueue_admin_assets( string $hook ): void {
		$screen = function_exists( 'get_current_screen' ) ? get_current_screen() : null;
		$is_zydka_screen = $screen && in_array( $screen->post_type, [ 'zydka_track', 'zydka_catalog' ], true );
		$is_dashboard    = false !== strpos( $hook, ZYDKA_PLAYER_MANAGER_MENU_SLUG );

		if ( ! $is_zydka_screen && ! $is_dashboard ) {
			return;
		}

		wp_enqueue_style(
			'zydka-player-manager-admin',
			ZYDKA_PLAYER_MANAGER_URL . 'assets/css/admin.css',
			[],
			ZYDKA_PLAYER_MANAGER_VERSION
		);

		wp_enqueue_script(
			'zydka-player-manager-admin',
			ZYDKA_PLAYER_MANAGER_URL . 'assets/js/admin.js',
			[],
			ZYDKA_PLAYER_MANAGER_VERSION,
			true
		);
	}

	/**
	 * Activation keeps data intact and refreshes rewrite rules.
	 */
	public static function activate(): void {
		Zydka_Player_Manager_Post_Types::register_post_types();

		if ( false === get_option( ZYDKA_PLAYER_MANAGER_DELETE_DATA_OPTION, false ) ) {
			add_option( ZYDKA_PLAYER_MANAGER_DELETE_DATA_OPTION, '0', '', false );
		}

		flush_rewrite_rules();
	}

	/**
	 * Deactivation does not remove catalogue data.
	 */
	public static function deactivate(): void {
		flush_rewrite_rules();
	}
}

Zydka_Player_Manager::init();

register_activation_hook( __FILE__, [ 'Zydka_Player_Manager', 'activate' ] );
register_deactivation_hook( __FILE__, [ 'Zydka_Player_Manager', 'deactivate' ] );
