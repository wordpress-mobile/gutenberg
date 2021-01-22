/**
 * WordPress dependencies
 */
import {
	visitAdminPage,
	deactivatePlugin,
	activatePlugin,
	activateTheme,
} from '@wordpress/e2e-test-utils';

/**
 * External dependencies
 */
import { find, findAll } from 'puppeteer-testing-library';
import { groupBy, mapValues } from 'lodash';

/** @typedef {import('puppeteer').ElementHandle} ElementHandle */

describe( 'Widgets screen', () => {
	beforeEach( async () => {
		await visitAdminPage( 'themes.php', 'page=gutenberg-widgets' );
		// Wait for the widget areas to load.
		await findAll( {
			role: 'group',
			name: 'Block: Widget Area',
		} );
	} );

	afterEach( async () => {
		await cleanupWidgets();
	} );

	beforeAll( async () => {
		// TODO: Ideally we can bundle our test theme directly in the repo.
		await activateTheme( 'twentytwenty' );
		await deactivatePlugin(
			'gutenberg-test-plugin-disables-the-css-animations'
		);
		await cleanupWidgets();
	} );

	afterAll( async () => {
		await activatePlugin(
			'gutenberg-test-plugin-disables-the-css-animations'
		);
		await activateTheme( 'twentytwentyone' );
	} );

	async function getParagraphBlockInGlobalInserter() {
		const topBar = await find( {
			role: 'region',
			name: 'Widgets top bar',
		} );

		const addBlockButton = await find(
			{
				role: 'button',
				name: 'Add block',
				pressed: false,
			},
			{ root: topBar }
		);
		await addBlockButton.click();

		const blockLibrary = await find( {
			role: 'region',
			name: 'Block Library',
		} );

		// Check that there are categorizations in the inserter (#26329).
		const categoryHeaders = await findAll(
			{
				role: 'heading',
				level: 2,
			},
			{
				root: blockLibrary,
			}
		);
		expect( categoryHeaders.length > 0 ).toBe( true );

		const addParagraphBlock = await find(
			{
				role: 'option',
				name: 'Paragraph',
			},
			{
				root: blockLibrary,
			}
		);

		return addParagraphBlock;
	}

	/*
	async function expectInsertionPointIndicatorToBeBelowLastBlock(
		widgetArea
	) {
		const childBlocks = await findAll(
			{ selector: '[data-block]' },
			{ root: widgetArea }
		);
		const lastBlock = childBlocks[ childBlocks.length - 1 ];
		const lastBlockBoundingBox = await lastBlock.boundingBox();

		// TODO: Probably need a more accessible way to select this, maybe a test ID or data attribute.
		const insertionPointIndicator = await find( {
			selector: '.block-editor-block-list__insertion-point-indicator',
		} );
		const insertionPointIndicatorBoundingBox = await insertionPointIndicator.boundingBox();

		expect(
			insertionPointIndicatorBoundingBox.y > lastBlockBoundingBox.y
		).toBe( true );
	}
	*/

	async function getInlineInserterButton() {
		return await find( {
			role: 'combobox',
			name: 'Add block',
		} );
	}

	it( 'Should insert content using the global inserter', async () => {
		const widgetAreas = await findAll( {
			role: 'group',
			name: 'Block: Widget Area',
		} );
		const [ firstWidgetArea ] = widgetAreas;

		let addParagraphBlock = await getParagraphBlockInGlobalInserter();
		await addParagraphBlock.hover();

		// FIXME: The insertion point indicator is not showing when the widget area has no blocks.
		// await expectInsertionPointIndicatorToBeBelowLastBlock(
		// 	firstWidgetArea
		// );

		await addParagraphBlock.click();

		const addedParagraphBlockInFirstWidgetArea = await find(
			{
				name: /^Empty block/,
				selector: '[data-block][data-type="core/paragraph"]',
			},
			{
				root: firstWidgetArea,
			}
		);

		await expect( addedParagraphBlockInFirstWidgetArea ).toHaveFocus();

		await page.keyboard.type( 'First Paragraph' );

		addParagraphBlock = await getParagraphBlockInGlobalInserter();
		await addParagraphBlock.hover();

		/*await expectInsertionPointIndicatorToBeBelowLastBlock(
			firstWidgetArea
		);*/
		await addParagraphBlock.click();

		await page.keyboard.type( 'Second Paragraph' );

		/**
		 * FIXME: There seems to have a bug when saving the widgets
		 */
		// await secondWidgetArea.click();

		// addParagraphBlock = await getParagraphBlockInGlobalInserter();
		// await addParagraphBlock.hover();

		// // FIXME: The insertion point indicator is not showing when the widget area has no blocks.
		// // await expectInsertionPointIndicatorToBeBelowLastBlock(
		// // 	secondWidgetArea
		// // );

		// await addParagraphBlock.click();

		// const addedParagraphBlockInSecondWidgetArea = await secondWidgetArea.$(
		// 	'[data-block][data-type="core/paragraph"][aria-label^="Empty block"]'
		// );

		// expect(
		// 	await addedParagraphBlockInSecondWidgetArea.evaluate(
		// 		( node ) => node === document.activeElement
		// 	)
		// ).toBe( true );

		// await page.keyboard.type( 'Third Paragraph' );

		await saveWidgets();
		const serializedWidgetAreas = await getSerializedWidgetAreas();
		expect( serializedWidgetAreas ).toMatchInlineSnapshot( `
		Object {
		  "sidebar-1": "<div class=\\"widget widget_block\\"><div class=\\"widget-content\\">
		<p>First Paragraph</p>
		</div></div>
		<div class=\\"widget widget_block\\"><div class=\\"widget-content\\">
		<p>Second Paragraph</p>
		</div></div>",
		}
	` );
	} );

	it( 'Should insert content using the inline inserter', async () => {
		const [ firstWidgetArea ] = await findAll( {
			role: 'group',
			name: 'Block: Widget Area',
		} );

		// Scroll to the end of the first widget area.
		await firstWidgetArea.evaluate( ( node ) =>
			node.scrollIntoView( { block: 'end' } )
		);

		const firstWidgetAreaBoundingBox = await firstWidgetArea.boundingBox();

		// Click near the end of the widget area to select it.
		await page.mouse.click(
			firstWidgetAreaBoundingBox.x + firstWidgetAreaBoundingBox.width / 2,
			firstWidgetAreaBoundingBox.y +
				firstWidgetAreaBoundingBox.height -
				10
		);

		let inlineInserterButton = await getInlineInserterButton();
		await inlineInserterButton.click();

		let inlineQuickInserter = await find( {
			role: 'listbox',
			name: 'Blocks',
		} );

		const paragraphBlock = await find(
			{
				role: 'option',
				name: 'Paragraph',
			},
			{
				root: inlineQuickInserter,
			}
		);
		await paragraphBlock.click();

		const firstParagraphBlock = await find(
			{
				name: /^Empty block/,
				selector: '[data-block][data-type="core/paragraph"]',
			},
			{
				root: firstWidgetArea,
			}
		);

		await expect( firstParagraphBlock ).toHaveFocus();

		await page.keyboard.type( 'First Paragraph' );

		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Second Paragraph' );

		const secondParagraphBlock = await page.evaluateHandle(
			() => document.activeElement
		);
		await expect( secondParagraphBlock ).not.toBeElement(
			firstParagraphBlock
		);

		const secondParagraphBlockBoundingBox = await secondParagraphBlock.boundingBox();

		// Click outside the block to move the focus back to the widget area.
		await page.mouse.click(
			secondParagraphBlockBoundingBox.x +
				firstWidgetAreaBoundingBox.width / 2,
			secondParagraphBlockBoundingBox.y +
				secondParagraphBlockBoundingBox.height +
				10
		);

		// Hover above the last block to trigger the inline inserter between blocks.
		await page.mouse.move(
			secondParagraphBlockBoundingBox.x +
				secondParagraphBlockBoundingBox.width / 2,
			secondParagraphBlockBoundingBox.y - 10
		);

		inlineInserterButton = await getInlineInserterButton();
		await inlineInserterButton.click();

		const inserterSearchBox = await find( {
			role: 'searchbox',
			name: 'Search for a block',
		} );
		await expect( inserterSearchBox ).toHaveFocus();

		await page.keyboard.type( 'Heading' );

		inlineQuickInserter = await find( {
			role: 'listbox',
			name: 'Blocks',
		} );
		const headingBlockOption = await find(
			{
				role: 'option',
				name: 'Heading',
			},
			{
				root: inlineQuickInserter,
			}
		);
		await headingBlockOption.click();

		// Get the added heading block as second last block.
		const addedHeadingBlock = await secondParagraphBlock.evaluateHandle(
			( node ) => node.previousSibling
		);

		await expect( addedHeadingBlock ).toHaveFocus();

		await page.keyboard.type( 'My Heading' );

		await expect( addedHeadingBlock ).toMatchQuery( {
			name: 'Block: Heading',
			level: 2,
			value: 'My Heading',
		} );

		await saveWidgets();
		const serializedWidgetAreas = await getSerializedWidgetAreas();
		expect( serializedWidgetAreas ).toMatchInlineSnapshot( `
		Object {
		  "sidebar-1": "<div class=\\"widget widget_block\\"><div class=\\"widget-content\\">
		<p>First Paragraph</p>
		</div></div>
		<div class=\\"widget widget_block\\"><div class=\\"widget-content\\">
		<h2>My Heading</h2>
		</div></div>
		<div class=\\"widget widget_block\\"><div class=\\"widget-content\\">
		<p>Second Paragraph</p>
		</div></div>",
		}
	` );
	} );
} );

