<?php
/**
 * Privacy helpers for Zydka Analytics.
 *
 * @package Zydka_Analytics
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class Zydka_Analytics_Privacy {
	/**
	 * Return privacy copy for later integration into a privacy policy page.
	 */
	public static function get_privacy_policy_text(): string {
		return 'Zydka Analytics measures the use of the music catalogue on louis94.com. The plugin stores player events, track identifiers, hashed anonymous listener/session identifiers, hashed IP addresses and hashed User-Agent values. It does not store raw IP addresses, WooCommerce customer data, payment data or public profile data. These events are used only to measure proprietary listening activity on louis94.com.';
	}
}
