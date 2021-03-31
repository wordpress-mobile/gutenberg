/**
 * External dependencies
 */
import { omit, keyBy, isEqual } from 'lodash';

/**
 * WordPress dependencies
 */
import { serialize, parse, createBlock } from '@wordpress/blocks';
import { useState, useEffect, useCallback, useRef } from '@wordpress/element';

function addWidgetIdToBlock( block, widgetId ) {
	return {
		...block,
		attributes: {
			...( block.attributes || {} ),
			__internalWidgetId: widgetId,
		},
	};
}

function blockToWidget( block, existingWidget = null ) {
	let widget;

	if ( block.name === 'core/legacy-widget' ) {
		const isReferenceWidget = !! block.attributes.referenceWidgetName;
		if ( isReferenceWidget ) {
			widget = {
				id: block.attributes.referenceWidgetName,
				instance: block.attributes.instance,
			};
		} else {
			widget = {
				widgetClass: block.attributes.widgetClass,
				idBase: block.attributes.idBase,
				instance: block.attributes.instance,
			};
		}
	} else {
		const instance = {
			content: serialize( block ),
		};
		widget = {
			idBase: 'block',
			widgetClass: 'WP_Widget_Block',
			instance: {
				...instance,
				__unstable_instance: instance,
			},
		};
	}

	return {
		...omit( existingWidget, [ 'form', 'rendered' ] ),
		...widget,
	};
}

function widgetToBlock( widget ) {
	let block;

	if ( widget.idBase === 'block' ) {
		const parsedBlocks = parse(
			widget.instance.__unstable_instance.content
		);
		block = parsedBlocks.length
			? parsedBlocks[ 0 ]
			: createBlock( 'core/paragraph', {} );
	} else {
		const attributes = {
			name: widget.name,
			form: widget.form,
			instance: widget.instance,
			idBase: widget.idBase,
			number: widget.number,
		};

		const isReferenceWidget = ! widget.widgetClass;
		if ( isReferenceWidget ) {
			attributes.referenceWidgetName = widget.id;
		} else {
			attributes.widgetClass = widget.widgetClass;
		}

		block = createBlock( 'core/legacy-widget', attributes, [] );
	}

	return addWidgetIdToBlock( block, widget.id );
}

function initState( sidebar ) {
	const state = [];

	for ( const widgetId of sidebar.getWidgetIds() ) {
		const widget = sidebar.getWidget( widgetId );
		const block = widgetToBlock( widget );
		state.push( block );
	}

	return state;
}

export default function useSidebarBlockEditor( sidebar ) {
	// TODO: Could/should optimize these data structures so that there's less
	// array traversal. In particular, setBlocks() is a really hot path.

	const [ state, setState ] = useState( () => initState( sidebar ) );

	const ignoreIncoming = useRef( false );

	useEffect( () => {
		const handler = ( event ) => {
			if ( ignoreIncoming.current ) {
				return;
			}

			switch ( event.type ) {
				case 'widgetAdded': {
					const { widgetId } = event;
					const block = blockToWidget(
						sidebar.getWidget( widgetId )
					);
					setState( ( lastState ) => [ ...lastState, block ] );
					break;
				}

				case 'widgetRemoved': {
					const { widgetId } = event;
					setState( ( lastState ) =>
						lastState.filter(
							( { attributes: { __internalWidgetId } } ) =>
								__internalWidgetId !== widgetId
						)
					);
					break;
				}

				case 'widgetChanged': {
					const { widgetId } = event;
					const blockToUpdate = state.find(
						( { attributes: { __internalWidgetId } } ) =>
							__internalWidgetId === widgetId
					);
					const updatedBlock = widgetToBlock(
						sidebar.getWidget( widgetId ),
						blockToUpdate
					);
					setState( ( lastState ) =>
						lastState.map( ( block ) =>
							block === blockToUpdate ? updatedBlock : block
						)
					);
					break;
				}

				case 'widgetsReordered':
					const { widgetIds } = event;

					setState( ( lastState ) => {
						const blocksByWidgetId = keyBy(
							lastState,
							'attributes.__internalWidgetId'
						);

						return widgetIds.map(
							( widgetId ) => blocksByWidgetId[ widgetId ]
						);
					} );
					break;
			}
		};

		return sidebar.subscribe( handler );
	}, [ sidebar ] );

	const onChangeBlocks = useCallback(
		( _nextBlocks ) => {
			ignoreIncoming.current = true;

			setState( ( lastState ) => {
				const blocksByWidgetId = keyBy(
					lastState,
					( block ) => block.attributes.__internalWidgetId
				);

				const nextBlocks = _nextBlocks.map( ( nextBlock, index ) => {
					if (
						nextBlock.attributes.__internalWidgetId &&
						nextBlock.attributes.__internalWidgetId in
							blocksByWidgetId
					) {
						const block =
							blocksByWidgetId[
								nextBlock.attributes.__internalWidgetId
							];
						if ( ! isEqual( block, nextBlock ) ) {
							const widgetId =
								nextBlock.attributes.__internalWidgetId;
							const widgetToUpdate = sidebar.getWidget(
								widgetId
							);
							const widget = blockToWidget(
								nextBlock,
								widgetToUpdate
							);
							sidebar.updateWidget( widget );
						}
						return nextBlock;
					}

					const widget = blockToWidget( nextBlock );
					const widgetId = sidebar.addWidget( widget, index );
					return {
						...nextBlock,
						attributes: {
							...nextBlock.attributes,
							__internalWidgetId: widgetId,
						},
					};
				} );

				const seen = nextBlocks.map(
					( block ) => block.attributes.__internalWidgetId
				);

				for ( const block of lastState ) {
					const widgetId = block.attributes.__internalWidgetId;
					if ( ! seen.includes( widgetId ) ) {
						sidebar.removeWidget( widgetId );
					}
				}

				if (
					nextBlocks.length === lastState.length &&
					! isEqual(
						nextBlocks.map(
							( { attributes: { __internalWidgetId } } ) =>
								__internalWidgetId
						),
						lastState.map(
							( { attributes: { __internalWidgetId } } ) =>
								__internalWidgetId
						)
					)
				) {
					const order = nextBlocks.map(
						( { attributes: { __internalWidgetId } } ) =>
							__internalWidgetId
					);
					sidebar.setWidgetIds( order );
				}

				ignoreIncoming.current = false;

				return nextBlocks;
			} );
		},
		[ sidebar ]
	);

	return [ state, onChangeBlocks, onChangeBlocks ];
}