async function saveWidgets() {
	const [ updateButton ] = await page.$x( '//button[text()="Update"]' );
	await updateButton.click();

	await page.waitForXPath( '//*[text()="Widgets saved."]' );

	// FIXME: The snackbar above is enough for the widget areas to get saved,
	// but not enough for the widgets to get saved.
	// eslint-disable-next-line no-restricted-syntax
	await page.waitForTimeout( 500 );
}

async function getSerializedWidgetAreas() {
	const widgets = await page.evaluate( () =>
		wp.data.select( 'core' ).getWidgets()
	);

	const serializedWidgetAreas = mapValues(
		groupBy( widgets, 'sidebar' ),
		( sidebarWidgets ) =>
			sidebarWidgets
				.map( ( widget ) => widget.rendered )
				.filter( Boolean )
				.join( '\n' )
	);

	return serializedWidgetAreas;
}

/**
 * TODO: Deleting widgets in the new widgets screen seems to be unreliable.
 * We visit the old widgets screen to delete them.
 * Refactor this to use real interactions in the new widgets screen once the bug is fixed.
 */
async function cleanupWidgets() {
	await visitAdminPage( 'widgets.php' );

	let widget = await page.$( '.widgets-sortables .widget' );

	// We have to do this one-by-one since there might be race condition when deleting multiple widgets at once.
	while ( widget ) {
		const deleteButton = await widget.$( 'button.widget-control-remove' );
		const id = await widget.evaluate( ( node ) => node.id );
		await deleteButton.evaluate( ( node ) => node.click() );
		// Wait for the widget to be removed from DOM.
		await page.waitForSelector( `#${ id }`, { hidden: true } );

		widget = await page.$( '.widgets-sortables .widget' );
	}
}
