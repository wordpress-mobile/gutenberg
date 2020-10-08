/**
 * WordPress dependencies
 */
import {
	createBlock,
	parseWithAttributeSchema,
	serialize,
	switchToBlockType,
} from '@wordpress/blocks';
import { create, join, split, toHTMLString } from '@wordpress/rich-text';

const toBlocksOfType = ( blocks, type ) => {
	const result = [];
	blocks.forEach( ( block ) => {
		if ( type === block.name ) {
			result.push( block );
		} else {
			const newBlocks = switchToBlockType( block, type );
			if ( newBlocks ) {
				result.push( ...newBlocks );
			}
		}
	} );
	return result.filter( Boolean );
};

const transforms = {
	from: [
		{
			type: 'block',
			isMultiBlock: true,
			blocks: [ 'core/paragraph' ],
			transform: ( attributes ) => {
				return createBlock(
					'core/quote',
					{},
					attributes.map( ( props ) =>
						createBlock( 'core/paragraph', props )
					)
				);
			},
		},
		{
			type: 'block',
			isMultiBlock: true,
			blocks: [ 'core/heading' ],
			transform: ( attributes ) => {
				return createBlock(
					'core/quote',
					{},
					attributes.map( ( props ) =>
						createBlock( 'core/heading', props )
					)
				);
			},
		},
		{
			type: 'block',
			blocks: [ 'core/pullquote' ],
			transform: ( { value, citation, anchor } ) => {
				return createBlock(
					'core/quote',
					{
						citation,
						anchor,
					},
					parseWithAttributeSchema( value, {
						type: 'array',
						source: 'query',
						selector: 'p',
						query: {
							content: {
								type: 'string',
								source: 'text',
							},
						},
					} ).map( ( { content } ) =>
						createBlock( 'core/paragraph', { content } )
					)
				);
			},
		},
		{
			type: 'prefix',
			prefix: '>',
			transform: () => createBlock( 'core/quote' ),
		},
		{
			type: 'raw',
			isMatch: ( node ) => {
				const isParagraphOrSingleCite = ( () => {
					let hasCitation = false;
					return ( child ) => {
						// Child is a paragraph.
						if ( child.nodeName === 'P' ) {
							return true;
						}
						// Child is a cite and no other cite child exists before it.
						if ( ! hasCitation && child.nodeName === 'CITE' ) {
							hasCitation = true;
							return true;
						}
					};
				} )();
				return (
					node.nodeName === 'BLOCKQUOTE' &&
					// The quote block can only handle multiline paragraph
					// content with an optional cite child.
					Array.from( node.childNodes ).every(
						isParagraphOrSingleCite
					)
				);
			},
			schema: ( { phrasingContentSchema } ) => ( {
				blockquote: {
					children: {
						p: {
							children: phrasingContentSchema,
						},
						cite: {
							children: phrasingContentSchema,
						},
					},
				},
			} ),
		},
	],
	to: [
		{
			type: 'block',
			blocks: [ 'core/paragraph' ],
			transform: ( { citation }, innerBlocks ) => {
				const paragraphs = toBlocksOfType(
					innerBlocks,
					'core/paragraph'
				);
				if ( citation && citation !== '<p></p>' ) {
					paragraphs.push(
						createBlock( 'core/paragraph', {
							content: citation,
						} )
					);
				}

				if ( paragraphs.length === 0 ) {
					return createBlock( 'core/paragraph', {
						content: '',
					} );
				}
				return paragraphs;
			},
		},

		{
			type: 'block',
			blocks: [ 'core/heading' ],
			transform: ( { value, citation, ...attrs } ) => {
				// If there is no quote content, use the citation as the
				// content of the resulting heading. A nonexistent citation
				// will result in an empty heading.
				if ( value === '<p></p>' ) {
					return createBlock( 'core/heading', {
						content: citation,
					} );
				}

				const pieces = split(
					create( { html: value, multilineTag: 'p' } ),
					'\u2028'
				);

				const headingBlock = createBlock( 'core/heading', {
					content: toHTMLString( { value: pieces[ 0 ] } ),
				} );

				if ( ! citation && pieces.length === 1 ) {
					return headingBlock;
				}

				const quotePieces = pieces.slice( 1 );

				const quoteBlock = createBlock( 'core/quote', {
					...attrs,
					citation,
					value: toHTMLString( {
						value: quotePieces.length
							? join( pieces.slice( 1 ), '\u2028' )
							: create(),
						multilineTag: 'p',
					} ),
				} );

				return [ headingBlock, quoteBlock ];
			},
		},

		{
			type: 'block',
			blocks: [ 'core/pullquote' ],
			transform: ( { citation, anchor }, innerBlocks ) => {
				return createBlock( 'core/pullquote', {
					value: serialize(
						toBlocksOfType( innerBlocks, 'core/paragraph' )
					),
					citation,
					anchor,
				} );
			},
		},
	],
};

export default transforms;
