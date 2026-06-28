<?php
/**
 * Plugin Name: Zydka Player
 * Plugin URI:  https://atelierzydka.com
 * Description: Lecteur audio propriétaire Atelier Zydka pour WordPress.
 * Version:     0.1.0
 * Author:      Atelier Zydka
 * Author URI:  https://atelierzydka.com
 * Text Domain: zydka-player
 * License:     Proprietary
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

define( 'ZYDKA_PLAYER_VERSION', '0.1.0' );
define( 'ZYDKA_PLAYER_PATH', plugin_dir_path( __FILE__ ) );
define( 'ZYDKA_PLAYER_URL', plugin_dir_url( __FILE__ ) );

/**
 * Enqueue les assets du lecteur Zydka.
 * Le fichier JS sera généré par le build TypeScript (src/index.ts → assets/js/zydka-player.js).
 */
function zydka_player_enqueue_assets(): void {
    wp_enqueue_style(
        'zydka-player',
        ZYDKA_PLAYER_URL . 'assets/css/zydka-player.css',
        [],
        ZYDKA_PLAYER_VERSION
    );

    wp_enqueue_script(
        'zydka-player',
        ZYDKA_PLAYER_URL . 'assets/js/zydka-player.js',
        [],
        ZYDKA_PLAYER_VERSION,
        true
    );
}
add_action( 'wp_enqueue_scripts', 'zydka_player_enqueue_assets' );

/**
 * Shortcode [zydka_player].
 * Retourne le conteneur HTML dans lequel le lecteur JS sera monté.
 */
function zydka_player_shortcode(): string {
    return '<div id="zydka-player-root" class="zydka-player-root" data-source="shortcode"></div>';
}
add_shortcode( 'zydka_player', 'zydka_player_shortcode' );
