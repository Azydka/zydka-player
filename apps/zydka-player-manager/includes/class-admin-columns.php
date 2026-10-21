<?php
/**
 * Admin list columns and filters.
 *
 * @package ZydkaPlayerManager
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class Zydka_Player_Manager_Admin_Columns {
	/**
	 * Register hooks.
	 */
	public static function init(): void {
		add_filter( 'manage_zydka_track_posts_columns', [ __CLASS__, 'track_columns' ] );
		add_action( 'manage_zydka_track_posts_custom_column', [ __CLASS__, 'render_track_column' ], 10, 2 );
		add_filter( 'manage_zydka_catalog_posts_columns', [ __CLASS__, 'catalog_columns' ] );
		add_action( 'manage_zydka_catalog_posts_custom_column', [ __CLASS__, 'render_catalog_column' ], 10, 2 );
		add_action( 'restrict_manage_posts', [ __CLASS__, 'render_track_filters' ] );
		add_action( 'pre_get_posts', [ __CLASS__, 'apply_track_filters' ] );
	}

	/**
	 * Track columns.
	 *
	 * @param array<string,string> $columns Existing columns.
	 * @return array<string,string>
	 */
	public static function track_columns( array $columns ): array {
		unset( $columns['date'] );

		return [
			'cb'                       => $columns['cb'] ?? '<input type="checkbox">',
			'zydka_id'                 => __( 'ID', 'zydka-player-manager' ),
			'title'                    => __( 'Titre', 'zydka-player-manager' ),
			'zydka_type'               => __( 'Type', 'zydka-player-manager' ),
			'zydka_artist'             => __( 'Artiste', 'zydka-player-manager' ),
			'zydka_bpm'                => __( 'BPM', 'zydka-player-manager' ),
			'zydka_audio_preview'      => __( 'Audio preview', 'zydka-player-manager' ),
			'zydka_cover'              => __( 'Cover', 'zydka-player-manager' ),
			'zydka_commercial_status'  => __( 'Statut commercial', 'zydka-player-manager' ),
			'zydka_product_id'         => __( 'Produit associe', 'zydka-player-manager' ),
		];
	}

	/**
	 * Render track column.
	 */
	public static function render_track_column( string $column, int $post_id ): void {
		switch ( $column ) {
			case 'zydka_id':
				echo esc_html( (string) $post_id );
				break;

			case 'zydka_type':
				$type  = (string) get_post_meta( $post_id, '_zydka_track_type', true );
				echo esc_html( Zydka_Player_Manager_Post_Types::get_track_type_label( $type ) );
				break;

			case 'zydka_artist':
				echo esc_html( (string) get_post_meta( $post_id, '_zydka_track_artist', true ) );
				break;

			case 'zydka_bpm':
				echo esc_html( (string) absint( get_post_meta( $post_id, '_zydka_track_bpm', true ) ) );
				break;

			case 'zydka_commercial_status':
				$status   = (string) get_post_meta( $post_id, '_zydka_track_commercial_status', true );
				echo esc_html( Zydka_Player_Manager_Post_Types::get_commercial_status_label( $status ) );
				break;

			case 'zydka_product_id':
				$product_id = absint( get_post_meta( $post_id, '_zydka_track_product_id', true ) );
				if ( $product_id > 0 ) {
					printf( '#%d', $product_id );
				} else {
					echo '<span class="zydka-muted">' . esc_html__( 'Absent', 'zydka-player-manager' ) . '</span>';
				}
				break;

			case 'zydka_audio_preview':
				self::render_presence_badge( (string) get_post_meta( $post_id, '_zydka_track_audio_url', true ) );
				break;

			case 'zydka_cover':
				self::render_presence_badge( Zydka_Player_Manager_Meta_Boxes::track_has_cover( $post_id ) ? '1' : '' );
				break;
		}
	}

	/**
	 * Catalog columns.
	 *
	 * @param array<string,string> $columns Existing columns.
	 * @return array<string,string>
	 */
	public static function catalog_columns( array $columns ): array {
		unset( $columns['date'] );

		return [
			'cb'                   => $columns['cb'] ?? '<input type="checkbox">',
			'zydka_id'             => __( 'ID', 'zydka-player-manager' ),
			'title'                => __( 'Titre', 'zydka-player-manager' ),
			'zydka_track_count'    => __( 'Nombre de tracks', 'zydka-player-manager' ),
			'zydka_shortcode'      => __( 'Shortcode', 'zydka-player-manager' ),
			'zydka_public_display' => __( 'Affichage public', 'zydka-player-manager' ),
			'modified'             => __( 'Derniere modification', 'zydka-player-manager' ),
		];
	}

	/**
	 * Render catalog column.
	 */
	public static function render_catalog_column( string $column, int $post_id ): void {
		switch ( $column ) {
			case 'zydka_id':
				echo esc_html( (string) $post_id );
				break;

			case 'zydka_track_count':
				echo esc_html( (string) count( Zydka_Player_Manager_Meta_Boxes::get_catalog_track_ids( $post_id ) ) );
				break;

			case 'zydka_shortcode':
				printf( '<code>[zydka_playlist id="%d"]</code>', absint( $post_id ) );
				break;

			case 'zydka_public_display':
				$count = count( Zydka_Player_Manager_Meta_Boxes::get_catalog_track_ids( $post_id ) );
				self::render_catalog_display_badge( $count );
				break;

			case 'modified':
				echo esc_html( get_the_modified_date( '', $post_id ) );
				break;
		}
	}

	/**
	 * Render admin list filters for tracks.
	 */
	public static function render_track_filters(): void {
		global $typenow;

		if ( 'zydka_track' !== $typenow ) {
			return;
		}

		self::render_filter_select(
			'zydka_filter_type',
			__( 'Tous les types', 'zydka-player-manager' ),
			Zydka_Player_Manager_Post_Types::get_track_types()
		);

		self::render_filter_select(
			'zydka_filter_status',
			__( 'Tous les statuts', 'zydka-player-manager' ),
			Zydka_Player_Manager_Post_Types::get_commercial_statuses()
		);

		self::render_filter_select(
			'zydka_filter_audio',
			__( 'Audio preview', 'zydka-player-manager' ),
			[
				'with'    => __( 'Avec audio preview', 'zydka-player-manager' ),
				'without' => __( 'Sans audio preview', 'zydka-player-manager' ),
			]
		);

		self::render_filter_select(
			'zydka_filter_product',
			__( 'Produit associe', 'zydka-player-manager' ),
			[
				'with'    => __( 'Avec produit', 'zydka-player-manager' ),
				'without' => __( 'Sans produit', 'zydka-player-manager' ),
			]
		);
	}

	/**
	 * Apply admin filters.
	 *
	 * @param WP_Query $query Current query.
	 */
	public static function apply_track_filters( WP_Query $query ): void {
		if ( ! is_admin() || ! $query->is_main_query() || 'zydka_track' !== $query->get( 'post_type' ) ) {
			return;
		}

		$meta_query = (array) $query->get( 'meta_query' );

		$type = sanitize_key( wp_unslash( $_GET['zydka_filter_type'] ?? '' ) );
		if ( $type && array_key_exists( $type, Zydka_Player_Manager_Post_Types::get_track_types() ) ) {
			$meta_query[] = [
				'key'   => '_zydka_track_type',
				'value' => $type,
			];
		}

		$status = sanitize_key( wp_unslash( $_GET['zydka_filter_status'] ?? '' ) );
		if ( $status && array_key_exists( $status, Zydka_Player_Manager_Post_Types::get_commercial_statuses() ) ) {
			$meta_query[] = [
				'key'   => '_zydka_track_commercial_status',
				'value' => $status,
			];
		}

		$audio = sanitize_key( wp_unslash( $_GET['zydka_filter_audio'] ?? '' ) );
		if ( 'with' === $audio ) {
			$meta_query[] = [
				'key'     => '_zydka_track_audio_url',
				'value'   => '',
				'compare' => '!=',
			];
		} elseif ( 'without' === $audio ) {
			$meta_query[] = [
				'relation' => 'OR',
				[
					'key'     => '_zydka_track_audio_url',
					'compare' => 'NOT EXISTS',
				],
				[
					'key'     => '_zydka_track_audio_url',
					'value'   => '',
					'compare' => '=',
				],
			];
		}

		$product = sanitize_key( wp_unslash( $_GET['zydka_filter_product'] ?? '' ) );
		if ( 'with' === $product ) {
			$meta_query[] = [
				'key'     => '_zydka_track_product_id',
				'value'   => 0,
				'type'    => 'NUMERIC',
				'compare' => '>',
			];
		} elseif ( 'without' === $product ) {
			$meta_query[] = [
				'relation' => 'OR',
				[
					'key'     => '_zydka_track_product_id',
					'compare' => 'NOT EXISTS',
				],
				[
					'key'     => '_zydka_track_product_id',
					'value'   => 0,
					'type'    => 'NUMERIC',
					'compare' => '<=',
				],
			];
		}

		if ( $meta_query ) {
			$query->set( 'meta_query', $meta_query );
		}
	}

	/**
	 * Render one select filter.
	 *
	 * @param array<string,string> $options Options.
	 */
	private static function render_filter_select( string $name, string $placeholder, array $options ): void {
		$current = sanitize_key( wp_unslash( $_GET[ $name ] ?? '' ) );

		printf( '<select name="%1$s"><option value="">%2$s</option>', esc_attr( $name ), esc_html( $placeholder ) );

		foreach ( $options as $value => $label ) {
			printf(
				'<option value="%1$s" %2$s>%3$s</option>',
				esc_attr( $value ),
				selected( $current, $value, false ),
				esc_html( $label )
			);
		}

		echo '</select>';
	}

	/**
	 * Render yes/no badge.
	 */
	private static function render_presence_badge( string $value ): void {
		if ( '' !== $value ) {
			echo '<span class="zydka-badge zydka-badge-ok">' . esc_html__( 'OK', 'zydka-player-manager' ) . '</span>';
			return;
		}

		echo '<span class="zydka-badge zydka-badge-missing">' . esc_html__( 'Absent', 'zydka-player-manager' ) . '</span>';
	}

	/**
	 * Render public display badge.
	 */
	private static function render_catalog_display_badge( int $track_count ): void {
		if ( $track_count > 0 ) {
			echo '<span class="zydka-badge zydka-badge-ok">' . esc_html__( 'OK', 'zydka-player-manager' ) . '</span>';
			return;
		}

		echo '<span class="zydka-badge zydka-badge-attention">' . esc_html__( 'Attention', 'zydka-player-manager' ) . '</span>';
	}
}
