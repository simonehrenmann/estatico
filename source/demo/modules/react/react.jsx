/*!
 * React demo
 *
 * @author
 * @copyright
 */

import $ from 'jquery';
import React from 'react';
import ReactDOM from 'react-dom';

var container = $('[data-init~="react"]');

if (container.length) {
	ReactDOM.render(
		<h1>Hello React world!</h1>,
		container[0]
	);
}
