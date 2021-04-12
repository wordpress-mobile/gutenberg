/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useRef, useEffect, useState, cloneElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Popover from '../popover';

function useObservableState( initialState, onStateChange ) {
	const [ state, setState ] = useState( initialState );
	return [
		state,
		( value ) => {
			setState( value );
			if ( onStateChange ) {
				onStateChange( value );
			}
		},
	];
}

export default function Dropdown( {
	renderContent,
	renderToggle,
	position = 'bottom right',
	className,
	contentClassName,
	expandOnMobile,
	headerTitle,
	focusOnMount,
	popoverProps,
	onClose,
	onToggle,
} ) {
	const containerRef = useRef();
	const [ isOpen, setIsOpen ] = useObservableState( false, onToggle );

	useEffect(
		() => () => {
			if ( onToggle ) {
				onToggle( false );
			}
		},
		[]
	);

	function toggle() {
		setIsOpen( ! isOpen );
	}

	function close() {
		if ( onClose ) {
			onClose();
		}
		setIsOpen( false );
	}

	const args = { isOpen, onToggle: toggle, onClose: close };

	const isPressingToggle = useRef();
	const closeUnlessPressingToggle = () => {
		if ( ! isPressingToggle.current ) {
			close();
		}
	};
	let toggleElement = renderToggle( args );
	const { props } = toggleElement;
	const pressHandlers = {
		onMouseDown: ( event ) => {
			isPressingToggle.current = true;
			props.onMouseDown?.( event );
		},
		onMouseUp: ( event ) => {
			isPressingToggle.current = false;
			props.onMouseUp?.( event );
		},
	};
	toggleElement = cloneElement( toggleElement, pressHandlers );
	return (
		<div
			className={ classnames( 'components-dropdown', className ) }
			ref={ containerRef }
		>
			{ toggleElement }
			{ isOpen && (
				<Popover
					position={ position }
					onClose={ closeUnlessPressingToggle }
					expandOnMobile={ expandOnMobile }
					headerTitle={ headerTitle }
					focusOnMount={ focusOnMount }
					{ ...popoverProps }
					anchorRef={
						popoverProps?.anchorRef ?? containerRef.current
					}
					className={ classnames(
						'components-dropdown__content',
						popoverProps ? popoverProps.className : undefined,
						contentClassName
					) }
				>
					{ renderContent( args ) }
				</Popover>
			) }
		</div>
	);
}
