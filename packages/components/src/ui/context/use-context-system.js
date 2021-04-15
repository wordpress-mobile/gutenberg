/**
 * External dependencies
 */
import memoize from 'memize';
import { kebabCase, uniq } from 'lodash';

/**
 * WordPress dependencies
 */
import warn from '@wordpress/warning';

/**
 * Internal dependencies
 */
import { cx } from '../styles';
import { getInterpolatedClassName } from '../create-styles';
import { CONNECTED_NAMESPACE } from './constants';
import { useComponentsContext } from './context-system-provider';
import { ns } from './utils';

/* eslint-disable jsdoc/valid-types */
/**
 * @template TProps
 * @typedef {TProps & { [CONNECTED_NAMESPACE]: boolean; className: string; children?: import('react').ReactNode }} ConnectedProps
 */
/* eslint-enable jsdoc/valid-types */

/**
 * Custom hook that derives registered props from the Context system.
 * These derived props are then consolidated with incoming component props.
 *
 * @template {{ className?: string }} P
 * @param {P} props Incoming props from the component.
 * @param {string} namespace The namespace to register and to derive context props from.
 * @return {ConnectedProps<P>} The connected props.
 */
export function useContextSystem( props, namespace ) {
	const contextSystemProps = useComponentsContext();
	const displayName = Array.isArray( namespace ) ? namespace[ 0 ] : namespace;

	if ( typeof namespace === 'undefined' ) {
		warn( 'useContextSystem: Please provide a namespace' );
	}

	const contextProps = contextSystemProps?.[ displayName ] || {};

	/* eslint-disable jsdoc/no-undefined-types */
	/** @type {ConnectedProps<P>} */
	// @ts-ignore We fill in the missing properties below
	const finalComponentProps = {
		[ CONNECTED_NAMESPACE ]: true,
	};
	/* eslint-enable jsdoc/no-undefined-types */

	const nextNs = ns( displayName );
	for ( const k in nextNs ) {
		if ( typeof nextNs[ k ] === 'string' ) {
			// @ts-ignore filling in missing props
			finalComponentProps[ k ] = nextNs[ k ];
		}
	}

	const { _overrides: overrideProps, ...otherContextProps } = contextProps;

	const initialMergedProps = Object.entries( otherContextProps ).length
		? Object.assign( {}, otherContextProps, props )
		: props;

	const interpolationClassName = getInterpolatedClassName( displayName );

	const classes = cx(
		memoizedGetStyledClassNameFromKey( displayName ),
		props.className,
		interpolationClassName
	);

	// Provides the ability to customize the render of the component.
	const rendered =
		typeof initialMergedProps.renderChildren === 'function'
			? initialMergedProps.renderChildren( initialMergedProps )
			: initialMergedProps.children;

	for ( const k in initialMergedProps ) {
		// @ts-ignore filling in missing props
		finalComponentProps[ k ] = initialMergedProps[ k ];
	}

	for ( const k in overrideProps ) {
		// @ts-ignore filling in missing props
		finalComponentProps[ k ] = overrideProps[ k ];
	}

	finalComponentProps.children = rendered;
	finalComponentProps.className = classes;

	return finalComponentProps;
}

/**
 * Generates the connected component CSS className based on the namespace.
 *
 * @param {string} displayName The name of the connected component.
 * @return {string} The generated CSS className.
 */
function getStyledClassName( displayName ) {
	if ( ! displayName || typeof displayName !== 'string' ) return '';

	const kebab = kebabCase( displayName );
	return `components-${ kebab } wp-components-${ kebab }`;
}

/**
 * Generates the connected component CSS className based on the namespace.
 *
 * @param {string} key The name of the connected component.
 * @return {string} The generated CSS className.
 */
function getStyledClassNameFromKey( key ) {
	if ( ! key ) return '';

	if ( Array.isArray( key ) ) {
		return cx( uniq( key ).map( getStyledClassName ) );
	}
	if ( typeof key === 'string' ) {
		return getStyledClassName( key );
	}

	return '';
}

const memoizedGetStyledClassNameFromKey = memoize( getStyledClassNameFromKey );
