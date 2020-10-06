<?php
/**
 * Block Pattern functionality.
 *
 * @package gutenberg
 */

/**
 * Register "core" patterns from the WordPress.org pattern directory.
 */
function gutenberg_register_remote_block_patterns() {
	$should_register_core_patterns = get_theme_support( 'core-block-patterns' );

	// Unregister the bundled core patterns.
	$patterns = WP_Block_Patterns_Registry::get_instance()->get_all_registered();
	foreach ( $patterns as $pattern ) {
		if ( 'core/' === substr( $pattern['name'], 0, 5 ) ) {
			unregister_block_pattern( $pattern['name'] );
		}
	}

	if ( $should_register_core_patterns ) {
		$request = new WP_REST_Request( 'GET', '/__experimental/pattern-directory/patterns' );
		$request->set_param( 'keyword', 11 ); // 11 is the ID for "core".
		$response = rest_do_request( $request );
		if ( $response->is_error() ) {
			return;
		}
		$patterns = $response->get_data();
		foreach ( $patterns as $settings ) {
			$pattern_name = 'core/' . sanitize_title( $settings['title'] );
			register_block_pattern( $pattern_name, (array) $settings );
		}
	}
}
add_action( 'init', 'gutenberg_register_remote_block_patterns', 11 );
