/* eslint-disable no-alert */
/* globals alert */
/**
 * Internal dependencies
 */
import { ItemGroup, Item } from '..';
import { Popover } from '../../popover';
import { Button } from '../../button';

export default {
	component: ItemGroup,
	title: 'G2 Components (Experimental)/ItemGroup',
};

export const _default = () => (
	<ItemGroup css={ { width: '350px' } } bordered rounded>
		<Item action onClick={ () => alert( 'WordPress.org' ) }>
			Code is Poetry — Click me!
		</Item>
		<Item action onClick={ () => alert( 'WordPress.org' ) }>
			Code is Poetry — Click me!
		</Item>
		<Item action onClick={ () => alert( 'WordPress.org' ) }>
			Code is Poetry — Click me!
		</Item>
		<Item action onClick={ () => alert( 'WordPress.org' ) }>
			Code is Poetry — Click me!
		</Item>
	</ItemGroup>
);

export const nonAction = () => (
	<ItemGroup css={ { width: '350px' } } bordered rounded>
		<Item onClick={ () => alert( 'WordPress.org' ) }>
			Code is Poetry — Click me!
		</Item>
		<Item onClick={ () => alert( 'WordPress.org' ) }>
			Code is Poetry — Click me!
		</Item>
		<Item onClick={ () => alert( 'WordPress.org' ) }>
			Code is Poetry — Click me!
		</Item>
		<Item onClick={ () => alert( 'WordPress.org' ) }>
			Code is Poetry — Click me!
		</Item>
	</ItemGroup>
);

export const dropdownMenu = () => (
	<Popover
		css={ { width: '350px' } }
		trigger={ <Button>Open Popover</Button> }
	>
		<ItemGroup bordered={ false } rounded separated>
			<Item>This is a heading.</Item>
			<Item action onClick={ () => alert( 'WordPress.org' ) }>
				Code is Poetry — Click me!
			</Item>
			<Item action onClick={ () => alert( 'WordPress.org' ) }>
				Code is Poetry — Click me!
			</Item>
			<Item action onClick={ () => alert( 'WordPress.org' ) }>
				Code is Poetry — Click me!
			</Item>
			<Item action onClick={ () => alert( 'WordPress.org' ) }>
				Code is Poetry — Click me!
			</Item>
			<Item>This is a footer.</Item>
		</ItemGroup>
	</Popover>
);
/* eslint-enable no-alert */
