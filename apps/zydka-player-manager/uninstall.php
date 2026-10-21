<?php
/**
 * Plugin uninstall entrypoint.
 *
 * @package ZydkaPlayerManager
 */

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

require_once __DIR__ . '/includes/class-uninstall.php';

Zydka_Player_Manager_Uninstall::run();
