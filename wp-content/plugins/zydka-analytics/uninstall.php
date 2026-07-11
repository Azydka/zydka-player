<?php
/**
 * Zydka Analytics uninstall guard.
 *
 * Data tables are intentionally not removed automatically.
 * Export and confirm manually before deleting analytics tables.
 */

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

// No automatic deletion in V0.7.
