/**
 * External dependencies
 */
import { some, groupBy } from 'lodash';

/**
 * WordPress dependencies
 */
import { Button, withFocusReturn } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { useState, useCallback } from '@wordpress/element';
import { close as closeIcon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import EntityTypeList from './entity-type-list';

const TRANSLATED_SITE_PROTPERTIES = {
	title: __( 'Title' ),
	description: __( 'Tagline' ),
	sitelogo: __( 'Logo' ),
	show_on_front: __( 'Show on front' ),
	page_on_front: __( 'Page on front' ),
};

function EntitiesSavedStates( { isOpen, close } ) {
	const { dirtyEntityRecords } = useSelect( ( select ) => {
		const dirtyRecords = select(
			'core'
		).__experimentalGetDirtyEntityRecords();

		// Remove site object and decouple into its edited pieces.
		const dirtyRecordsWithoutSite = dirtyRecords.filter(
			( record ) => ! ( record.kind === 'root' && record.name === 'site' )
		);

		const siteEdits = select( 'core' ).getEntityRecordEdits(
			'root',
			'site'
		);

		const siteEditsAsEntities = [];
		for ( const field in siteEdits ) {
			siteEditsAsEntities.push( {
				kind: 'root',
				name: 'site',
				title: TRANSLATED_SITE_PROTPERTIES[ field ] || field,
				key: field,
			} );
		}
		const dirtyRecordsWithSiteItems = [
			...dirtyRecordsWithoutSite,
			...siteEditsAsEntities,
		];

		return {
			dirtyEntityRecords: dirtyRecordsWithSiteItems,
		};
	}, [] );
	const { saveEditedEntityRecord } = useDispatch( 'core' );

	// To group entities by type.
	const partitionedSavables = Object.values(
		groupBy( dirtyEntityRecords, 'name' )
	);

	// Unchecked entities to be ignored by save function.
	const [ unselectedEntities, _setUnselectedEntities ] = useState( [] );

	const setUnselectedEntities = ( { kind, name, key }, checked ) => {
		if ( checked ) {
			_setUnselectedEntities(
				unselectedEntities.filter(
					( elt ) =>
						elt.kind !== kind ||
						elt.name !== name ||
						elt.key !== key
				)
			);
		} else {
			_setUnselectedEntities( [
				...unselectedEntities,
				{ kind, name, key },
			] );
		}
	};

	const saveCheckedEntities = () => {
		const entitiesToSave = dirtyEntityRecords.filter(
			( { kind, name, key } ) => {
				return ! some(
					unselectedEntities,
					( elt ) =>
						elt.kind === kind &&
						elt.name === name &&
						elt.key === key
				);
			}
		);

		close( entitiesToSave );

		entitiesToSave.forEach( ( { kind, name, key } ) => {
			saveEditedEntityRecord( kind, name, key );
		} );
	};

	// Explicitly define this with no argument passed.  Using `close` on
	// its own will use the event object in place of the expected saved entities.
	const dismissPanel = useCallback( () => close(), [ close ] );

	return isOpen ? (
		<div className="entities-saved-states__panel">
			<div className="entities-saved-states__panel-header">
				<Button
					isPrimary
					disabled={
						dirtyEntityRecords.length -
							unselectedEntities.length ===
						0
					}
					onClick={ saveCheckedEntities }
					className="editor-entities-saved-states__save-button"
				>
					{ __( 'Save' ) }
				</Button>
				<Button
					onClick={ dismissPanel }
					icon={ closeIcon }
					label={ __( 'Close panel' ) }
				/>
			</div>

			<div className="entities-saved-states__text-prompt">
				<strong>{ __( 'Select the changes you want to save' ) }</strong>
				<p>
					{ __(
						'Some changes may affect other areas of your site.'
					) }
				</p>
			</div>

			{ partitionedSavables.map( ( list ) => {
				return (
					<EntityTypeList
						key={ list[ 0 ].name }
						list={ list }
						closePanel={ dismissPanel }
						unselectedEntities={ unselectedEntities }
						setUnselectedEntities={ setUnselectedEntities }
					/>
				);
			} ) }
		</div>
	) : null;
}

export default withFocusReturn( EntitiesSavedStates );
