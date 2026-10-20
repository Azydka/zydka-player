<?php
/**
 * Front shortcodes.
 *
 * @package ZydkaPlayerManager
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class Zydka_Player_Manager_Shortcodes {
	/**
	 * Previous shortcode callback from the legacy player, if one exists.
	 *
	 * @var callable|null
	 */
	private static $legacy_playlist_callback = null;

	/**
	 * Register hooks.
	 */
	public static function init(): void {
		add_action( 'init', [ __CLASS__, 'register_shortcode' ], 999 );
		add_action( 'wp_enqueue_scripts', [ __CLASS__, 'enqueue_front_assets' ] );
	}

	/**
	 * Register shortcode late so manager wins when an id is provided.
	 */
	public static function register_shortcode(): void {
		global $shortcode_tags;

		$manager_callback = [ __CLASS__, 'playlist_shortcode' ];
		$existing_callback = $shortcode_tags['zydka_playlist'] ?? null;

		if ( $existing_callback && $existing_callback !== $manager_callback && is_callable( $existing_callback ) ) {
			self::$legacy_playlist_callback = $existing_callback;
		}

		add_shortcode( 'zydka_playlist', $manager_callback );
	}

	/**
	 * Load minimal front styles for the manager-rendered playlist fallback.
	 */
	public static function enqueue_front_assets(): void {
		wp_enqueue_style(
			'zydka-player-manager-front',
			ZYDKA_PLAYER_MANAGER_URL . 'assets/css/front.css',
			[],
			ZYDKA_PLAYER_MANAGER_VERSION
		);
	}

	/**
	 * Render [zydka_playlist id="123"].
	 *
	 * @param array<string,mixed>|string $atts Shortcode attrs.
	 */
	public static function playlist_shortcode( $atts = [], $content = null, string $tag = 'zydka_playlist' ): string {
		$raw_atts = is_array( $atts ) ? $atts : [];
		$atts = shortcode_atts(
			[
				'id' => 0,
			],
			$raw_atts,
			'zydka_playlist'
		);

		$playlist_id = absint( $atts['id'] );
		if ( 0 === $playlist_id ) {
			if ( self::$legacy_playlist_callback && is_callable( self::$legacy_playlist_callback ) ) {
				return (string) call_user_func( self::$legacy_playlist_callback, $raw_atts, $content, $tag );
			}

			return current_user_can( 'edit_posts' ) ? '<p class="zydka-manager-playlist-empty">' . esc_html__( 'Playlist Zydka invalide.', 'zydka-player-manager' ) . '</p>' : '';
		}

		$payload = Zydka_Player_Manager_REST_API::get_playlist_payload( $playlist_id );
		if ( is_wp_error( $payload ) ) {
			return current_user_can( 'edit_post', $playlist_id ) ? '<p class="zydka-manager-playlist-empty">' . esc_html( $payload->get_error_message() ) . '</p>' : '';
		}

		if ( empty( $payload['tracks'] ) ) {
			return current_user_can( 'edit_post', $playlist_id ) ? '<p class="zydka-manager-playlist-empty">' . esc_html__( 'Cette playlist ne contient aucune track disponible.', 'zydka-player-manager' ) . '</p>' : '';
		}

		$player_tracks = self::get_player_tracks( $payload['tracks'] );
		$first_track   = $player_tracks[0] ?? null;

		if ( ! $first_track ) {
			return current_user_can( 'edit_post', $playlist_id ) ? '<p class="zydka-manager-playlist-empty">' . esc_html__( 'Cette playlist ne contient aucune track audio disponible.', 'zydka-player-manager' ) . '</p>' : '';
		}

		$output = self::render_player_container( $payload, $player_tracks );

		return apply_filters( 'zydka_player_manager_shortcode_output', $output, $playlist_id, $payload );
	}

	/**
	 * Render the Zydka Player root expected by the zydka-player front script.
	 *
	 * @param array<string,mixed> $payload Playlist payload.
	 * @param array<int,array<string,mixed>> $tracks Player-ready tracks.
	 */
	private static function render_player_container( array $payload, array $tracks ): string {
		$first_track = $tracks[0];
		$attributes  = [
			'id'               => 'zydka-player-root',
			'class'            => 'zydka-player-root zydka-manager-player-root',
			'data-source'      => 'manager-playlist',
			'data-playlist-id' => (string) absint( $payload['id'] ?? 0 ),
			'data-track-id'    => (string) ( $first_track['id'] ?? '' ),
			'data-title'       => (string) ( $first_track['title'] ?? '' ),
			'data-artist'      => (string) ( $first_track['artist'] ?? '' ),
			'data-album'       => (string) ( $first_track['album'] ?? '' ),
			'data-src'         => (string) ( $first_track['audioUrl'] ?? '' ),
			'data-cover'       => (string) ( $first_track['cover'] ?? '' ),
			'data-download-url' => (string) ( $first_track['downloadUrl'] ?? '' ),
			'data-tracks'      => wp_json_encode( $tracks, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ),
		];

		ob_start();
		?>
		<div <?php echo self::get_html_attributes( $attributes ); ?>>
			<?php self::render_fallback_playlist( $payload, $tracks ); ?>
		</div>
		<?php

		return (string) ob_get_clean();
	}

	/**
	 * Convert REST tracks to the shape read by Zydka Player.
	 *
	 * @param array<int,array<string,mixed>> $tracks REST track payloads.
	 * @return array<int,array<string,mixed>>
	 */
	private static function get_player_tracks( array $tracks ): array {
		$player_tracks = [];

		foreach ( $tracks as $track ) {
			if ( ! is_array( $track ) ) {
				continue;
			}

			$audio_url = esc_url_raw( (string) ( $track['audioUrl'] ?? '' ) );
			if ( '' === $audio_url ) {
				continue;
			}

			$track_id = absint( $track['id'] ?? 0 );

			$player_track = [
				'id'          => $track_id,
				'title'       => self::get_readable_track_title( $track, $track_id ),
				'artist'      => sanitize_text_field( (string) ( $track['artist'] ?? '' ) ),
				'album'       => sanitize_text_field( (string) ( $track['album'] ?? '' ) ),
				'audioUrl'    => $audio_url,
				'src'         => $audio_url,
				'cover'       => esc_url_raw( (string) ( $track['cover'] ?? '' ) ),
				'downloadUrl' => esc_url_raw( (string) ( $track['downloadUrl'] ?? '' ) ),
				'type'        => sanitize_text_field( (string) ( $track['type'] ?? '' ) ),
				'bpm'         => absint( $track['bpm'] ?? 0 ),
				'mood'        => sanitize_text_field( (string) ( $track['mood'] ?? '' ) ),
				'style'       => sanitize_text_field( (string) ( $track['style'] ?? '' ) ),
			];

			$player_tracks[] = array_filter(
				$player_track,
				static function ( $value ): bool {
					return '' !== $value && null !== $value && [] !== $value;
				}
			);
		}

		return $player_tracks;
	}

	/**
	 * Render native audio cards inside the player root as a no-JS/player-unavailable fallback.
	 *
	 * @param array<string,mixed> $payload Playlist payload.
	 * @param array<int,array<string,mixed>> $tracks Player-ready tracks.
	 */
	private static function render_fallback_playlist( array $payload, array $tracks ): void {
		?>
		<div class="zydka-manager-playlist zydka-manager-playlist-fallback" data-playlist-id="<?php echo esc_attr( (string) $payload['id'] ); ?>">
			<header class="zydka-manager-playlist-header">
				<h2><?php echo esc_html( (string) $payload['title'] ); ?></h2>
			</header>
			<?php foreach ( $tracks as $track ) : ?>
				<?php
				$track_id    = absint( $track['id'] ?? 0 );
				$artist      = (string) ( $track['artist'] ?? '' );
				$audio_url   = esc_url_raw( (string) ( $track['audioUrl'] ?? '' ) );
				$cover_url   = esc_url_raw( (string) ( $track['cover'] ?? '' ) );
				$track_title = (string) ( $track['title'] ?? sprintf( __( 'Track #%d', 'zydka-player-manager' ), $track_id ) );
				?>
				<article class="zydka-manager-track" data-track-id="<?php echo esc_attr( (string) $track_id ); ?>">
					<div class="zydka-manager-track-cover">
						<?php if ( $cover_url ) : ?>
							<img src="<?php echo esc_url( $cover_url ); ?>" alt="<?php echo esc_attr( $track_title ); ?>">
						<?php else : ?>
							<span><?php echo esc_html__( 'Cover absente', 'zydka-player-manager' ); ?></span>
						<?php endif; ?>
					</div>
					<div class="zydka-manager-track-body">
						<h3><?php echo esc_html( $track_title ); ?></h3>
						<?php if ( $artist ) : ?>
							<p class="zydka-manager-track-artist"><?php echo esc_html( $artist ); ?></p>
						<?php endif; ?>
						<audio controls preload="none" src="<?php echo esc_url( $audio_url ); ?>"></audio>
					</div>
				</article>
			<?php endforeach; ?>
		</div>
		<?php
	}

	/**
	 * Build escaped HTML attributes from an associative array.
	 *
	 * @param array<string,string|false|null> $attributes Attributes.
	 */
	private static function get_html_attributes( array $attributes ): string {
		$output = [];

		foreach ( $attributes as $name => $value ) {
			if ( null === $value || false === $value || '' === $value ) {
				continue;
			}

			$output[] = sprintf( '%s="%s"', esc_attr( $name ), esc_attr( (string) $value ) );
		}

		return implode( ' ', $output );
	}

	/**
	 * Return a human-readable track title, even when legacy titles are URLs.
	 *
	 * @param array<string,mixed> $track Track payload.
	 */
	private static function get_readable_track_title( array $track, int $track_id ): string {
		$title     = trim( (string) ( $track['title'] ?? '' ) );
		$artist    = trim( (string) ( $track['artist'] ?? '' ) );
		$audio_url = trim( (string) ( $track['audioUrl'] ?? '' ) );

		if ( '' !== $title && ! self::looks_like_url( $title ) ) {
			return $title;
		}

		$derived = self::derive_title_from_url( $audio_url );
		if ( '' !== $derived ) {
			return $derived;
		}

		if ( '' !== $artist ) {
			return sprintf( __( '%1$s - Track #%2$d', 'zydka-player-manager' ), $artist, $track_id );
		}

		return sprintf( __( 'Track #%d', 'zydka-player-manager' ), $track_id );
	}

	/**
	 * Check if a title is probably a URL or raw file path.
	 */
	private static function looks_like_url( string $value ): bool {
		return (bool) preg_match( '#^(https?:)?//#i', $value ) || (bool) preg_match( '#\.(mp3|wav|m4a|aac|ogg)(\?.*)?$#i', $value );
	}

	/**
	 * Derive a readable title from an audio URL.
	 */
	private static function derive_title_from_url( string $url ): string {
		if ( '' === $url ) {
			return '';
		}

		$path = (string) wp_parse_url( $url, PHP_URL_PATH );
		$name = basename( $path );
		$name = preg_replace( '/\.[a-z0-9]+$/i', '', $name );
		$name = preg_replace( '/[-_]+/', ' ', (string) $name );
		$name = trim( preg_replace( '/\s+/', ' ', (string) $name ) );

		if ( '' === $name ) {
			return '';
		}

		return ucwords( $name );
	}
}
