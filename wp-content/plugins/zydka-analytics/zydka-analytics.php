<?php
/**
 * Plugin Name: Zydka Analytics
 * Plugin URI:  https://louis94.com
 * Description: Receives and stores proprietary Zydka Player stream analytics events for louis94.com.
 * Version:     0.7.1
 * Author:      Atelier Zydka
 * Author URI:  https://louis94.com
 * Text Domain: zydka-analytics
 * License:     Proprietary
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'ZYDKA_ANALYTICS_VERSION', '0.7.1' );
define( 'ZYDKA_ANALYTICS_FILE', __FILE__ );
define( 'ZYDKA_ANALYTICS_PATH', plugin_dir_path( __FILE__ ) );
define( 'ZYDKA_ANALYTICS_REST_NAMESPACE', 'zydka/v1' );

require_once ZYDKA_ANALYTICS_PATH . 'includes/class-activator.php';
require_once ZYDKA_ANALYTICS_PATH . 'includes/class-stream-validator.php';
require_once ZYDKA_ANALYTICS_PATH . 'includes/class-rest-api.php';
require_once ZYDKA_ANALYTICS_PATH . 'includes/class-privacy.php';

final class Zydka_Analytics {
	/**
	 * Boot plugin hooks.
	 */
	public static function init(): void {
		Zydka_Analytics_REST_API::init();
		add_action( 'wp_head', [ __CLASS__, 'print_front_endpoint' ], 1 );
	}

	/**
	 * Create database tables on activation.
	 */
	public static function activate(): void {
		Zydka_Analytics_Activator::activate();
	}

	/**
	 * Expose the receiver endpoint for any front-end player integration.
	 */
	public static function print_front_endpoint(): void {
		$endpoint = wp_parse_url( rest_url( ZYDKA_ANALYTICS_REST_NAMESPACE . '/streams/event' ), PHP_URL_PATH );

		if ( ! is_string( $endpoint ) || '' === $endpoint ) {
			$endpoint = '/wp-json/' . ZYDKA_ANALYTICS_REST_NAMESPACE . '/streams/event';
		}

		?>
<script>
window.zydkaPlayerAnalyticsEndpoint = <?php echo wp_json_encode( $endpoint ); ?>;
window.zydkaPlayerAnalytics = window.zydkaPlayerAnalytics || {};
window.zydkaPlayerAnalytics.endpoint = window.zydkaPlayerAnalyticsEndpoint;
</script>
		<?php
	}
}

Zydka_Analytics::init();

register_activation_hook( __FILE__, [ 'Zydka_Analytics', 'activate' ] );
