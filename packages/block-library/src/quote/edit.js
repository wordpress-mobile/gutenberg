/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	AlignmentToolbar,
	BlockControls,
	InnerBlocks,
	RichText,
	useBlockProps,
} from '@wordpress/block-editor';
import { BlockQuotation } from '@wordpress/components';
import { createBlock } from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';

export default function QuoteEdit( {
	attributes,
	setAttributes,
	isSelected,
	className,
	insertBlocksAfter,
	mergedStyle,
	clientId,
} ) {
	const { align, citation } = attributes;
	const blockProps = useBlockProps( {
		className: classnames( className, {
			[ `has-text-align-${ align }` ]: align,
		} ),
		style: mergedStyle,
	} );

	const { isAncestorOfSelectedBlock } = useSelect(
		( select ) => {
			const { hasSelectedInnerBlock } = select( 'core/block-editor' );

			return {
				isAncestorOfSelectedBlock: hasSelectedInnerBlock(
					clientId,
					true
				),
			};
		},
		[ clientId ]
	);

	return (
		<>
			<BlockControls>
				<AlignmentToolbar
					value={ align }
					onChange={ ( nextAlign ) => {
						setAttributes( { align: nextAlign } );
					} }
				/>
			</BlockControls>
			<BlockQuotation { ...blockProps }>
				<InnerBlocks
					allowedBlocks={ [
						'core/code',
						'core/heading',
						'core/list',
						'core/paragraph',
					] }
				/>
				{ ( ! RichText.isEmpty( citation ) ||
					isSelected ||
					isAncestorOfSelectedBlock ) && (
					<RichText
						identifier="citation"
						value={ citation }
						onChange={ ( nextCitation ) =>
							setAttributes( {
								citation: nextCitation,
							} )
						}
						__unstableMobileNoFocusOnMount
						aria-label={ __( 'Quote citation text' ) }
						placeholder={
							// translators: placeholder text used for the citation
							__( 'Write citation…' )
						}
						className="wp-block-quote__citation"
						textAlign={ align }
						__unstableOnSplitAtEnd={ () =>
							insertBlocksAfter( createBlock( 'core/paragraph' ) )
						}
					/>
				) }
			</BlockQuotation>
		</>
	);
}
