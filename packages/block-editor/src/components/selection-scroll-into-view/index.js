/**
 * External dependencies
 */
import scrollIntoView from 'dom-scroll-into-view';

/**
 * WordPress dependencies
 */
import { useEffect, useRef } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { getScrollContainer } from '@wordpress/dom';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { useBlockRef } from '../block-list/use-block-props/use-block-refs';

export function useScrollSelectionIntoView() {
	const ref = useRef();
	const selectionEnd = useSelect(
		( select ) => select( blockEditorStore ).getBlockSelectionEnd(),
		[]
	);

	useBlockRef( selectionEnd, ref );
	useEffect( () => {
		if ( ! selectionEnd || ! ref.current ) {
			return;
		}

		const scrollContainer = getScrollContainer( ref.current );

		// If there's no scroll container, it follows that there's no scrollbar
		// and thus there's no need to try to scroll into view.
		if ( ! scrollContainer ) {
			return;
		}

		scrollIntoView( ref.current, scrollContainer, {
			onlyScrollIfNeeded: true,
		} );
	}, [ selectionEnd ] );
}

/**
 * Scrolls the multi block selection end into view if not in view already. This
 * is important to do after selection by keyboard.
 */
export function MultiSelectScrollIntoView() {
	const ref = useRef();
	useScrollSelectionIntoView( ref );
	return <div ref={ ref } />;
}
