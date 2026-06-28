<?php
/**
 * Plugin Name: Zydka Player
 * Plugin URI:  https://atelierzydka.com
 * Description: Lecteur audio propriétaire Atelier Zydka pour WordPress.
 * Version:     0.2.0
 * Author:      Atelier Zydka
 * Author URI:  https://atelierzydka.com
 * Text Domain: zydka-player
 * License:     Proprietary
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

define( 'ZYDKA_PLAYER_VERSION', '0.2.0' );
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
 * Génère le conteneur HTML du player et injecte les données track/playlist.
 */
function zydka_player_render_container( array $attrs = [], array $tracks = [] ): string {
    $data_attributes = sprintf(
        'data-source="%s" data-track-id="%s" data-title="%s" data-artist="%s" data-album="%s" data-src="%s" data-cover="%s" data-buy-url="%s" data-buy-label="%s"',
        esc_attr( $attrs['source'] ?? 'shortcode' ),
        esc_attr( $attrs['id'] ?? 'demo-track' ),
        esc_attr( $attrs['title'] ?? 'Demo Track' ),
        esc_attr( $attrs['artist'] ?? 'Atelier Zydka' ),
        esc_attr( $attrs['album'] ?? '' ),
        esc_url( $attrs['src'] ?? '' ),
        esc_url( $attrs['cover'] ?? '' ),
        esc_url( $attrs['buy_url'] ?? '' ),
        esc_attr( $attrs['buy_label'] ?? '' )
    );

    if ( ! empty( $tracks ) ) {
        $data_attributes .= sprintf(
            ' data-tracks="%s"',
            esc_attr( wp_json_encode( $tracks ) )
        );
    }

    return sprintf(
        '<div id="zydka-player-root" class="zydka-player-root" %s></div>',
        $data_attributes
    );
}

/**
 * Shortcode [zydka_player].
 * Retourne le conteneur HTML dans lequel le lecteur JS sera monté.
 */
function zydka_player_shortcode( $atts = [] ): string {
    $atts = shortcode_atts(
        [
            'id'     => 'demo-track',
            'title'  => 'Demo Track',
            'artist' => 'Atelier Zydka',
            'src'    => '',
            'album'  => '',
            'cover'  => '',
            'buy_url' => '',
            'buy_label' => '',
        ],
        is_array( $atts ) ? $atts : [],
        'zydka_player'
    );

    $atts['id']     = sanitize_text_field( $atts['id'] );
    $atts['title']  = sanitize_text_field( $atts['title'] );
    $atts['artist'] = sanitize_text_field( $atts['artist'] );
    $atts['src']    = esc_url_raw( $atts['src'] );
    $atts['album']  = sanitize_text_field( $atts['album'] );
    $atts['cover']  = esc_url_raw( $atts['cover'] );
    $atts['buy_url'] = esc_url_raw( $atts['buy_url'] );
    $atts['buy_label'] = sanitize_text_field( $atts['buy_label'] );

    return zydka_player_render_container( $atts );
}
add_shortcode( 'zydka_player', 'zydka_player_shortcode' );

/**
 * Shortcode parent [zydka_playlist].
 */
function zydka_playlist_shortcode( $atts = [], $content = null ): string {
    global $zydka_playlist_tracks;

    $previous_tracks = $zydka_playlist_tracks ?? null;
    $zydka_playlist_tracks = [];

    if ( $content ) {
        do_shortcode( $content );
    }

    $tracks = $zydka_playlist_tracks;
    $zydka_playlist_tracks = $previous_tracks;

    $first_track = $tracks[0] ?? [
        'id'     => 'demo-track',
        'title'  => 'Demo Track',
        'artist' => 'Atelier Zydka',
        'src'    => '',
        'album'  => '',
        'cover'  => '',
        'buy_url' => '',
        'buy_label' => '',
    ];

    $first_track['source'] = 'playlist';

    return zydka_player_render_container( $first_track, $tracks );
}
add_shortcode( 'zydka_playlist', 'zydka_playlist_shortcode' );

/**
 * Shortcode enfant [zydka_track].
 */
function zydka_track_shortcode( $atts = [] ): string {
    global $zydka_playlist_tracks;

    if ( ! is_array( $zydka_playlist_tracks ) ) {
        return '';
    }

    $atts = shortcode_atts(
        [
            'id'     => '',
            'title'  => '',
            'artist' => '',
            'src'    => '',
            'album'  => '',
            'cover'  => '',
            'buy_url' => '',
            'buy_label' => '',
        ],
        is_array( $atts ) ? $atts : [],
        'zydka_track'
    );

    $src = esc_url_raw( $atts['src'] );

    if ( '' === $src ) {
        return '';
    }

    $zydka_playlist_tracks[] = [
        'id'     => sanitize_text_field( $atts['id'] ?: 'track-' . ( count( $zydka_playlist_tracks ) + 1 ) ),
        'title'  => sanitize_text_field( $atts['title'] ),
        'artist' => sanitize_text_field( $atts['artist'] ),
        'src'    => $src,
        'album'  => sanitize_text_field( $atts['album'] ),
        'cover'  => esc_url_raw( $atts['cover'] ),
        'buy_url' => esc_url_raw( $atts['buy_url'] ),
        'buy_label' => sanitize_text_field( $atts['buy_label'] ),
    ];

    return '';
}
add_shortcode( 'zydka_track', 'zydka_track_shortcode' );
